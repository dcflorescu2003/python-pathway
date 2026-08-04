const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";
import Stripe from "https://esm.sh/stripe@18.5.0";

// Profesor AI product IDs
const TEACHER_PRODUCT_IDS = [
  "prod_UJyuT97MzPvyj8",
  "prod_UJyudq2JiikIbg",
];

const MAX_AI_ITEMS_PER_TEST = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { submission_id, answers: inlineAnswers, auto_submitted_reason } = body;
    if (!submission_id) {
      return new Response(JSON.stringify({ error: "Missing submission_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // SECURITY: authenticate caller and verify they own the submission.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;

    const { data: ownerSub } = await supabase
      .from("test_submissions")
      .select("student_id, assignment_id, test_assignments(test_id, tests(teacher_id))")
      .eq("id", submission_id)
      .single();

    if (!ownerSub) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const teacherId = (ownerSub as any).test_assignments?.tests?.teacher_id;
    const isOwner = ownerSub.student_id === callerId;
    const isTeacher = teacherId && teacherId === callerId;
    if (!isOwner && !isTeacher) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If answers were sent inline (normal submit / keepalive on browser close),
    // persist them idempotently and mark submission as submitted before grading.
    if (inlineAnswers && Array.isArray(inlineAnswers) && inlineAnswers.length > 0) {
      const { data: existingAnswers } = await supabase
        .from("test_answers")
        .select("id, test_item_id")
        .eq("submission_id", submission_id)
        .in("test_item_id", inlineAnswers.map((a: any) => a.test_item_id).filter(Boolean));

      const existingByItem = new Map<string, string>();
      for (const row of existingAnswers || []) {
        if (!existingByItem.has(row.test_item_id)) existingByItem.set(row.test_item_id, row.id);
      }

      for (const a of inlineAnswers) {
        if (!a?.test_item_id) continue;
        const payload = {
          answer_data: a.answer_data ?? null,
          max_points: a.max_points,
          score: 0,
          feedback: null,
          ai_reviewed: false,
        };
        const existingId = existingByItem.get(a.test_item_id);
        if (existingId) {
          const { error: updErr } = await supabase
            .from("test_answers")
            .update(payload)
            .eq("id", existingId);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await supabase
            .from("test_answers")
            .insert({
              submission_id,
              test_item_id: a.test_item_id,
              ...payload,
            });
          if (insErr) throw insErr;
        }
      }

      // Mark as submitted if not already, and fix older inconsistent rows whose
      // submitted_at was set but status stayed in_progress/interrupted.
      const { data: sub } = await supabase
        .from("test_submissions")
        .select("submitted_at")
        .eq("id", submission_id)
        .single();

      const updatePayload: Record<string, any> = {
        status: "submitted",
        submitted_at: sub?.submitted_at || new Date().toISOString(),
      };
      if (auto_submitted_reason) updatePayload.auto_submitted_reason = auto_submitted_reason;
      const { error: subUpdateErr } = await supabase
        .from("test_submissions")
        .update(updatePayload)
        .eq("id", submission_id);
      if (subUpdateErr) throw subUpdateErr;
    }

    // Get submission + answers
    const { data: submission } = await supabase
      .from("test_submissions")
      .select("*")
      .eq("id", submission_id)
      .single();

    if (!submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: answers } = await supabase
      .from("test_answers")
      .select("*, test_items(*)")
      .eq("submission_id", submission_id);

    if (!answers || answers.length === 0) {
      return new Response(JSON.stringify({ error: "No answers found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine teacher and check Profesor AI subscription
    let teacherHasAI = false;
    let aiGradingItemIds: string[] = [];
    let officePoints = 10;
    const firstItem = answers[0]?.test_items;
    if (firstItem?.test_id) {
      const { data: test } = await supabase
        .from("tests")
        .select("teacher_id, ai_grading_item_ids, office_points")
        .eq("id", firstItem.test_id)
        .single();

      aiGradingItemIds = (test as any)?.ai_grading_item_ids ?? [];
      officePoints = (test as any)?.office_points ?? 10;

      if (test) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("teacher_status")
          .eq("user_id", test.teacher_id)
          .single();

        if (profile?.teacher_status === "verified") {
          const nowIso = new Date().toISOString();

          // 1) Coupon-based teacher premium
          try {
            const { data: redemptions } = await supabase
              .from("coupon_redemptions")
              .select("premium_until, coupon_type")
              .eq("user_id", test.teacher_id)
              .eq("coupon_type", "teacher")
              .gt("premium_until", nowIso)
              .order("premium_until", { ascending: false })
              .limit(1);
            if (redemptions && redemptions.length > 0) {
              teacherHasAI = true;
              console.log("[grade-submission] teacherHasAI via coupon");
            }
          } catch (e) {
            console.error("Coupon check error:", e);
          }

          // 2) Native (Play / iOS) billing for Profesor AI products
          if (!teacherHasAI) {
            try {
              const { data: nativeSubs } = await supabase
                .from("play_billing_subscriptions")
                .select("product_id, expiry_time, is_active")
                .eq("user_id", test.teacher_id)
                .eq("is_active", true)
                .gt("expiry_time", nowIso)
                .in("product_id", TEACHER_PRODUCT_IDS)
                .limit(1);
              if (nativeSubs && nativeSubs.length > 0) {
                teacherHasAI = true;
                console.log("[grade-submission] teacherHasAI via native billing");
              }
            } catch (e) {
              console.error("Native billing check error:", e);
            }
          }

          // 3) Stripe fallback
          if (!teacherHasAI) {
            const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
            if (stripeKey) {
              try {
                const { data: authUser } = await supabase.auth.admin.getUserById(test.teacher_id);
                if (authUser?.user?.email) {
                  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
                  const customers = await stripe.customers.list({ email: authUser.user.email, limit: 1 });
                  if (customers.data.length > 0) {
                    const subs = await stripe.subscriptions.list({
                      customer: customers.data[0].id,
                      status: "active",
                      limit: 10,
                    });
                    for (const sub of subs.data) {
                      const productId = sub.items?.data?.[0]?.price?.product;
                      const prodStr = typeof productId === "string" ? productId : productId?.id;
                      if (prodStr && TEACHER_PRODUCT_IDS.includes(prodStr)) {
                        teacherHasAI = true;
                        console.log("[grade-submission] teacherHasAI via stripe");
                        break;
                      }
                    }
                  }
                }
              } catch (e) {
                console.error("Stripe check error:", e);
              }
            }
          }
        }

      }
    }

    // First pass: grade exercises and collect problems/open_answers for batch AI
    let totalScore = 0;
    let maxScore = 0;

    interface ItemForAI {
      answerId: string;
      answerIdx: number;
      studentCode: string;
      solution: string;
      testCases: any;
      maxPoints: number;
      basicScore: number;
      basicFeedback: string;
      problemTitle: string;
      aiType: "problem" | "open_answer";
      studentText?: string;
      questionText?: string;
    }
    const itemsForAI: ItemForAI[] = [];

    // Helper: stable AI key matching the one produced by TestBuilder UI
    const getAIKey = (item: any): string => {
      if (item.source_type === "custom") {
        const k = item.custom_data?._ai_key;
        return k ? `custom:${k}` : `custom:unknown`;
      }
      return `${item.source_type}:${item.source_id ?? ""}`;
    };

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const item = answer.test_items;
      if (!item) continue;

      maxScore += item.points;
      let score = 0;
      let feedback = "";

      const isEvalBank = typeof item.source_id === "string" && item.source_id.startsWith("eval-");
      const itemAIKey = getAIKey(item);

      if (item.source_type === "exercise" && item.source_id && !isEvalBank) {
        const { data: exercise } = await supabase
          .from("exercises")
          .select("*")
          .eq("id", item.source_id)
          .single();

        if (exercise) {
          score = gradeExercise(exercise, answer.answer_data, item.points);
        }
      } else if (item.source_type === "exercise" && item.source_id && isEvalBank) {
        const { data: ev } = await supabase
          .from("eval_exercises")
          .select("*")
          .eq("id", item.source_id)
          .single();
        if (ev) {
          if (ev.type === "open_answer") {
            // Eval-bank open_answer: same flow as custom open_answer
            score = 0;
            feedback = "Necesită evaluare manuală sau AI.";
            const shouldAIGrade = aiGradingItemIds.length > 0
              ? aiGradingItemIds.includes(itemAIKey)
              : itemsForAI.length < MAX_AI_ITEMS_PER_TEST;
            if (teacherHasAI && answer.answer_data?.text && shouldAIGrade) {
              itemsForAI.push({
                answerId: answer.id,
                answerIdx: i,
                studentCode: "",
                solution: "",
                testCases: null,
                maxPoints: item.points,
                basicScore: 0,
                basicFeedback: feedback,
                problemTitle: (ev.question ?? "").split("\n")[0]?.substring(0, 80) || "Răspuns deschis",
                aiType: "open_answer",
                studentText: answer.answer_data.text,
                questionText: ev.question,
              });
            }
          } else {
            score = gradeExercise(ev, answer.answer_data, item.points);
          }
        }
      } else if (item.source_type === "problem" && item.source_id) {
        const problemSource = isEvalBank ? "eval_exercises" : "problems";
        const selectCols = isEvalBank ? "test_cases, solution, question" : "test_cases, solution, title";
        const { data: problemRow } = await supabase
          .from(problemSource)
          .select(selectCols)
          .eq("id", item.source_id)
          .single();

        const problem = problemRow
          ? (isEvalBank
              ? {
                  test_cases: (problemRow as any).test_cases,
                  solution: (problemRow as any).solution ?? "",
                  title: ((problemRow as any).question ?? "").split("\n")[0]?.substring(0, 80) || item.source_id,
                }
              : (problemRow as any))
          : null;

        if (problem && answer.answer_data?.code) {
          const result = gradeProblemBasic(problem, answer.answer_data.code, item.points);
          score = result.score;
          feedback = result.feedback;

          // Collect for batch AI if teacher has Profesor AI and score < max
          const shouldAIGrade = aiGradingItemIds.length > 0
            ? aiGradingItemIds.includes(itemAIKey)
            : itemsForAI.length < MAX_AI_ITEMS_PER_TEST;
          if (teacherHasAI && score < item.points && shouldAIGrade) {
            itemsForAI.push({
              answerId: answer.id,
              answerIdx: i,
              studentCode: answer.answer_data.code,
              solution: problem.solution,
              testCases: problem.test_cases,
              maxPoints: item.points,
              basicScore: score,
              basicFeedback: feedback,
              problemTitle: problem.title || item.source_id,
              aiType: "problem",
            });
          }
        }
      } else if (item.source_type === "custom" && item.custom_data) {
        if (item.custom_data.type === "open_answer") {
          // Open answer: score 0 automatically, collect for AI
          score = 0;
          feedback = "Necesită evaluare manuală sau AI.";
          const shouldAIGrade = aiGradingItemIds.length > 0
            ? aiGradingItemIds.includes(itemAIKey)
            : itemsForAI.length < MAX_AI_ITEMS_PER_TEST;
          if (teacherHasAI && answer.answer_data?.text && shouldAIGrade) {
            itemsForAI.push({
              answerId: answer.id,
              answerIdx: i,
              studentCode: "",
              solution: "",
              testCases: null,
              maxPoints: item.points,
              basicScore: 0,
              basicFeedback: feedback,
              problemTitle: item.custom_data.question || "Răspuns deschis",
              aiType: "open_answer",
              studentText: answer.answer_data.text,
              questionText: item.custom_data.question,
            });
          }
        } else {
          score = gradeExercise(item.custom_data, answer.answer_data, item.points);
        }
      }

      totalScore += score;

      await supabase
        .from("test_answers")
        .update({ score, feedback: feedback || null })
        .eq("id", answer.id);
    }

    // Batch AI review for all collected items in a single call
    if (itemsForAI.length > 0) {
      const aiResults = await batchAIReview(itemsForAI);
      if (aiResults) {
        for (const result of aiResults) {
          const item = itemsForAI.find(p => p.answerId === result.answerId);
          if (!item) continue;

          const finalScore = Math.max(item.basicScore, result.score);
          const scoreDelta = finalScore - item.basicScore;
          totalScore += scoreDelta;

          await supabase
            .from("test_answers")
            .update({
              score: finalScore,
              feedback: result.feedback,
              ai_reviewed: true,
            })
            .eq("id", result.answerId);
        }
      }
    }

    // Add office points
    totalScore += officePoints;
    maxScore += officePoints;

    // Update submission
    await supabase
      .from("test_submissions")
      .update({ total_score: totalScore, max_score: maxScore, auto_graded: true, status: "submitted" })
      .eq("id", submission_id);

    // Record competency scores from this test (silent failure)
    try {
      // Re-read final answer scores (some were updated after AI review)
      const { data: finalAnswers } = await supabase
        .from("test_answers")
        .select("score, max_points, test_items(id, source_type, source_id)")
        .eq("submission_id", submission_id);

      const competencyItems = (finalAnswers ?? [])
        .map((a: any) => {
          const ti = a.test_items;
          if (!ti) return null;
          let item_type: string;
          let item_id: string;
          if (ti.source_type === "custom") {
            item_type = "test_item";
            item_id = ti.id;
          } else if (ti.source_type === "predefined") {
            item_type = "predefined_test_item";
            item_id = ti.source_id ?? "";
          } else if (
            ti.source_type === "exercise" ||
            ti.source_type === "eval_exercise" ||
            ti.source_type === "manual_exercise" ||
            ti.source_type === "problem"
          ) {
            item_type = ti.source_type;
            item_id = ti.source_id ?? "";
          } else {
            return null;
          }
          if (!item_id) return null;
          return {
            item_type,
            item_id,
            score: Number(a.score ?? 0),
            max_score: Number(a.max_points ?? 0),
          };
        })
        .filter(Boolean);

      if (competencyItems.length > 0) {
        const { error: rpcError } = await supabase.rpc("recalculate_competency_scores", {
          p_user_id: submission.student_id,
          p_items: competencyItems as any,
        });
        if (rpcError) {
          console.warn("[grade-submission] competency RPC failed:", rpcError.message);
        }
      }
    } catch (err) {
      console.warn("[grade-submission] competency tracking error:", err);
    }

    return new Response(
      JSON.stringify({ total_score: totalScore, max_score: maxScore, ai_reviewed: itemsForAI.length > 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Grade error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function gradeExercise(exercise: any, answerData: any, maxPoints: number): number {
  if (!answerData) return 0;
  const type = exercise.type;

  const normalizeLoose = (value: unknown) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\u00A0/g, " ")
      .trim()
      .toLowerCase();

  if (type === "quiz") {
    const selected = answerData.selected ?? answerData.selected_option_id ?? answerData.answer;
    const correct = exercise.correct_option_id ?? exercise.correctOptionId;
    return normalizeLoose(selected) === normalizeLoose(correct) ? maxPoints : 0;
  }

  if (type === "truefalse") {
    const rawSelected = answerData.selected ?? answerData.value ?? answerData.answer;
    const toBool = (value: unknown): boolean | null => {
      if (typeof value === "boolean") return value;
      const normalized = normalizeLoose(value);
      if (["true", "adevarat", "adevărat", "a", "1", "da"].includes(normalized)) return true;
      if (["false", "fals", "f", "0", "nu"].includes(normalized)) return false;
      return null;
    };
    const selected = toBool(rawSelected);
    const correct = toBool(exercise.is_true ?? exercise.isTrue);
    return selected !== null && correct !== null && selected === correct ? maxPoints : 0;
  }

  if (type === "fill") {
    const blanks = (exercise.blanks || []) as { id?: string; key?: string; answer: string }[];
    if (blanks.length === 0) return 0;
    const normalize = (s: unknown) =>
      String(s ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, "")
        .toLowerCase()
        .trim();
    const splitAlternatives = (acceptedAnswers: string): string[] => {
      const parts: string[] = [];
      let buf = "";
      let depth = 0;
      let quote: '"' | "'" | null = null;
      for (const ch of String(acceptedAnswers ?? "")) {
        if (quote) {
          buf += ch;
          if (ch === quote) quote = null;
          continue;
        }
        if (ch === '"' || ch === "'") {
          quote = ch;
          buf += ch;
          continue;
        }
        if (ch === "(" || ch === "[" || ch === "{") depth++;
        else if (ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1);
        if (depth === 0 && (ch === "," || ch === "|" || ch === ";")) {
          parts.push(buf);
          buf = "";
        } else {
          buf += ch;
        }
      }
      parts.push(buf);
      return parts.map((p) => p.trim()).filter(Boolean);
    };
    const stripQuotes = (s: string) => {
      const t = s.trim();
      if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
        return t.slice(1, -1);
      }
      return t;
    };
    let correct = 0;
    for (const blank of blanks) {
      const key = blank.id ?? blank.key ?? "";
      const studentAnswer = normalize(answerData.blanks?.[key] || "");
      const acceptedAnswers = splitAlternatives(blank.answer).flatMap((a: string) => {
        const stripped = stripQuotes(a);
        return stripped === a.trim() ? [normalize(a)] : [normalize(a), normalize(stripped)];
      });
      if (acceptedAnswers.includes(studentAnswer)) correct++;
    }
    return Math.round((correct / blanks.length) * maxPoints);
  }

  if (type === "order") {
    const lines = (exercise.lines || []) as { id: string; text: string; order: number; group?: number }[];
    const sortedLines = [...lines].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const correctOrder = sortedLines.map((l) => l.id);
    const studentOrder = Array.isArray(answerData.order) ? answerData.order : [];
    if (studentOrder.length === 0) return 0;

    const linesById = new Map(lines.map((line) => [line.id, line]));
    const expectedTexts = sortedLines.map((line) => line.text);
    const studentTexts = studentOrder.map((id: string) => linesById.get(id)?.text ?? id);
    if (
      expectedTexts.length === studentTexts.length &&
      expectedTexts.every((text, idx) => text === studentTexts[idx])
    ) {
      return maxPoints;
    }

    const hasGroups = lines.some((line) => line.group !== undefined);
    if (hasGroups) {
      const groupMinOrder = new Map<number, number>();
      for (const line of lines) {
        if (line.group === undefined) continue;
        const current = groupMinOrder.get(line.group);
        if (current === undefined || line.order < current) groupMinOrder.set(line.group, line.order);
      }
      const effectiveOrder = (line: { order: number; group?: number }) =>
        line.group !== undefined ? (groupMinOrder.get(line.group) ?? line.order) : line.order;
      let inOrderPairs = 1;
      for (let i = 1; i < studentOrder.length; i++) {
        const prev = linesById.get(studentOrder[i - 1]);
        const current = linesById.get(studentOrder[i]);
        if (prev && current && effectiveOrder(current) >= effectiveOrder(prev)) inOrderPairs++;
      }
      return Math.round((inOrderPairs / correctOrder.length) * maxPoints);
    }

    let correctPositions = 0;
    for (let i = 0; i < correctOrder.length; i++) {
      if (studentOrder[i] === correctOrder[i] || studentTexts[i] === expectedTexts[i]) correctPositions++;
    }
    return Math.round((correctPositions / correctOrder.length) * maxPoints);
  }

  if (type === "match") {
    const pairs = (exercise.pairs || []) as { id: string; left: string; right: string }[];
    if (pairs.length === 0) return 0;
    let correct = 0;
    for (const pair of pairs) {
      const studentAnswer = answerData.matches?.[pair.id] || "";
      if (normalizeLoose(studentAnswer) === normalizeLoose(pair.id) || normalizeLoose(studentAnswer) === normalizeLoose(pair.right)) correct++;
    }
    return Math.round((correct / pairs.length) * maxPoints);
  }

  return 0;
}

function gradeProblemBasic(
  problem: { test_cases: any; solution: string },
  studentCode: string,
  maxPoints: number
): { score: number; feedback: string } {
  if (!studentCode.trim()) return { score: 0, feedback: "Cod gol" };

  const hasFunction = /def\s+\w+/.test(studentCode);
  const hasReturn = /return\s/.test(studentCode);
  const hasLoop = /for\s|while\s/.test(studentCode);
  const hasCondition = /if\s/.test(studentCode);
  const hasPrint = /print\s*\(/.test(studentCode);

  let structureScore = 0;
  if (hasFunction || hasPrint) structureScore += 0.2;
  if (hasReturn || hasPrint) structureScore += 0.1;
  if (hasLoop) structureScore += 0.1;
  if (hasCondition) structureScore += 0.1;

  const score = Math.round(Math.min(structureScore, 0.5) * maxPoints);
  return {
    score,
    feedback: `Punctaj structural: ${score}/${maxPoints}. Evaluarea completă necesită AI review.`,
  };
}

async function batchAIReview(
  items: { answerId: string; studentCode: string; solution: string; testCases: any; maxPoints: number; problemTitle: string; aiType: string; studentText?: string; questionText?: string }[]
): Promise<{ answerId: string; score: number; feedback: string }[] | null> {
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return null;

    const truncate = (s: string, n: number) =>
      !s ? "" : s.length > n ? `${s.slice(0, n)}\n… (trunchiat)` : s;

    // Compact test cases: max 3 cases, short values
    const compactTests = (tc: any): string => {
      if (!tc) return "";
      let arr: any[] = [];
      try {
        arr = Array.isArray(tc) ? tc : typeof tc === "string" ? JSON.parse(tc) : [tc];
      } catch {
        return truncate(String(tc), 200);
      }
      if (!Array.isArray(arr)) arr = [arr];
      const shown = arr.slice(0, 3).map((c: any) => {
        const input = truncate(String(c?.input ?? c?.stdin ?? ""), 80);
        const output = truncate(String(c?.expected_output ?? c?.output ?? c?.stdout ?? ""), 80);
        return `in: ${input} | out: ${output}`;
      });
      return shown.join("\n") + (arr.length > 3 ? `\n(+${arr.length - 3} cazuri)` : "");
    };

    // Group items by shared context (same problem / same question) so the
    // statement, solution and test cases are sent ONCE per group, with all
    // student answers listed at the end of that group.
    const groups = new Map<string, typeof items>();
    for (const it of items) {
      const key = it.aiType === "open_answer"
        ? `q:${it.questionText ?? it.problemTitle}`
        : `p:${it.problemTitle}|${it.solution?.slice(0, 200) ?? ""}`;
      const arr = groups.get(key) ?? [];
      arr.push(it);
      groups.set(key, arr);
    }

    let gi = 0;
    const itemDescriptions = [...groups.values()].map((group) => {
      gi++;
      const head = group[0];
      const answers = group
        .map((p) => `- ID ${p.answerId} (max ${p.maxPoints}p):\n${truncate(
          head.aiType === "open_answer" ? (p.studentText ?? "") : (p.studentCode ?? ""),
          1200,
        )}`)
        .join("\n\n");

      if (head.aiType === "open_answer") {
        return `### Întrebarea ${gi}: ${truncate(head.questionText ?? head.problemTitle, 800)}

Răspunsuri elevi:
${answers}`;
      }

      const tests = compactTests(head.testCases);
      return `### Problema ${gi}: ${head.problemTitle}

Soluție de referință:
\`\`\`python
${truncate(head.solution ?? "", 1200)}
\`\`\`
${tests ? `\nCazuri de test (extras):\n${tests}\n` : ""}
Coduri elevi:
${answers}`;
    }).join("\n\n---\n\n");

    const prompt = `Evaluează ${items.length} răspunsuri. Contextul (enunț/soluție/teste) apare o singură dată per grup, urmat de răspunsurile elevilor.

${itemDescriptions}

Răspunde DOAR cu JSON valid, un array cu ${items.length} obiecte (unul per ID):
[{"id":"<answerId>","score":<number>,"feedback":"<max 200 caractere, română>"}]

Folosește exact ID-urile date. Scorul: între 0 și punctajul maxim al ID-ului respectiv.`;


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Ești un evaluator. Răspunde doar cu JSON valid." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("AI batch review error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const results = JSON.parse(jsonMatch[0]) as { id: string; score: number; feedback: string }[];

    return results.map((r, i) => ({
      answerId: r.id || items[i].answerId,
      score: Math.min(Math.max(0, Math.round(r.score)), items[i].maxPoints),
      feedback: r.feedback || "Evaluat de AI",
    }));
  } catch (e) {
    console.error("AI batch review error:", e);
    return null;
  }
}

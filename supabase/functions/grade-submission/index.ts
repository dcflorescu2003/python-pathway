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
    const { submission_id } = await req.json();
    if (!submission_id) {
      return new Response(JSON.stringify({ error: "Missing submission_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

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
    const firstItem = answers[0]?.test_items;
    if (firstItem?.test_id) {
      const { data: test } = await supabase
        .from("tests")
        .select("teacher_id, ai_grading_item_ids")
        .eq("id", firstItem.test_id)
        .single();

      const aiGradingItemIds: string[] = (test as any)?.ai_grading_item_ids ?? [];

      if (test) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("teacher_status")
          .eq("user_id", test.teacher_id)
          .single();

        if (profile?.teacher_status === "verified") {
          // Check Stripe for Profesor AI subscription
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

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const item = answer.test_items;
      if (!item) continue;

      maxScore += item.points;
      let score = 0;
      let feedback = "";

      if (item.source_type === "exercise" && item.source_id) {
        const { data: exercise } = await supabase
          .from("exercises")
          .select("*")
          .eq("id", item.source_id)
          .single();

        if (exercise) {
          score = gradeExercise(exercise, answer.answer_data, item.points);
        }
      } else if (item.source_type === "problem" && item.source_id) {
        const { data: problem } = await supabase
          .from("problems")
          .select("test_cases, solution, title")
          .eq("id", item.source_id)
          .single();

        if (problem && answer.answer_data?.code) {
          const result = gradeProblemBasic(problem, answer.answer_data.code, item.points);
          score = result.score;
          feedback = result.feedback;

          // Collect for batch AI if teacher has Profesor AI and score < max
          if (teacherHasAI && score < item.points && itemsForAI.length < MAX_AI_ITEMS_PER_TEST) {
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
          if (teacherHasAI && answer.answer_data?.text && itemsForAI.length < MAX_AI_ITEMS_PER_TEST) {
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

    // Update submission
    await supabase
      .from("test_submissions")
      .update({ total_score: totalScore, max_score: maxScore, auto_graded: true })
      .eq("id", submission_id);

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

  if (type === "quiz") {
    return answerData.selected === exercise.correct_option_id ? maxPoints : 0;
  }

  if (type === "truefalse") {
    return answerData.selected === exercise.is_true ? maxPoints : 0;
  }

  if (type === "fill") {
    const blanks = (exercise.blanks || []) as { id: string; answer: string }[];
    if (blanks.length === 0) return 0;
    let correct = 0;
    for (const blank of blanks) {
      const studentAnswer = (answerData.blanks?.[blank.id] || "").trim().toLowerCase();
      const acceptedAnswers = blank.answer.split(",").map((a: string) => a.trim().toLowerCase());
      if (acceptedAnswers.includes(studentAnswer)) correct++;
    }
    return Math.round((correct / blanks.length) * maxPoints);
  }

  if (type === "order") {
    const lines = (exercise.lines || []) as { id: string; text: string; order: number }[];
    const correctOrder = [...lines].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((l) => l.id);
    const studentOrder = answerData.order || [];
    if (studentOrder.length === 0) return 0;
    let correctPositions = 0;
    for (let i = 0; i < correctOrder.length; i++) {
      if (studentOrder[i] === correctOrder[i]) correctPositions++;
    }
    return Math.round((correctPositions / correctOrder.length) * maxPoints);
  }

  if (type === "match") {
    const pairs = (exercise.pairs || []) as { id: string; left: string; right: string }[];
    if (pairs.length === 0) return 0;
    let correct = 0;
    for (const pair of pairs) {
      const studentAnswer = (answerData.matches?.[pair.id] || "").trim().toLowerCase();
      if (studentAnswer === pair.right.trim().toLowerCase()) correct++;
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

    // Build a single prompt for all items
    const itemDescriptions = items.map((p, i) => {
      if (p.aiType === "open_answer") {
        return `### Întrebarea ${i + 1} (ID: ${p.answerId}, max ${p.maxPoints} puncte): "${p.problemTitle}"

Întrebarea: ${p.questionText}

Răspunsul elevului:
${p.studentText}`;
      }
      return `### Problema ${i + 1} (ID: ${p.answerId}, max ${p.maxPoints} puncte): "${p.problemTitle}"

Soluția corectă:
\`\`\`python
${p.solution}
\`\`\`

Codul elevului:
\`\`\`python
${p.studentCode}
\`\`\`

Test cases: ${JSON.stringify(p.testCases)}`;
    }).join("\n\n---\n\n");

    const prompt = `Evaluează răspunsurile a ${items.length} elevi. Pentru fiecare item, acordă un scor și oferă feedback scurt în română. Itemii pot fi probleme de cod sau răspunsuri deschise la întrebări.

${itemDescriptions}

Răspunde DOAR cu un JSON valid - un array cu ${items.length} obiecte, câte unul pentru fiecare item, în ordine:
[{"id": "<answerId>", "score": <number>, "feedback": "<explicație scurtă în română>"}, ...]

IMPORTANT: Folosește exact ID-urile furnizate. Scorul trebuie să fie între 0 și punctajul maxim al fiecărui item.`;

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

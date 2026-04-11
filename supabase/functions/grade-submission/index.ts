import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

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

    let totalScore = 0;
    let maxScore = 0;

    for (const answer of answers) {
      const item = answer.test_items;
      if (!item) continue;

      maxScore += item.points;
      let score = 0;
      let feedback = "";

      if (item.source_type === "exercise" && item.source_id) {
        // Fetch exercise to get correct answer
        const { data: exercise } = await supabase
          .from("exercises")
          .select("*")
          .eq("id", item.source_id)
          .single();

        if (exercise) {
          score = gradeExercise(exercise, answer.answer_data, item.points);
        }
      } else if (item.source_type === "problem" && item.source_id) {
        // For problems - grade based on test cases using simple comparison
        const { data: problem } = await supabase
          .from("problems")
          .select("test_cases, solution")
          .eq("id", item.source_id)
          .single();

        if (problem && answer.answer_data?.code) {
          const result = gradeProblemBasic(problem, answer.answer_data.code, item.points);
          score = result.score;
          feedback = result.feedback;

          // Check if teacher is premium for AI review
          if (score < item.points) {
            const { data: test } = await supabase
              .from("tests")
              .select("teacher_id")
              .eq("id", item.test_id)
              .single();

            if (test) {
              const { data: teacherProfile } = await supabase
                .from("profiles")
                .select("is_premium")
                .eq("user_id", test.teacher_id)
                .single();

              if (teacherProfile?.is_premium) {
                const aiResult = await aiReviewCode(
                  problem.solution,
                  answer.answer_data.code,
                  problem.test_cases,
                  item.points
                );
                if (aiResult) {
                  score = Math.max(score, aiResult.score);
                  feedback = aiResult.feedback;
                  await supabase
                    .from("test_answers")
                    .update({ ai_reviewed: true })
                    .eq("id", answer.id);
                }
              }
            }
          }
        }
      } else if (item.source_type === "custom" && item.custom_data) {
        score = gradeExercise(item.custom_data, answer.answer_data, item.points);
      }

      totalScore += score;

      await supabase
        .from("test_answers")
        .update({ score, feedback: feedback || null })
        .eq("id", answer.id);
    }

    // Update submission
    await supabase
      .from("test_submissions")
      .update({ total_score: totalScore, max_score: maxScore, auto_graded: true })
      .eq("id", submission_id);

    return new Response(
      JSON.stringify({ total_score: totalScore, max_score: maxScore }),
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
  // Basic: we can't execute Python here, so we do a simple heuristic
  // Check if code is non-empty and has some structure
  if (!studentCode.trim()) return { score: 0, feedback: "Cod gol" };

  // Simple structural analysis
  const hasFunction = /def\s+\w+/.test(studentCode);
  const hasReturn = /return\s/.test(studentCode);
  const hasLoop = /for\s|while\s/.test(studentCode);
  const hasCondition = /if\s/.test(studentCode);
  const hasPrint = /print\s*\(/.test(studentCode);
  const hasInput = /input\s*\(/.test(studentCode);

  // Give partial credit for structure
  let structureScore = 0;
  if (hasFunction || hasPrint) structureScore += 0.2;
  if (hasReturn || hasPrint) structureScore += 0.1;
  if (hasLoop) structureScore += 0.1;
  if (hasCondition) structureScore += 0.1;

  // Cap at 50% for structural analysis alone
  const score = Math.round(Math.min(structureScore, 0.5) * maxPoints);
  return {
    score,
    feedback: `Punctaj structural: ${score}/${maxPoints}. Evaluarea completă necesită AI review.`,
  };
}

async function aiReviewCode(
  solution: string,
  studentCode: string,
  testCases: any,
  maxPoints: number
): Promise<{ score: number; feedback: string } | null> {
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return null;

    const prompt = `Evaluează codul unui elev comparativ cu soluția corectă. Acordă un scor de la 0 la ${maxPoints} puncte.

Soluția corectă:
\`\`\`python
${solution}
\`\`\`

Codul elevului:
\`\`\`python
${studentCode}
\`\`\`

Test cases: ${JSON.stringify(testCases)}

Răspunde DOAR cu un JSON valid: {"score": <number>, "feedback": "<explicație scurtă în română>"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Ești un evaluator de cod Python. Răspunde doar cu JSON valid." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);
    return {
      score: Math.min(Math.max(0, Math.round(result.score)), maxPoints),
      feedback: result.feedback || "Evaluat de AI",
    };
  } catch (e) {
    console.error("AI review error:", e);
    return null;
  }
}

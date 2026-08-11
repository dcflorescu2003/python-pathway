import { supabase } from "@/integrations/supabase/client";

// Anonymous visitors are not allowed to read the `solution` column of
// manual_exercises (column-level grant). Signed-in users still get it.
const BASE_COLUMNS =
  "id, lesson_id, type, question, options, correct_option_id, code_template, blanks, lines, statement, is_true, explanation, pairs, xp, sort_order, test_cases, hint";

export async function manualExerciseColumns(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session ? `${BASE_COLUMNS}, solution` : BASE_COLUMNS;
}

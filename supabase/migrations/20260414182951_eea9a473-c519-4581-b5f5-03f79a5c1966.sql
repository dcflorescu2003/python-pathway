-- Add new columns to eval_exercises
ALTER TABLE public.eval_exercises
  ADD COLUMN IF NOT EXISTS code_template text,
  ADD COLUMN IF NOT EXISTS test_cases jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS solution text DEFAULT ''::text;

-- Update the trigger function to allow problem and open_answer types
CREATE OR REPLACE FUNCTION public.validate_eval_exercise_type()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.type NOT IN ('quiz', 'fill', 'order', 'truefalse', 'problem', 'open_answer') THEN
    RAISE EXCEPTION 'eval_exercises type must be quiz, fill, order, truefalse, problem, or open_answer';
  END IF;
  RETURN NEW;
END;
$function$;
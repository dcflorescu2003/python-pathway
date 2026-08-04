CREATE OR REPLACE FUNCTION public.protect_eval_problem_solution()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'problem' AND OLD.type = 'problem' THEN
    IF NULLIF(btrim(COALESCE(NEW.solution, '')), '') IS NULL THEN
      NEW.solution := OLD.solution;
    END IF;
    IF NEW.test_cases IS NULL
       OR jsonb_typeof(NEW.test_cases) <> 'array'
       OR jsonb_array_length(NEW.test_cases) = 0 THEN
      NEW.test_cases := OLD.test_cases;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_eval_problem_solution_trg ON public.eval_exercises;

CREATE TRIGGER protect_eval_problem_solution_trg
BEFORE UPDATE ON public.eval_exercises
FOR EACH ROW
EXECUTE FUNCTION public.protect_eval_problem_solution();
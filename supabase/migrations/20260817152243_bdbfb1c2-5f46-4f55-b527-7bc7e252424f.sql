DO $$
DECLARE
  v_student uuid := '0350f48f-d07b-40e0-9741-433c1d6edeb3';
  v_teacher uuid := 'e66e2524-f661-44fa-9d73-fa22ea9d04a1';
  v_assign uuid := '141e8153-b125-4ffa-a4ce-1af543916c24';
  v_sub uuid; v_item uuid; v_ans uuid; v_score numeric; v_status text; v_leave int; v_draft jsonb;
BEGIN
  SELECT id INTO v_item FROM public.test_items WHERE test_id = '3624665b-0621-4378-8bef-fd741f903dc0' LIMIT 1;

  INSERT INTO public.test_submissions(assignment_id, student_id, variant, status)
  VALUES (v_assign, v_student, 'A', 'in_progress') RETURNING id INTO v_sub;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student, 'role','authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);

  PERFORM public.save_submission_draft(v_sub, '{"x":"1"}'::jsonb);
  SELECT draft_answers INTO v_draft FROM public.test_submissions WHERE id = v_sub;
  IF v_draft IS NULL THEN RAISE EXCEPTION 'FAIL: draft nu s-a salvat'; END IF;

  PERFORM public.increment_leave_count(v_sub);
  SELECT leave_count INTO v_leave FROM public.test_submissions WHERE id = v_sub;
  IF v_leave <> 1 THEN RAISE EXCEPTION 'FAIL: leave_count = %', v_leave; END IF;

  PERFORM public.mark_submission_interrupted(v_sub);
  SELECT status INTO v_status FROM public.test_submissions WHERE id = v_sub;
  IF v_status <> 'interrupted' THEN RAISE EXCEPTION 'FAIL: interrupted = %', v_status; END IF;

  -- profesorul deblocheaza reluarea
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_teacher, 'role','authenticated')::text, true);
  PERFORM public.resume_interrupted_submission(v_sub);
  SELECT status INTO v_status FROM public.test_submissions WHERE id = v_sub;
  IF v_status <> 'in_progress' THEN RAISE EXCEPTION 'FAIL: reluarea nu a mers (%)', v_status; END IF;

  RESET role;
  PERFORM set_config('request.jwt.claims', NULL, true);

  INSERT INTO public.test_answers(submission_id, test_item_id, answer_data, score, max_points)
  VALUES (v_sub, v_item, '{"a":1}'::jsonb, 7, 10) RETURNING id INTO v_ans;
  UPDATE public.test_submissions SET total_score = 70, max_score = 100, auto_graded = true,
    status = 'submitted', submitted_at = now() WHERE id = v_sub;
  SELECT total_score INTO v_score FROM public.test_submissions WHERE id = v_sub;
  IF v_score <> 70 THEN RAISE EXCEPTION 'FAIL: graderul nu poate scrie scorul (%)', v_score; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_teacher, 'role','authenticated')::text, true);
  PERFORM set_config('role', 'authenticated', true);
  UPDATE public.test_answers SET score = 9, feedback = 'ok' WHERE id = v_ans;
  SELECT score INTO v_score FROM public.test_answers WHERE id = v_ans;
  IF v_score <> 9 THEN RAISE EXCEPTION 'FAIL: profesorul nu poate renota (%)', v_score; END IF;
  UPDATE public.test_submissions SET total_score = 90 WHERE id = v_sub;
  SELECT total_score INTO v_score FROM public.test_submissions WHERE id = v_sub;
  IF v_score <> 90 THEN RAISE EXCEPTION 'FAIL: profesorul nu poate actualiza totalul (%)', v_score; END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student, 'role','authenticated')::text, true);
  UPDATE public.test_submissions SET total_score = 100 WHERE id = v_sub;
  SELECT total_score INTO v_score FROM public.test_submissions WHERE id = v_sub;
  IF v_score <> 90 THEN RAISE EXCEPTION 'FAIL SECURITATE: elevul a schimbat scorul (%)', v_score; END IF;
  UPDATE public.test_answers SET score = 10 WHERE id = v_ans;
  SELECT score INTO v_score FROM public.test_answers WHERE id = v_ans;
  IF v_score <> 9 THEN RAISE EXCEPTION 'FAIL SECURITATE: elevul a schimbat scorul itemului (%)', v_score; END IF;

  RESET role;
  PERFORM set_config('request.jwt.claims', NULL, true);

  DELETE FROM public.test_answers WHERE submission_id = v_sub;
  DELETE FROM public.test_submissions WHERE id = v_sub;

  RAISE NOTICE 'OK: flux evaluare functional, scoruri protejate';
END $$;
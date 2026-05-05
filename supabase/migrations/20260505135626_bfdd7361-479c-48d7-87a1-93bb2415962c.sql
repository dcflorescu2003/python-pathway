
DO $$
DECLARE
  uid uuid := '8c823f07-9e8f-4106-8d3e-19e34d61ef22';
  test_ids uuid[];
  assignment_ids uuid[];
  submission_ids uuid[];
  class_ids uuid[];
  request_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO test_ids FROM tests WHERE teacher_id = uid;
  IF test_ids IS NOT NULL THEN
    SELECT array_agg(id) INTO assignment_ids FROM test_assignments WHERE test_id = ANY(test_ids);
    IF assignment_ids IS NOT NULL THEN
      SELECT array_agg(id) INTO submission_ids FROM test_submissions WHERE assignment_id = ANY(assignment_ids);
      IF submission_ids IS NOT NULL THEN
        DELETE FROM test_answers WHERE submission_id = ANY(submission_ids);
      END IF;
      DELETE FROM test_submissions WHERE assignment_id = ANY(assignment_ids);
    END IF;
    DELETE FROM test_items WHERE test_id = ANY(test_ids);
    DELETE FROM test_assignments WHERE test_id = ANY(test_ids);
    DELETE FROM tests WHERE teacher_id = uid;
  END IF;

  SELECT array_agg(id) INTO class_ids FROM teacher_classes WHERE teacher_id = uid;
  IF class_ids IS NOT NULL THEN
    DELETE FROM challenges WHERE class_id = ANY(class_ids);
    DELETE FROM class_members WHERE class_id = ANY(class_ids);
  END IF;
  DELETE FROM teacher_classes WHERE teacher_id = uid;

  SELECT array_agg(id) INTO request_ids FROM teacher_verification_requests WHERE user_id = uid;
  IF request_ids IS NOT NULL THEN
    DELETE FROM teacher_verification_messages WHERE request_id = ANY(request_ids);
  END IF;
  DELETE FROM teacher_verification_requests WHERE user_id = uid;
  DELETE FROM teacher_referral_codes WHERE teacher_id = uid;

  DELETE FROM class_members WHERE student_id = uid;
  DELETE FROM completed_lessons WHERE user_id = uid;
  DELETE FROM coupon_redemptions WHERE user_id = uid;
  DELETE FROM notifications WHERE user_id = uid;
  DELETE FROM device_tokens WHERE user_id = uid;
  DELETE FROM user_roles WHERE user_id = uid;
  DELETE FROM profiles WHERE user_id = uid;

  DELETE FROM auth.users WHERE id = uid;
END $$;


-- 1. Flag profesor pe profilul existent
ALTER TABLE profiles ADD COLUMN is_teacher boolean NOT NULL DEFAULT false;

-- 2. Clasele profesorului
CREATE TABLE teacher_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  join_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;

-- Teachers can CRUD their own classes
CREATE POLICY "Teachers can select own classes" ON teacher_classes FOR SELECT TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can insert own classes" ON teacher_classes FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers can update own classes" ON teacher_classes FOR UPDATE TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own classes" ON teacher_classes FOR DELETE TO authenticated USING (teacher_id = auth.uid());
-- Students can read classes they are members of (for join by code, need public read on join_code)
CREATE POLICY "Anyone can read classes by join_code" ON teacher_classes FOR SELECT TO authenticated USING (true);

-- 3. Elevi înscriși în clase
CREATE TABLE class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

-- Students can see their own memberships
CREATE POLICY "Students can see own memberships" ON class_members FOR SELECT TO authenticated USING (student_id = auth.uid());
-- Students can join classes
CREATE POLICY "Students can join classes" ON class_members FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
-- Students can leave classes
CREATE POLICY "Students can leave classes" ON class_members FOR DELETE TO authenticated USING (student_id = auth.uid());
-- Teachers can see members of their classes
CREATE POLICY "Teachers can see class members" ON class_members FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM teacher_classes tc WHERE tc.id = class_id AND tc.teacher_id = auth.uid())
);
-- Teachers can remove members
CREATE POLICY "Teachers can remove class members" ON class_members FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM teacher_classes tc WHERE tc.id = class_id AND tc.teacher_id = auth.uid())
);

-- 4. Provocări atribuite de profesor
CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Use trigger for validation instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_challenge_item_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.item_type NOT IN ('lesson', 'problem') THEN
    RAISE EXCEPTION 'item_type must be lesson or problem';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_challenge_item_type
  BEFORE INSERT OR UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_challenge_item_type();

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Teachers can CRUD challenges on their classes
CREATE POLICY "Teachers can select challenges" ON challenges FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM teacher_classes tc WHERE tc.id = class_id AND tc.teacher_id = auth.uid())
);
CREATE POLICY "Teachers can insert challenges" ON challenges FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM teacher_classes tc WHERE tc.id = class_id AND tc.teacher_id = auth.uid())
);
CREATE POLICY "Teachers can delete challenges" ON challenges FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM teacher_classes tc WHERE tc.id = class_id AND tc.teacher_id = auth.uid())
);
-- Students can read challenges for their classes
CREATE POLICY "Students can see challenges" ON challenges FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM class_members cm WHERE cm.class_id = class_id AND cm.student_id = auth.uid())
);


-- Add contact_email to teacher_verification_requests
ALTER TABLE public.teacher_verification_requests
ADD COLUMN contact_email text;

-- Create messaging table for verification conversations
CREATE TABLE public.teacher_verification_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.teacher_verification_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  attachment_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_verification_messages ENABLE ROW LEVEL SECURITY;

-- Teachers can view messages on their own requests
CREATE POLICY "Teachers can view own request messages"
ON public.teacher_verification_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_verification_requests tvr
    WHERE tvr.id = teacher_verification_messages.request_id
    AND tvr.user_id = auth.uid()
  )
);

-- Teachers can insert messages on their own requests
CREATE POLICY "Teachers can send messages on own requests"
ON public.teacher_verification_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.teacher_verification_requests tvr
    WHERE tvr.id = teacher_verification_messages.request_id
    AND tvr.user_id = auth.uid()
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all verification messages"
ON public.teacher_verification_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert messages on any request
CREATE POLICY "Admins can send verification messages"
ON public.teacher_verification_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  has_role(auth.uid(), 'admin'::app_role)
);

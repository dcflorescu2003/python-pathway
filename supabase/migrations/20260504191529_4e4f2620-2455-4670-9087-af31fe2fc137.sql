-- Convert single | to , inside fill blanks answers, preserving || (OR operator).
-- Uses a sentinel placeholder to protect ||.
UPDATE public.exercises
SET blanks = (
  SELECT jsonb_agg(
    CASE
      WHEN b ? 'answer' AND (b->>'answer') ~ '[|]'
        THEN jsonb_set(
          b,
          '{answer}',
          to_jsonb(
            replace(
              replace(
                replace(b->>'answer', '||', E'\x01PIPE\x01'),
                '|', ','
              ),
              E'\x01PIPE\x01', '||'
            )
          )
        )
      ELSE b
    END
  )
  FROM jsonb_array_elements(blanks) AS b
)
WHERE type = 'fill'
  AND blanks IS NOT NULL
  AND blanks::text ~ '[^|]\|[^|]';

UPDATE public.eval_exercises
SET blanks = (
  SELECT jsonb_agg(
    CASE
      WHEN b ? 'answer' AND (b->>'answer') ~ '[|]'
        THEN jsonb_set(
          b,
          '{answer}',
          to_jsonb(
            replace(
              replace(
                replace(b->>'answer', '||', E'\x01PIPE\x01'),
                '|', ','
              ),
              E'\x01PIPE\x01', '||'
            )
          )
        )
      ELSE b
    END
  )
  FROM jsonb_array_elements(blanks) AS b
)
WHERE type = 'fill'
  AND blanks IS NOT NULL
  AND blanks::text ~ '[^|]\|[^|]';
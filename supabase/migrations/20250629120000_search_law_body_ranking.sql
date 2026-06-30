-- search_law: rank by section_ref, heading, AND body (body_clean when present).
-- Read-only at runtime; idempotent DDL.

ALTER TABLE law_sections
  ADD COLUMN IF NOT EXISTS body_clean TEXT;

ALTER TABLE law_sections
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

UPDATE law_sections
SET body_clean = body
WHERE body_clean IS NULL OR body_clean = '';

CREATE OR REPLACE FUNCTION public.search_law(query_text text)
RETURNS TABLE (
  id uuid,
  law_name text,
  section_ref text,
  heading text,
  body text,
  body_clean text,
  source text,
  source_url text,
  amended_up_to text,
  language text,
  rank real
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  stop_words text[] := ARRAY[
    'a','an','the','is','are','was','were','be','been','being',
    'what','when','where','who','why','how','if','i','me','my',
    'do','does','did','can','will','would','should','happens','happen','not'
  ];
BEGIN
  RETURN QUERY
  WITH raw_terms AS (
    SELECT DISTINCT lower(t) AS term
    FROM unnest(regexp_split_to_array(lower(coalesce(query_text, '')), '[^a-z0-9-]+')) AS t
    WHERE length(t) > 2
      AND NOT (t = ANY (stop_words))
  ),
  scored AS (
    SELECT
      ls.id,
      ls.law_name,
      ls.section_ref,
      ls.heading,
      ls.body,
      ls.body_clean,
      ls.source,
      ls.source_url,
      ls.amended_up_to,
      ls.language,
      (
        SELECT coalesce(sum(
          CASE WHEN ls.section_ref ILIKE '%' || rt.term || '%' THEN 3.0 ELSE 0 END +
          CASE WHEN ls.heading ILIKE '%' || rt.term || '%' THEN 2.0 ELSE 0 END +
          CASE WHEN coalesce(ls.body_clean, ls.body) ILIKE '%' || rt.term || '%' THEN 1.0 ELSE 0 END
        ), 0)::real
        FROM raw_terms rt
      ) AS score
    FROM law_sections ls
  )
  SELECT
    s.id,
    s.law_name,
    s.section_ref,
    s.heading,
    s.body,
    s.body_clean,
    s.source,
    s.source_url,
    s.amended_up_to,
    s.language,
    s.score AS rank
  FROM scored s
  WHERE s.score >= 1.0
  ORDER BY s.score DESC, length(s.heading) ASC
  LIMIT 25;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_law(text) TO anon, authenticated, service_role;

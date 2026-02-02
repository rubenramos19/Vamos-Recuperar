-- Create feed tables: posts, comments, post_likes, post_media
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text,
  content text NOT NULL,
  is_event boolean DEFAULT false,
  event_at timestamptz,
  location_text text,
  location_latitude double precision,
  location_longitude double precision,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments (post_id);

-- Optional: enable RLS and add basic policies if desired (review before enabling)
-- ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "posts_select_public" ON public.posts FOR SELECT USING (true);
-- CREATE POLICY "posts_insert_authenticated" ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

COMMIT;

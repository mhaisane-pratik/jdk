-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO ENABLE DYNAMIC ADMINS

-- 1. Add an is_admin column to your chat_users table
ALTER TABLE public.chat_users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Optional: Set any existing specific user as an admin (replace 'your_username' with the actual username)
-- UPDATE public.chat_users SET is_admin = true WHERE username = 'prateek';

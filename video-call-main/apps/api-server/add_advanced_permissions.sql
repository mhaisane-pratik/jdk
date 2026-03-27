-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO ENABLE ADVANCED ADMIN PERMISSIONS

-- 1. Add the advanced permission columns to chat_users
ALTER TABLE public.chat_users 
ADD COLUMN IF NOT EXISTS can_create_group BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_password TEXT DEFAULT NULL;

-- 2. Optional: Set a baseline password for any existing admins so they aren't completely blank
UPDATE public.chat_users 
SET admin_password = 'admin123' 
WHERE is_admin = true AND admin_password IS NULL;

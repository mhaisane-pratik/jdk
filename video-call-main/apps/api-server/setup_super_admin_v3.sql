-- SUPER ADMIN MEGA-EXPANSION (V3)
-- Run this script in your Supabase SQL Editor to enable Banning, Warnings, and Deep App Configuration.

-- 1. Expand Global App Configurations
ALTER TABLE public.api_clients 
ADD COLUMN IF NOT EXISTS app_logo TEXT DEFAULT 'https://ui-avatars.com/api/?name=Zat+Chat&background=4f46e5&color=fff',
ADD COLUMN IF NOT EXISTS allow_chat_creation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_media_sharing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_group_size INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS max_message_length INTEGER DEFAULT 1000;

-- 2. Expand User Moderation Status
ALTER TABLE public.chat_users
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;

-- 3. Optional Maintenance (Ensure the default app has properties)
UPDATE public.api_clients 
SET 
  app_logo = 'https://ui-avatars.com/api/?name=Zat+Chat&background=4f46e5&color=fff',
  allow_chat_creation = true,
  allow_media_sharing = true,
  max_group_size = 50,
  max_message_length = 1000
WHERE allow_chat_creation IS NULL;

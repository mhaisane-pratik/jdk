-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO CREATE THE API CLIENTS TABLE

-- 1. Create the table to track API integrations and settings
CREATE TABLE IF NOT EXISTS public.api_clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    app_name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    allow_group_creation BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert your default ZatChat application into the table
INSERT INTO public.api_clients (app_name, api_key, allow_group_creation)
VALUES ('ZatChat Default', 'ZATCHAT_PRATEEK9373', true)
ON CONFLICT (api_key) DO NOTHING;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.api_clients ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy: Allow backend service to do anything
CREATE POLICY "Enable all operations for service role"
ON public.api_clients
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Create Policy: Allow anyone (like your React app via Anon Key) to read the config
CREATE POLICY "Enable read access for all users"
ON public.api_clients
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

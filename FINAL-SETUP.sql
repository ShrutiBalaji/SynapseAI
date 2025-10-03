-- FINAL SETUP SCRIPT FOR SYNAPSE
-- Run these commands in your Supabase SQL Editor

-- 1. Create default profile (required for the app to work without authentication)
INSERT INTO profiles (id, email, full_name, is_guest, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'default@synapse.app',
    'Default User',
    false,
    now()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Disable Row Level Security (RLS) for all tables
-- This allows the app to work without authentication
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE problems DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conjectures DISABLE ROW LEVEL SECURITY;
ALTER TABLE criticisms DISABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;
ALTER TABLE problem_collaborators DISABLE ROW LEVEL SECURITY;

-- 3. Add 'urgent' to problem_status enum (if not already added)
-- This allows the "Urgent" status option in the problems page
ALTER TYPE problem_status ADD VALUE IF NOT EXISTS 'urgent';

-- Success message
SELECT 'Setup completed successfully! The app should now work properly.' as status;

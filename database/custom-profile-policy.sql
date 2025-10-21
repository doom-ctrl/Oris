-- Custom RLS Policy for Profiles Table
-- This policy allows authenticated users to create their own profile

-- Note: This policy would replace the existing "Users can insert their own profile" policy
-- if you want to use this specific naming convention

-- First, drop the existing policy if you want to replace it:
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Then create the new policy with your preferred name:
CREATE POLICY "Allow authenticated users to create their own profile" 
ON profiles 
FOR INSERT 
WITH CHECK (auth.uid()::text = id);

-- Alternative version if you prefer the original column order:
-- CREATE POLICY "Allow authenticated users to create their own profile" 
-- ON profiles 
-- FOR INSERT 
-- WITH CHECK (id = auth.uid()::text);
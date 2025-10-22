# Database Setup for Oris Profile Management

## Overview
The Oris profile management feature requires additional columns to be added to your Supabase database. This guide will help you set up the database schema.

## Quick Setup

### Option 1: Using the Migration Script (Recommended)

1. Open your Supabase project dashboard
2. Go to the **SQL Editor**
3. Copy and paste the contents of `database/migrations/001_add_profile_columns.sql`
4. Click **Run** to execute the migration

### Option 2: Manual Setup

If you prefer to set up the columns manually, run these SQL commands in your Supabase SQL Editor:

```sql
-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

## What This Does

The migration script:

1. **Adds missing columns** to the `profiles` table:
   - `first_name` - User's first name
   - `last_name` - User's last name
   - `avatar_url` - URL to profile picture

2. **Creates automatic timestamp updates** for the `updated_at` column

3. **Refreshes the schema cache** so Supabase recognizes the new columns

## Verification

After running the migration, you should be able to:

1. Edit your profile at `http://localhost:3001/profile`
2. Update your name and avatar URL
3. See changes reflected in the Oris navigation bar

## Troubleshooting

### Error: "Could not find the 'first_name' column"
This means the migration hasn't been run yet. Follow the steps above to update your database schema.

### Profile changes not saving
1. Check the browser console for specific error messages
2. Ensure you're logged in with a valid account
3. Verify the migration was successful in Supabase

### Navigation bar not updating
The profile data should refresh automatically. If it doesn't, try refreshing the page manually.

## Current Schema

The `profiles` table should have these columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (references auth.users) |
| `email` | TEXT | User's email address |
| `first_name` | TEXT | User's first name (optional) |
| `last_name` | TEXT | User's last name (optional) |
| `avatar_url` | TEXT | Profile picture URL (optional) |
| `created_at` | TIMESTAMPTZ | When the profile was created |
| `updated_at` | TIMESTAMPTZ | When the profile was last updated |

## Security

The profile table uses Row Level Security (RLS) to ensure:
- Users can only view and update their own profiles
- All database operations are properly authenticated
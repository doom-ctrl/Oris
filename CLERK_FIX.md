# Clerk User ID Compatibility Fix

## Issue Identified

When using Clerk authentication with Supabase, you may encounter this error:

```
Error: invalid input syntax for type uuid: "user_304izQgImnGZDZhtV4QE6ZID9RC"
```

This occurs because Clerk uses a different user ID format (starting with `user_`) than Supabase's UUID format.

## Solution

### Option 1: New Database Setup (Recommended)

If you're setting up a new database:

1. **Use the Clerk-compatible schema:**
   ```sql
   -- Run this in your Supabase SQL Editor
   -- File: database/schema-clerk-compatible.sql
   ```

This schema updates all `user_id` fields from `UUID` to `TEXT` type, making them compatible with Clerk user IDs.

### Option 2: Existing Database Migration

If you already have a database with the old UUID schema:

1. **Run the migration script:**
   ```sql
   -- Run this in your Supabase SQL Editor first
   -- File: database/migrate-to-clerk.sql
   ```

2. **Then use the new schema:**
   ```sql
   -- Run this after the migration
   -- File: database/schema-clerk-compatible.sql
   ```

## What Changed

- **User ID fields**: Changed from `UUID` to `TEXT` type
- **RLS Policies**: Updated to cast `auth.uid()` to text: `auth.uid()::text`
- **References**: Removed `REFERENCES auth.users(id)` since we're using Clerk IDs
- **Views**: Updated to work with TEXT user IDs

## Files Updated

- `database/schema-clerk-compatible.sql` - New database schema
- `database/migrate-to-clerk.sql` - Migration script for existing databases
- `SETUP.md` - Updated setup instructions
- `INTEGRATION_COMPLETE.md` - Updated integration guide

## Testing

After updating your database schema:

1. Restart your development server
2. Try creating a new assessment
3. The error should be resolved

## Benefits

- ✅ Full Clerk compatibility
- ✅ No more UUID conversion errors
- ✅ Maintains all existing functionality
- ✅ Secure Row Level Security preserved
# Setup Guide: Assessment Manager with Clerk + Supabase

This guide will help you set up the Assessment Manager with secure authentication (Clerk) and database storage (Supabase).

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd assessment-manager
npm install
```

### 2. Environment Setup

```bash
cp .env.local.example .env.local
```

### 3. Configure Services

Follow the steps below to set up Clerk and Supabase, then update your `.env.local` file.

---

## 🔐 Clerk Authentication Setup

### Step 1: Create Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Sign up / Sign in
3. Click "Add application"
4. Choose a name (e.g., "Assessment Manager")
5. Select authentication methods (recommend: Email + Password, Google, GitHub)
6. Copy your keys

### Step 2: Add Clerk Keys to Environment

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Configure Redirect URLs

In Clerk Dashboard → Sessions & URLs:
- **Redirect after sign-in**: `/assessments`
- **Redirect after sign-up**: `/assessments`
- **Sign-out URL**: `/`

---

## 🗄️ Supabase Database Setup

### Step 1: Create Supabase Project

1. Go to [Supabase](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: Assessment Manager
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Wait for project to be created

### Step 2: Get Supabase Keys

In your Supabase project → Settings → API:
- Copy **Project URL** and **anon public** key
- Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Set Up Database Schema

1. In Supabase → SQL Editor
2. Copy and paste the entire contents of `database/schema-clerk-compatible.sql`
3. Click "Run" to execute all tables, policies, and indexes

**⚠️ Important**: Use the `schema-clerk-compatible.sql` file as it's designed for Clerk user IDs (TEXT format). If you have an existing database with the old UUID schema, run `database/migrate-to-clerk.sql` first.

This will create:
- `profiles` table (linked to Clerk users)
- `assessments` table
- `tasks` table
- `progress_metrics` table
- `planner_sessions` table
- `subjects` table
- `study_sessions` table
- Row Level Security policies
- Performance indexes

### Step 4: Configure Clerk Auth Provider

1. In Supabase → Authentication → Providers
2. Enable "JWT" provider
3. In "JWT Secret", add your Clerk JWKS URL:
   ```
   https://your-clerk-instance.clerk.accounts.dev/v1/jwks
   ```

---

## 🚀 Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Verification Checklist

- [ ] Clerk keys added to `.env.local`
- [ ] Supabase keys added to `.env.local`
- [ ] Database schema executed in Supabase
- [ ] Clerk JWT provider configured in Supabase
- [ ] Application starts without errors
- [ ] Sign up / Sign in works
- [ ] Can create assessments
- [ ] Data persists in Supabase

---

## 🔧 Development Workflow

### Authentication Flow

1. User visits `/` → Sees landing page
2. Clicks "Sign Up" → Redirected to Clerk signup
3. After signup → Redirected to `/assessments`
4. User profile automatically created in Supabase `profiles` table
5. All subsequent data operations use Row Level Security

### Data Flow

- All database operations use the `databaseHelpers.ts` functions
- Each function includes the user's Clerk ID for filtering
- Row Level Security ensures users can only access their own data
- Client-side uses the `useUser()` hook from Clerk

### Adding New Features

1. **New Table**: Add to `database/schema.sql`
2. **Type Definitions**: Add to `types/database.ts`
3. **Helper Functions**: Add to `lib/databaseHelpers.ts`
4. **UI Components**: Use authentication-aware patterns

---

## 🧪 Testing Your Setup

### Test Authentication

```bash
# Navigate to auth pages
http://localhost:3000/sign-in
http://localhost:3000/sign-up
```

### Test Database Operations

1. Sign in successfully
2. Create an assessment
3. Add tasks to assessment
4. Check data appears in Supabase Dashboard
5. Sign out and sign in as different user
6. Verify data isolation (users shouldn't see each other's data)

### Test Row Level Security

In Supabase SQL Editor, run:

```sql
-- This should return rows (you're authenticated via Dashboard)
SELECT * FROM assessments;

-- Try to access another user's data (should be blocked)
SELECT * FROM profiles WHERE email = 'different@example.com';
```

---

## 🚨 Troubleshooting

### Common Issues

**1. Authentication Redirect Loop**
- Check Clerk keys in `.env.local`
- Verify redirect URLs in Clerk Dashboard
- Ensure middleware is properly configured

**2. Database Connection Error**
- Verify Supabase URL and keys
- Check Supabase project status
- Ensure database schema was executed

**3. Row Level Security Issues**
- Verify JWT provider is configured in Supabase
- Check RLS policies are enabled
- Test with authenticated session

**4. CORS Issues**
- Add your local development URL to Supabase CORS settings
- Check middleware configuration

### Debug Mode

Add this to your components for debugging:

```tsx
import { useUser } from '@clerk/nextjs'

function DebugInfo() {
  const { user, isLoaded } = useUser()

  console.log('User:', user)
  console.log('Is Loaded:', isLoaded)

  return null
}
```

---

## 🚀 Production Deployment

### Environment Variables

Set these in your hosting provider:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Vercel Deployment

1. Connect your repository to Vercel
2. Add environment variables in Vercel Dashboard
3. Update Clerk redirect URLs to your Vercel domain
4. Deploy!

### Security Considerations

- Use production keys (sk_live_, pk_live_)
- Enable rate limiting in Clerk
- Set up CORS properly in Supabase
- Monitor usage in both dashboards

---

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🤝 Contributing

When adding features:

1. Update database schema if needed
2. Add proper TypeScript types
3. Include RLS policies
4. Test with multiple users
5. Update documentation

Happy coding! 🎓
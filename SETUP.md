# Setup Guide: Assessment Manager with Supabase

This guide will help you set up the Assessment Manager with Supabase for authentication and database storage.

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd assessment-manager
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory with your Supabase credentials.

### 3. Configure Supabase

Follow the steps below to set up Supabase, then update your `.env.local` file.

---

## 🗄️ Supabase Setup

### Step 1: Create Supabase Project

1. Go to [Supabase](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: Assessment Manager
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
5. Wait for project creation (2-3 minutes)

### Step 2: Get Your Supabase Keys

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**
   - **anon/public key**
   - **service_role key** (keep this secret!)

### Step 3: Add Supabase Keys to Environment

Create/update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Step 4: Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the contents of `database/schema-supabase-auth.sql`
3. Verify all tables are created successfully

### Step 5: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure your site URL:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`
3. Enable email confirmations if desired
4. Configure any OAuth providers you want to use

---

## 🧪 Testing Your Setup

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test Authentication

1. Open http://localhost:3000
2. Click "Sign Up" and create an account
3. Verify you're redirected to `/assessments`
4. Test sign out and sign in flow

### 3. Test CRUD Operations

1. **Create Assessment**: Add your first assessment
2. **Add Tasks**: Create tasks for the assessment
3. **Complete Tasks**: Mark tasks as complete
4. **Check Progress**: Verify progress updates
5. **View Planner**: Check assessment appears on calendar

### 4. Test Data Isolation

1. Sign out and create a different user account
2. Verify you cannot see the first user's data
3. Create new data for the second user
4. Switch back to first user - verify their data is intact

---

## 🚀 Deployment

### Environment Variables for Production

Update your environment variables for production:

```env
# Production Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

### Vercel Deployment

1. Connect your repository to Vercel
2. Add environment variables in Vercel Dashboard
3. Update Supabase redirect URLs to your Vercel domain
4. Deploy!

### Security Considerations

- Keep your service role key secret
- Set up proper CORS in Supabase
- Enable Row Level Security (RLS) policies
- Monitor usage in Supabase dashboard
- Use production URLs for production deployment

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
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
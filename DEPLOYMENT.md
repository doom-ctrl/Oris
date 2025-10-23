# Vercel Deployment Guide

This guide will help you deploy the Oris Assessment Manager to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Supabase Project**: Set up and configured with the required tables

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/doom-ctrl/Oris.git)

## Manual Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository: `doom-ctrl/Oris`

### 2. Configure Environment Variables

In the Vercel project settings, add these environment variables:

```bash
# Required - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Required - AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key

# Required - App Configuration
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# Optional - For database migrations
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-project.vercel.app`

## Build Configuration

The project is pre-configured with:

- ✅ **Next.js 15** with App Router
- ✅ **Standalone output** for optimal performance
- ✅ **Image optimization** for Supabase images
- ✅ **Security headers** (CSP, XSS protection)
- ✅ **SEO optimization** with sitemap generation
- ✅ **API routes** with proper CORS headers

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features | ✅ |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL | ✅ |
| `DATABASE_URL` | Direct database connection (optional) | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (optional) | ❌ |

## Post-Deployment Setup

### 1. Update Supabase Auth Settings

In your Supabase dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add your Vercel domain to **Site URL**: `https://your-project.vercel.app`
3. Add to **Redirect URLs**:
   - `https://your-project.vercel.app/auth/callback`
   - `https://your-project.vercel.app/`

### 2. Update CORS Settings

In Supabase **API Settings**:
- Add your Vercel domain to allowed origins

### 3. Test the Deployment

1. Visit your deployed app
2. Test user registration/login
3. Verify all features work correctly

## Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Check TypeScript errors
npm run type-check

# Check linting
npm run lint

# Test build locally
npm run build
```

### Environment Variables

- Ensure all required environment variables are set in Vercel
- Check that URLs don't have trailing slashes
- Verify API keys are correct

### Database Connection

- Ensure Supabase RLS policies are properly configured
- Check that your database schema matches the migrations
- Verify connection strings are correct

## Performance Optimization

The deployment includes:

- **Image Optimization**: WebP/AVIF formats
- **Bundle Optimization**: Tree shaking and code splitting
- **Caching**: Static assets and API responses
- **Compression**: Gzip/Brotli compression
- **CDN**: Global edge network

## Security Features

- **CSP Headers**: Content Security Policy
- **XSS Protection**: Cross-site scripting prevention
- **Frame Options**: Clickjacking protection
- **HTTPS**: SSL/TLS encryption
- **Environment Isolation**: Secure environment variables

## Monitoring

After deployment, monitor:

- **Performance**: Core Web Vitals in Vercel Analytics
- **Errors**: Runtime errors in Vercel Functions
- **Usage**: API endpoint usage and response times
- **Database**: Supabase dashboard metrics

## Support

For deployment issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Review [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
3. Check [Supabase Integration Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

---

**Happy Deploying! 🚀**
# Deploying to Vercel

This guide covers deploying Super Topics to Vercel.

## Overview

Deployment is minimal. The app is already configured for production. The only significant task is updating authentication URLs.

## What's Already Ready

- ✅ Next.js 16 - zero config on Vercel
- ✅ Supabase integration - just add env vars
- ✅ API routes with authentication
- ✅ Build command: `npm run build`

## Pre-Deployment Checklist

### 1. Environment Variables

Copy these from your `.env.local` to Vercel dashboard:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `OPENAI_API_KEY` | OpenAI API key for GPT calls |
| `APIFY_API_TOKEN` | Apify API token |
| `APIFY_AUTOCOMPLETE_ACTOR` | Your private actor name |

### 2. Authentication URLs (The Main Task)

This is the primary deployment consideration.

#### In Your Codebase

Update `src/app/login/page.tsx` to use environment variable:

```tsx
redirectTo: process.env.NEXT_PUBLIC_APP_URL + "/auth/callback"
```

Add to `.env.local`:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Add to Vercel:
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### In Supabase Dashboard

1. Go to **Authentication → URL Configuration**
2. Update **Site URL**: `https://your-domain.vercel.app`
3. Add to **Redirect URLs**:
   - `https://your-domain.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (keep for local dev)

#### In Google Cloud Console

1. Go to **APIs & Services → Credentials**
2. Edit your OAuth 2.0 Client
3. Add to **Authorized redirect URIs**:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
4. Add to **Authorized JavaScript origins**:
   - `https://your-domain.vercel.app`

## Deployment Steps

### First Time Setup

1. Install Vercel CLI (optional):
   ```bash
   npm i -g vercel
   ```

2. Connect to Vercel:
   ```bash
   vercel
   ```
   Or connect via GitHub at [vercel.com/new](https://vercel.com/new)

3. Add environment variables in Vercel dashboard:
   - Project Settings → Environment Variables
   - Add all variables from the table above

4. Deploy:
   ```bash
   vercel --prod
   ```
   Or push to `main` branch for automatic deploys

### Subsequent Deploys

Just push to `main`. Vercel auto-deploys.

```bash
git push origin main
```

## Post-Deployment Verification

1. **Visit the site** - should load without errors
2. **Test Google login** - should redirect properly
3. **Test topic expansion** - should work with Apify
4. **Check Vercel logs** - Functions tab for any API errors

## Custom Domain (Optional)

1. In Vercel: Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update all auth URLs to use new domain

## Troubleshooting

### "Invalid redirect URI" on login
- Check Supabase redirect URLs include your Vercel domain
- Check Google Console includes Supabase callback URL

### API routes returning 500
- Check environment variables are set in Vercel
- Check Vercel Functions logs for specific errors

### Build fails
- Run `npm run build` locally first
- Check for TypeScript errors: `npx tsc --noEmit`

## Cost Considerations

**Vercel Free Tier includes:**
- 100GB bandwidth/month
- Unlimited deployments
- Preview deployments for branches
- Serverless functions (100GB-hours)

**When you might need Pro ($20/mo):**
- Team collaboration
- Higher bandwidth
- Password protection for previews

## Summary

Deployment is minimal:

1. Add env vars to Vercel
2. Update auth callback URLs (Supabase + Google)
3. Deploy

That's it. The app is already production-ready.

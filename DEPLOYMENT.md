# Production Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- GitHub account
- Vercel account
- Domain name (optional, but recommended)

### Step 1: Repository Setup
Your code is already committed and ready for deployment. Push to GitHub:

```bash
git push origin main
```

### Step 2: Create Vercel Project
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your GitHub repository: `task-app`
4. Vercel will detect Next.js automatically
5. **Don't deploy yet** - we need to set up environment variables first

### Step 3: Set Up Production Database
Choose one of these options:

#### Option A: Vercel Postgres (Recommended)
1. In your Vercel project, go to **Storage** tab
2. Click **Create Database** → **Postgres**
3. Choose region: `iad1` (US East) or closest to your users
4. Copy the `DATABASE_URL` from connection details

#### Option B: Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to **Settings** → **Database**
4. Copy the PostgreSQL connection string

### Step 4: Set Up OAuth Providers

#### Google OAuth
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create credentials → OAuth 2.0 Client IDs
5. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
6. Copy Client ID and Client Secret

#### GitHub OAuth
1. Go to [GitHub Settings](https://github.com/settings/applications/new)
2. Set Application name: "Task Management App"
3. Set Homepage URL: `https://your-domain.com`
4. Set Authorization callback URL: `https://your-domain.com/api/auth/callback/github`
5. Click "Register application"
6. Copy Client ID and generate Client Secret

### Step 5: Configure Environment Variables
In Vercel project settings → **Environment Variables**, add:

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=wtStxmkfeJ+LdXUe3jWHO6YqzAt4cCLN9fLeO4H8BpY=
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
NODE_ENV=production
```

**Important**: Set all variables for **Production** environment.

### Step 6: Deploy
1. Click **Deploy** in Vercel
2. Wait for build to complete (includes database migration)
3. Test the deployment at your `.vercel.app` URL

### Step 7: Custom Domain (Optional)
1. In Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS as instructed by Vercel
4. Update `NEXTAUTH_URL` environment variable to your custom domain
5. Update OAuth provider redirect URLs to use custom domain
6. Redeploy

## 🔧 Manual Deployment Commands

If you prefer command line deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
# ... add all other variables

# Deploy
vercel --prod
```

## ✅ Verification Checklist

After deployment, verify:

- [ ] Application loads at production URL
- [ ] Authentication works (Google, GitHub)
- [ ] Database connectivity (`/api/healthcheck`)
- [ ] All features work as expected
- [ ] SSL certificate is active
- [ ] Environment variables are set correctly

## 🐛 Troubleshooting

### Common Issues

**Build Fails**
- Check environment variables are set
- Verify `DATABASE_URL` format
- Ensure all OAuth credentials are correct

**Authentication Errors**
- Verify OAuth redirect URLs match your domain
- Check `NEXTAUTH_URL` matches deployment URL
- Ensure `NEXTAUTH_SECRET` is set

**Database Connection Issues**
- Verify `DATABASE_URL` format includes `?sslmode=require`
- Check database is accessible from Vercel
- Review health check endpoint: `/api/healthcheck`

### Helpful Commands

```bash
# Validate environment locally
npm run env:validate

# Test production build
npm run build

# Generate new secrets
npm run env:generate

# Check deployment logs
vercel logs --prod
```

## 🔐 Security Notes

- All environment variables contain sensitive data
- Never commit `.env.production` to git
- Rotate secrets regularly
- Monitor for unauthorized access
- Keep OAuth apps updated with current URLs

## 📊 Monitoring

Your deployment includes:
- Health check endpoint: `/healthcheck`
- Error tracking ready (Sentry setup in next phase)
- Performance monitoring via Vercel Analytics
- Database connection monitoring

## 🎯 Next Steps

After successful deployment:
1. Set up monitoring and error tracking (Checkpoint 5.2 continues)
2. Create deployment pipeline automation
3. Implement backup strategy
4. Configure alerts and notifications

---

**Need Help?** Check the logs in Vercel dashboard or run local validation scripts.
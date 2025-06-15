#!/bin/bash

# Generate secure secrets for production deployment

echo "🔐 Generating production secrets..."

# Generate NEXTAUTH_SECRET
echo "✅ NEXTAUTH_SECRET (copy to Vercel environment variables):"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo ""

# OAuth setup instructions
echo "🔗 OAuth Provider Setup Instructions:"
echo ""
echo "📧 Google OAuth Setup:"
echo "1. Go to https://console.developers.google.com/"
echo "2. Create new project or select existing"
echo "3. Enable Google+ API"
echo "4. Create credentials → OAuth 2.0 Client IDs"
echo "5. Add authorized redirect URI: https://your-domain.com/api/auth/callback/google"
echo "6. Copy Client ID and Client Secret"
echo ""

echo "🐙 GitHub OAuth Setup:"
echo "1. Go to https://github.com/settings/applications/new"
echo "2. Set Application name: 'Task Management App'"
echo "3. Set Homepage URL: https://your-domain.com"
echo "4. Set Authorization callback URL: https://your-domain.com/api/auth/callback/github"
echo "5. Click 'Register application'"
echo "6. Copy Client ID and generate Client Secret"
echo ""

echo "🗄️ Database Setup Options:"
echo ""
echo "Option 1 - Vercel Postgres (Recommended):"
echo "1. Go to Vercel Dashboard → Your Project → Storage"
echo "2. Click 'Create Database' → Select 'Postgres'"
echo "3. Choose region: iad1 (US East)"
echo "4. Copy DATABASE_URL from connection details"
echo ""

echo "Option 2 - Supabase:"
echo "1. Create account at https://supabase.com"
echo "2. Create new project"
echo "3. Go to Settings → Database"
echo "4. Copy PostgreSQL connection string"
echo ""

echo "🌐 Environment Variables to Add in Vercel:"
echo "DATABASE_URL=postgresql://..."
echo "NEXTAUTH_URL=https://your-production-domain.com"
echo "NEXTAUTH_SECRET=(generated above)"
echo "GOOGLE_CLIENT_ID=your-google-client-id"
echo "GOOGLE_CLIENT_SECRET=your-google-client-secret"
echo "GITHUB_CLIENT_ID=your-github-client-id"
echo "GITHUB_CLIENT_SECRET=your-github-client-secret"
echo "NODE_ENV=production"
echo ""

echo "✅ Secrets generation complete!"
echo "📋 Copy the values above to your Vercel project environment variables"
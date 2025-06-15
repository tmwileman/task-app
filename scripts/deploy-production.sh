#!/bin/bash

# Production Deployment Script
# This script handles the complete production deployment process

set -e

echo "🚀 Starting production deployment..."

# Check if we have the required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is required"
  echo "Please set up your production database and configure environment variables"
  exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "❌ ERROR: NEXTAUTH_SECRET environment variable is required"
  echo "Generate one with: openssl rand -base64 32"
  exit 1
fi

echo "✅ Environment variables check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "🏗️ Building application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm run test

# Type checking
echo "🔍 Type checking..."
npm run typecheck

# Linting
echo "✨ Linting code..."
npm run lint

echo "✅ Production deployment preparation complete!"
echo "🌐 Ready to deploy to Vercel"
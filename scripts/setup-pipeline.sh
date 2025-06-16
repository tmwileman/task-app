#!/bin/bash

# GitHub Actions Pipeline Setup Script
# Sets up the complete CI/CD pipeline with monitoring and backup automation

echo "🚀 Setting up CI/CD pipeline for Task Management App..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "❌ Error: Not in a git repository"
  echo "Please run this script from the root of your git repository"
  exit 1
fi

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
  echo "⚠️  GitHub CLI not found. Install from: https://cli.github.com/"
  echo "You'll need to manually configure secrets in GitHub repository settings"
fi

echo ""
echo "📋 Pipeline Setup Checklist"
echo "=========================="

# 1. Verify repository structure
echo ""
echo "1. 📁 Verifying repository structure..."
if [ -f ".github/workflows/ci-cd.yml" ]; then
  echo "   ✅ CI/CD workflow configured"
else
  echo "   ❌ CI/CD workflow missing"
fi

if [ -f ".github/workflows/monitoring.yml" ]; then
  echo "   ✅ Monitoring workflow configured"
else
  echo "   ❌ Monitoring workflow missing"
fi

if [ -f ".github/workflows/backup.yml" ]; then
  echo "   ✅ Backup workflow configured"
else
  echo "   ❌ Backup workflow missing"
fi

# 2. Check required files
echo ""
echo "2. 🔍 Checking required files..."
required_files=(
  "package.json"
  "prisma/schema.prisma"
  "next.config.js"
  "vercel.json"
  "scripts/verify-deployment.sh"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file exists"
  else
    echo "   ❌ $file missing"
  fi
done

# 3. Validate package.json scripts
echo ""
echo "3. 📦 Validating package.json scripts..."
required_scripts=(
  "build"
  "test"
  "lint"
  "typecheck"
  "vercel-build"
  "db:generate"
  "pipeline:validate"
  "pipeline:build"
)

for script in "${required_scripts[@]}"; do
  if npm run --silent "$script" --if-present 2>/dev/null | grep -q "Missing script"; then
    echo "   ❌ Script '$script' missing"
  else
    echo "   ✅ Script '$script' configured"
  fi
done

# 4. GitHub repository configuration
echo ""
echo "4. 🔧 GitHub Repository Configuration"
echo ""
echo "Required GitHub Secrets:"
echo "========================"
echo "VERCEL_TOKEN           - Vercel deployment token"
echo "DATABASE_URL           - Production database connection string"
echo "PRODUCTION_URL         - Your production domain (optional)"
echo "CODECOV_TOKEN          - Code coverage upload token (optional)"
echo ""

if command -v gh &> /dev/null; then
  echo "Setting up GitHub repository secrets..."
  
  # Check if user is logged in
  if ! gh auth status &> /dev/null; then
    echo "📝 Please login to GitHub CLI first:"
    echo "   gh auth login"
    echo ""
  else
    echo "✅ GitHub CLI authenticated"
    
    # Get repository info
    repo_info=$(gh repo view --json name,owner)
    repo_name=$(echo "$repo_info" | jq -r '.name')
    repo_owner=$(echo "$repo_info" | jq -r '.owner.login')
    
    echo "📍 Repository: $repo_owner/$repo_name"
    echo ""
    
    echo "🔐 Configuring repository secrets..."
    echo "Please enter the following values (press Enter to skip):"
    echo ""
    
    # VERCEL_TOKEN
    read -p "Vercel Token: " vercel_token
    if [ ! -z "$vercel_token" ]; then
      echo "$vercel_token" | gh secret set VERCEL_TOKEN
      echo "   ✅ VERCEL_TOKEN set"
    fi
    
    # DATABASE_URL
    read -p "Production Database URL: " database_url
    if [ ! -z "$database_url" ]; then
      echo "$database_url" | gh secret set DATABASE_URL
      echo "   ✅ DATABASE_URL set"
    fi
    
    # PRODUCTION_URL
    read -p "Production URL (e.g., https://your-app.vercel.app): " production_url
    if [ ! -z "$production_url" ]; then
      echo "$production_url" | gh secret set PRODUCTION_URL
      echo "   ✅ PRODUCTION_URL set"
    fi
    
    # CODECOV_TOKEN
    read -p "Codecov Token (optional): " codecov_token
    if [ ! -z "$codecov_token" ]; then
      echo "$codecov_token" | gh secret set CODECOV_TOKEN
      echo "   ✅ CODECOV_TOKEN set"
    fi
  fi
else
  echo "Manual Secret Configuration:"
  echo "1. Go to GitHub repository → Settings → Secrets and variables → Actions"
  echo "2. Add the secrets listed above"
  echo "3. Ensure values are correct and properly formatted"
fi

# 5. Branch protection setup
echo ""
echo "5. 🛡️  Branch Protection Setup"
echo ""
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
  echo "Setting up branch protection for 'main' branch..."
  
  # Note: This would require admin permissions
  echo "⚠️  Branch protection requires admin access to repository"
  echo "Recommended settings for 'main' branch:"
  echo "- Require pull request reviews before merging"
  echo "- Require status checks to pass before merging"
  echo "- Require branches to be up to date before merging"
  echo "- Include administrators in restrictions"
  echo ""
  echo "Configure at: https://github.com/$repo_owner/$repo_name/settings/branches"
else
  echo "Manual Branch Protection Configuration:"
  echo "1. Go to GitHub repository → Settings → Branches"
  echo "2. Add rule for 'main' branch"
  echo "3. Enable required status checks"
  echo "4. Require pull request reviews"
fi

# 6. Vercel project configuration
echo ""
echo "6. 🌐 Vercel Project Configuration"
echo ""
echo "Vercel Setup Steps:"
echo "1. Connect GitHub repository to Vercel"
echo "2. Configure environment variables in Vercel dashboard"
echo "3. Set up custom domain (optional)"
echo "4. Configure preview deployments for pull requests"
echo ""
echo "Environment variables to add in Vercel:"
echo "- DATABASE_URL"
echo "- NEXTAUTH_URL"
echo "- NEXTAUTH_SECRET"
echo "- GOOGLE_CLIENT_ID"
echo "- GOOGLE_CLIENT_SECRET"
echo "- GITHUB_CLIENT_ID"
echo "- GITHUB_CLIENT_SECRET"
echo "- NEXT_PUBLIC_SENTRY_DSN"
echo "- SENTRY_ORG"
echo "- SENTRY_PROJECT"
echo "- SENTRY_AUTH_TOKEN"

# 7. Testing the pipeline
echo ""
echo "7. 🧪 Testing Pipeline Setup"
echo ""
echo "Test pipeline locally:"
echo "npm run pipeline:validate  # Run tests and quality checks"
echo "npm run pipeline:build     # Test build process"
echo ""
echo "Test deployment verification:"
echo "npm run deploy:verify https://your-app-url.vercel.app"

# 8. Monitoring setup
echo ""
echo "8. 📊 Monitoring Setup"
echo ""
echo "Additional monitoring setup:"
echo "1. Create Sentry account and project"
echo "2. Configure external uptime monitoring (UptimeRobot, Pingdom)"
echo "3. Set up alerting notifications (Slack, email)"
echo "4. Configure log aggregation (optional)"

# 9. Final checklist
echo ""
echo "9. ✅ Final Checklist"
echo ""
echo "Before pushing to trigger the pipeline:"
echo "- [ ] All secrets configured in GitHub"
echo "- [ ] Vercel project connected and configured"
echo "- [ ] Environment variables set in Vercel"
echo "- [ ] Branch protection rules configured"
echo "- [ ] Local tests pass: npm run pipeline:validate"
echo "- [ ] Local build succeeds: npm run pipeline:build"
echo "- [ ] Monitoring endpoints configured"
echo ""

echo "🎉 Pipeline setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Review docs/deployment-pipeline.md for detailed information"
echo "2. Push changes to trigger the pipeline"
echo "3. Monitor the first deployment in GitHub Actions"
echo "4. Verify monitoring and backup workflows"
echo ""
echo "🔗 Useful links:"
echo "- GitHub Actions: https://github.com/$repo_owner/$repo_name/actions"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Repository Settings: https://github.com/$repo_owner/$repo_name/settings"
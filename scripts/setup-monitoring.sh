#!/bin/bash

# Monitoring setup script
# Sets up Sentry and other monitoring tools

echo "🔍 Setting up monitoring and error tracking..."

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SENTRY_DSN" ]; then
  echo "⚠️  NEXT_PUBLIC_SENTRY_DSN not set"
  echo "Please follow these steps to set up Sentry:"
  echo ""
  echo "1. Create account at https://sentry.io"
  echo "2. Create new project for Next.js"
  echo "3. Copy the DSN from project settings"
  echo "4. Add to environment variables:"
  echo "   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id"
  echo ""
fi

if [ -z "$SENTRY_ORG" ]; then
  echo "⚠️  SENTRY_ORG not set (optional for source maps)"
  echo "Add to environment variables: SENTRY_ORG=your-organization-slug"
fi

if [ -z "$SENTRY_PROJECT" ]; then
  echo "⚠️  SENTRY_PROJECT not set (optional for source maps)"
  echo "Add to environment variables: SENTRY_PROJECT=your-project-slug"
fi

# Create Sentry properties file for source maps
echo "📝 Creating sentry.properties file..."
cat > sentry.properties << EOF
defaults.url=https://sentry.io/
defaults.org=\${SENTRY_ORG}
defaults.project=\${SENTRY_PROJECT}

cli.executable=npx @sentry/cli
EOF

echo "✅ sentry.properties created"

# Test Sentry configuration
echo "🧪 Testing Sentry configuration..."
if [ ! -z "$NEXT_PUBLIC_SENTRY_DSN" ]; then
  echo "✅ Sentry DSN configured"
else
  echo "❌ Sentry DSN not configured"
fi

# Performance monitoring setup
echo ""
echo "📊 Performance Monitoring Setup:"
echo "1. Web Vitals tracking is configured in useMonitoring hook"
echo "2. API response time tracking is enabled"
echo "3. Database query performance monitoring is active"
echo "4. Custom business metrics can be tracked via appMonitoring utility"

# Error tracking setup
echo ""
echo "🐛 Error Tracking Setup:"
echo "1. Client-side error capture with React Error Boundaries"
echo "2. Server-side error capture in API routes"
echo "3. Database error tracking with operation context"
echo "4. User feedback collection on errors"

# Uptime monitoring suggestions
echo ""
echo "⏰ Uptime Monitoring Recommendations:"
echo "1. Set up external uptime monitoring (UptimeRobot, Pingdom, etc.)"
echo "2. Monitor /api/healthcheck endpoint every 1-5 minutes"
echo "3. Set up alerts for response time > 5s or status code != 200"
echo "4. Monitor from multiple geographic locations"

# Alerting setup
echo ""
echo "🚨 Alerting Setup:"
echo "1. Configure Sentry alerts for error rate thresholds"
echo "2. Set up Slack/email notifications for critical errors"
echo "3. Create alerts for performance regressions"
echo "4. Monitor business metrics (user registrations, task creation, etc.)"

# Additional monitoring tools
echo ""
echo "🛠️  Additional Monitoring Tools (Optional):"
echo "1. Vercel Analytics (automatically enabled on Vercel)"
echo "2. Google Analytics 4 (for user behavior)"
echo "3. LogRocket or FullStory (session replay)"
echo "4. DataDog or New Relic (infrastructure monitoring)"

echo ""
echo "✅ Monitoring setup instructions complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create Sentry account and project"
echo "2. Add environment variables to your deployment"
echo "3. Deploy with monitoring enabled"
echo "4. Set up external uptime monitoring"
echo "5. Configure alerting rules"
echo ""
echo "🔗 Useful links:"
echo "- Sentry: https://sentry.io"
echo "- UptimeRobot: https://uptimerobot.com"
echo "- Vercel Analytics: https://vercel.com/analytics"
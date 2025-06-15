#!/bin/bash

# Deployment verification script
# Usage: ./scripts/verify-deployment.sh https://your-app.vercel.app

if [ -z "$1" ]; then
  echo "Usage: $0 <deployment-url>"
  echo "Example: $0 https://task-app.vercel.app"
  exit 1
fi

URL="$1"
echo "🔍 Verifying deployment at: $URL"
echo ""

# Check if URL is accessible
echo "📡 Testing connectivity..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Application is accessible (HTTP $HTTP_CODE)"
else
  echo "❌ Application not accessible (HTTP $HTTP_CODE)"
  exit 1
fi

# Check health endpoint
echo ""
echo "🏥 Testing health check..."
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/healthcheck")
if [ "$HEALTH_CODE" = "200" ]; then
  echo "✅ Health check passed (HTTP $HEALTH_CODE)"
  # Get health check details
  curl -s "$URL/api/healthcheck" | grep -q "healthy" && echo "✅ Database connection confirmed"
else
  echo "❌ Health check failed (HTTP $HEALTH_CODE)"
fi

# Check SSL certificate
echo ""
echo "🔒 Verifying SSL certificate..."
if curl -s --head "$URL" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
  if [[ "$URL" == https://* ]]; then
    echo "✅ SSL certificate is valid"
  else
    echo "⚠️  Using HTTP (consider HTTPS for production)"
  fi
fi

# Check security headers
echo ""
echo "🛡️  Checking security headers..."
HEADERS=$(curl -s -I "$URL")

if echo "$HEADERS" | grep -q "X-Content-Type-Options: nosniff"; then
  echo "✅ X-Content-Type-Options header present"
else
  echo "❌ X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -q "X-Frame-Options: DENY"; then
  echo "✅ X-Frame-Options header present"
else
  echo "❌ X-Frame-Options header missing"
fi

if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
  echo "✅ HSTS header present"
else
  echo "⚠️  HSTS header missing (normal for HTTP)"
fi

# Test API endpoints
echo ""
echo "🔌 Testing API endpoints..."

# Test auth endpoint
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/auth/providers")
if [ "$AUTH_CODE" = "200" ]; then
  echo "✅ Auth API accessible"
else
  echo "❌ Auth API not accessible (HTTP $AUTH_CODE)"
fi

echo ""
echo "🎉 Deployment verification complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test user authentication flows"
echo "2. Create test tasks and verify functionality"
echo "3. Check OAuth provider integrations"
echo "4. Monitor application performance"
echo ""
echo "🔗 Access your app: $URL"
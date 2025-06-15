# Production Database Setup Guide

## Overview
This guide covers setting up a PostgreSQL production database for the task management application.

## Database Provider Options

### Option 1: Vercel Postgres (Recommended)
**Pros:**
- Seamless integration with Vercel deployment
- Automatic scaling and connection pooling
- Built-in monitoring and backups
- SSL/TLS encryption by default

**Setup Steps:**
1. Go to Vercel Dashboard → Your Project → Storage tab
2. Click "Create Database" → Select "Postgres"
3. Choose region closest to your users (recommend `iad1` for US East)
4. Database will be provisioned automatically
5. Copy the `DATABASE_URL` from the connection details

### Option 2: Supabase
**Pros:**
- Free tier available
- Built-in authentication (if needed)
- Real-time subscriptions
- PostgREST API layer

**Setup Steps:**
1. Create account at supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string for `DATABASE_URL`

### Option 3: Railway
**Pros:**
- Simple setup
- Good pricing for small apps
- Automatic backups

**Setup Steps:**
1. Create account at railway.app
2. Create new project → Add PostgreSQL
3. Copy `DATABASE_URL` from connection info

## Environment Variables Setup

Copy these variables to your Vercel project settings:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="your-secret-generated-with-openssl-rand-base64-32"

# OAuth Providers (create production apps)
GOOGLE_CLIENT_ID="your-google-production-client-id"
GOOGLE_CLIENT_SECRET="your-google-production-client-secret"
GITHUB_CLIENT_ID="your-github-production-client-id" 
GITHUB_CLIENT_SECRET="your-github-production-client-secret"

# Production settings
NODE_ENV="production"
```

## Database Migration

### Automated Migration (Vercel Build)
Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### Manual Migration
Run these commands after setting up your database:

```bash
# Generate Prisma client
npx prisma generate

# Deploy migrations to production
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

## Performance Optimization

### Connection Pooling
Vercel Postgres includes connection pooling by default. For other providers, consider:
- PgBouncer for connection pooling
- Setting `connection_limit` in DATABASE_URL

### Database Indexes
Our schema includes optimized indexes for:
- User task queries
- Due date filtering  
- Archive management
- Tag-based searching
- Subtask hierarchies

### Query Optimization
- Use Prisma's `select` to limit returned fields
- Implement pagination for large datasets
- Use database-level filtering vs. application filtering

## Security

### SSL/TLS
- Always use `sslmode=require` in DATABASE_URL
- Verify SSL certificates in production

### Access Control
- Use environment variables for sensitive data
- Rotate database passwords regularly
- Monitor for unusual access patterns

### Data Protection
- Enable automated backups
- Test backup restoration procedures
- Implement point-in-time recovery

## Monitoring

### Database Metrics to Monitor
- Connection count and utilization
- Query performance and slow queries
- Storage usage and growth
- Backup success/failure
- SSL certificate expiration

### Alerting Setup
- High connection count alerts
- Slow query alerts (>1s)
- Storage threshold alerts (80% full)
- Failed backup alerts

## Backup Strategy

### Automated Backups
- Daily full backups (minimum)
- Point-in-time recovery capability
- Cross-region backup storage
- Backup retention policy (30+ days)

### Backup Testing
- Monthly backup restoration tests
- Disaster recovery procedure testing
- Data integrity verification
- Recovery time measurement

## Troubleshooting

### Common Issues
1. **Connection Timeout**
   - Check connection string format
   - Verify SSL mode settings
   - Check Vercel function timeout limits

2. **Migration Failures**
   - Ensure DATABASE_URL is correct
   - Check for schema conflicts
   - Verify database permissions

3. **Performance Issues**
   - Monitor slow query logs
   - Check index usage
   - Review connection pooling

### Production Checklist
- [ ] Database provisioned with SSL
- [ ] Environment variables configured
- [ ] Migrations deployed successfully
- [ ] Indexes created and optimized
- [ ] Backups configured and tested
- [ ] Monitoring and alerts set up
- [ ] Connection pooling configured
- [ ] Performance baseline established
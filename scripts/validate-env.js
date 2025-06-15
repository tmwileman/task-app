#!/usr/bin/env node

// Environment validation script for production deployment
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL', 
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET'
]

const optionalEnvVars = [
  'NODE_ENV'
]

console.log('🔍 Validating environment variables...\n')

let hasErrors = false

// Check required variables
console.log('📋 Required Variables:')
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (!value) {
    console.log(`❌ ${varName}: Missing`)
    hasErrors = true
  } else if (value.includes('your-') || value.includes('...')) {
    console.log(`⚠️  ${varName}: Contains placeholder value`)
    hasErrors = true
  } else {
    console.log(`✅ ${varName}: Configured`)
  }
})

console.log('\n📋 Optional Variables:')
optionalEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (!value) {
    console.log(`⚠️  ${varName}: Not set (will use default)`)
  } else {
    console.log(`✅ ${varName}: ${value}`)
  }
})

// Validate specific formats
console.log('\n🔧 Format Validation:')

// Database URL validation
const dbUrl = process.env.DATABASE_URL
if (dbUrl) {
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    if (dbUrl.includes('sslmode=require') || dbUrl.includes('ssl=true')) {
      console.log('✅ DATABASE_URL: Valid PostgreSQL URL with SSL')
    } else {
      console.log('⚠️  DATABASE_URL: Missing SSL configuration (add ?sslmode=require)')
    }
  } else {
    console.log('❌ DATABASE_URL: Invalid format (must start with postgresql://)')
    hasErrors = true
  }
}

// NextAuth URL validation
const nextAuthUrl = process.env.NEXTAUTH_URL
if (nextAuthUrl) {
  if (nextAuthUrl.startsWith('https://')) {
    console.log('✅ NEXTAUTH_URL: Valid HTTPS URL')
  } else {
    console.log('❌ NEXTAUTH_URL: Must use HTTPS in production')
    hasErrors = true
  }
}

// NextAuth Secret validation
const nextAuthSecret = process.env.NEXTAUTH_SECRET
if (nextAuthSecret) {
  if (nextAuthSecret.length >= 32) {
    console.log('✅ NEXTAUTH_SECRET: Sufficient length')
  } else {
    console.log('❌ NEXTAUTH_SECRET: Too short (minimum 32 characters)')
    hasErrors = true
  }
}

console.log('\n' + '='.repeat(50))

if (hasErrors) {
  console.log('❌ Environment validation failed!')
  console.log('Please fix the issues above before deploying to production.')
  process.exit(1)
} else {
  console.log('✅ All environment variables are properly configured!')
  console.log('Ready for production deployment.')
}
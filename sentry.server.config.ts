import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Server-specific integrations
  integrations: [
    Sentry.prismaIntegration(),
  ],
  
  // Error filtering
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    
    // Filter out database connection timeouts in development
    if (event.exception?.values?.[0]?.value?.includes("ETIMEDOUT")) {
      return null;
    }
    
    return event;
  },
  
  // Additional tags for better organization
  initialScope: {
    tags: {
      component: "server",
    },
  },
  
  // Capture unhandled promise rejections
  captureUnhandledRejections: true,
});
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Session replay for better debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Error filtering
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    
    // Filter out common non-critical errors
    if (event.exception?.values?.[0]?.type === "ChunkLoadError") {
      return null;
    }
    
    return event;
  },
  
  // Additional tags for better organization
  initialScope: {
    tags: {
      component: "client",
    },
  },
});
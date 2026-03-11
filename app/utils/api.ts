/**
 * Get the API endpoint URL based on the environment
 * - Development: Uses Next.js API route
 * - Production: Uses Firebase Cloud Function (if on Firebase hosting)
 * 
 * Environment variables (set at build time):
 * - NEXT_PUBLIC_FIREBASE_FUNCTION_URL: Explicit function URL (highest priority)
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID: Firebase project ID
 * - NEXT_PUBLIC_FIREBASE_REGION: Firebase region (default: us-central1)
 */
export function getApiEndpoint(): string {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return '/api/process';
  }

  // Priority 1: Explicit function URL (set via environment variable)
  const explicitUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  // Priority 2: Auto-detect Firebase hosting and construct function URL
  const hostname = window.location.hostname;
  
  // Check if we're on Firebase Hosting
  const isFirebaseHosting = hostname.includes('.web.app') || 
                           hostname.includes('.firebaseapp.com');
  
  if (isFirebaseHosting) {
    // Extract project ID from hostname or use env var
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
                     hostname.split('.')[0];
    const region = process.env.NEXT_PUBLIC_FIREBASE_REGION || 'us-central1';
    return `https://${region}-${projectId}.cloudfunctions.net/processImage`;
  }

  // Priority 3: Localhost - use Firebase Functions emulator
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'exifilixir';
    const region = process.env.NEXT_PUBLIC_FIREBASE_REGION || 'us-central1';
    return `http://localhost:5001/${projectId}/${region}/processImage`;
  }

  // Priority 4: Fallback - use deployed Firebase Functions
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'exifilixir';
  const region = process.env.NEXT_PUBLIC_FIREBASE_REGION || 'us-central1';
  return `https://${region}-${projectId}.cloudfunctions.net/processImage`;
}

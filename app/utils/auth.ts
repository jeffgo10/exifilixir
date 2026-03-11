/**
 * Get the API token from environment variables
 * In production, this should be set as an environment variable
 */
export function getApiToken(): string | null {
  // Check for token in environment variable
  // For client-side, use NEXT_PUBLIC_ prefix
  return process.env.NEXT_PUBLIC_API_TOKEN || null;
}

/**
 * Validate API token
 * This function is used on the server-side to validate tokens
 */
export function validateToken(token: string | null): boolean {
  if (!token) {
    return false;
  }

  // Get the expected token from environment
  const expectedToken = process.env.API_TOKEN || process.env.NEXT_PUBLIC_API_TOKEN;
  
  if (!expectedToken) {
    // If no token is configured, allow requests (for development)
    // In production, you should always have a token
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return true;
  }

  // Compare tokens (use constant-time comparison in production)
  return token === expectedToken;
}

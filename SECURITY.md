# Security Guide

## API Token Authentication

The application uses token-based authentication to protect API endpoints from abuse.

## How It Works

1. **Token Generation**: A secure random token is generated and stored in environment variables
2. **Token Validation**: Both Next.js API routes and Firebase Cloud Functions validate the token on each request
3. **Client-Side Token**: The token is included in requests from the frontend

## Setting Up Tokens

### Development

In development, the API will work without tokens (for easier testing). However, you can still set tokens if needed.

### Production

**1. Generate a Secure Token:**

```bash
# Using OpenSSL
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**2. Set Environment Variables:**

**For Next.js (API Routes):**
```bash
# .env.local or production environment
API_TOKEN=your-generated-token-here
NEXT_PUBLIC_API_TOKEN=your-generated-token-here
```

**For Firebase Functions:**
```bash
# Set as Firebase Function config
firebase functions:config:set api.token="your-generated-token"

# Or use Firebase Functions environment variables (recommended)
firebase functions:secrets:set API_TOKEN
# Then enter your token when prompted
```

**3. Update Function Code (if using secrets):**

In `functions/src/index.ts`, update the token retrieval:
```typescript
const expectedToken = functions.config().api?.token || process.env.API_TOKEN;
```

## Token Security Best Practices

1. **Use Different Tokens**: Consider using different tokens for:
   - Client-side (`NEXT_PUBLIC_API_TOKEN`) - visible in bundle
   - Server-side (`API_TOKEN`) - not exposed to client
   - Firebase Functions - separate token for additional security

2. **Rotate Tokens Regularly**: Change tokens periodically, especially if compromised

3. **Never Commit Tokens**: 
   - Add `.env.local` to `.gitignore` (already done)
   - Never commit tokens to version control
   - Use environment variables or secret management services

4. **Use Strong Tokens**: 
   - Minimum 32 characters
   - Use cryptographically secure random generators
   - Mix of alphanumeric characters

5. **Monitor Usage**: 
   - Check logs for unauthorized access attempts
   - Set up rate limiting (can be added as additional security layer)

## Additional Security Measures

### Rate Limiting

Consider adding rate limiting to prevent abuse:
- Use middleware like `express-rate-limit` for Next.js
- Use Firebase Functions quotas and rate limits
- Implement per-IP or per-token rate limiting

### CORS Configuration

The current setup allows all origins (`*`). For production, restrict CORS:
```typescript
res.set('Access-Control-Allow-Origin', 'https://your-domain.com');
```

### File Size Limits

Already implemented: 50MB maximum file size. Adjust in:
- `app/api/process/route.ts`: `MAX_FILE_SIZE`
- `functions/src/index.ts`: `MAX_FILE_SIZE`

## Troubleshooting

### "Unauthorized: Invalid or missing API token"

1. Check that `API_TOKEN` or `NEXT_PUBLIC_API_TOKEN` is set
2. Verify the token matches between client and server
3. Check environment variables are loaded correctly
4. In development, tokens are optional - this error shouldn't appear unless you've set tokens

### Token Not Working in Production

1. Verify environment variables are set in your hosting platform
2. For Firebase Functions, ensure config/secrets are deployed
3. Check that `NEXT_PUBLIC_API_TOKEN` is available at build time (not runtime)

# Testing Production Setup Locally

This guide shows you how to test production features (tokens, Firebase Functions, etc.) on your local machine before deploying.

## Quick Start

### 1. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Generate a secure token
openssl rand -hex 32
# Copy the output and use it below

# API Token (required for production mode)
API_TOKEN=your-generated-token-here
NEXT_PUBLIC_API_TOKEN=your-generated-token-here

# Optional: Test with Firebase Functions locally
# NEXT_PUBLIC_FIREBASE_FUNCTION_URL=http://localhost:5001/your-project/us-central1/processImage
```

### 2. Test with Tokens (Production Mode)

**Option A: Test Next.js API Route with Tokens**

1. Set the environment variables above
2. Run in production mode:
   ```bash
   npm run build
   npm start
   ```
3. The API will now require tokens - test that it works with tokens and rejects without them

**Option B: Test with Development Server (Token Validation)**

Even in development, you can test token validation:
1. Set `API_TOKEN` and `NEXT_PUBLIC_API_TOKEN` in `.env.local`
2. Run `npm run dev`
3. The API will validate tokens (but still works without them in dev mode)

### 3. Test Firebase Functions Locally

Firebase provides emulators to test functions locally:

**Install Firebase Emulators:**
```bash
npm install -g firebase-tools
firebase init emulators
# Select Functions emulator
```

**Start Emulators:**
```bash
# Build functions first
cd functions
npm run build
cd ..

# Start emulators
firebase emulators:start --only functions
```

The function will be available at:
```
http://localhost:5001/your-project/us-central1/processImage
```

**Update Frontend to Use Local Function:**

In `.env.local`, add:
```bash
NEXT_PUBLIC_FIREBASE_FUNCTION_URL=http://localhost:5001/your-project/us-central1/processImage
```

Then run your Next.js app:
```bash
npm run dev
```

The app will use the local Firebase Function instead of the Next.js API route.

### 4. Full Local Production Test

To test the complete production setup locally:

1. **Set up tokens:**
   ```bash
   # .env.local
   API_TOKEN=test-token-123
   NEXT_PUBLIC_API_TOKEN=test-token-123
   ```

2. **Start Firebase Functions emulator:**
   ```bash
   cd functions
   npm run build
   cd ..
   firebase emulators:start --only functions
   ```

3. **In another terminal, build and run Next.js:**
   ```bash
   # Set function URL to local emulator
   export NEXT_PUBLIC_FIREBASE_FUNCTION_URL=http://localhost:5001/your-project/us-central1/processImage
   
   npm run build
   npm start
   ```

4. **Test the app:**
   - Visit `http://localhost:3000`
   - Try uploading an image
   - It should use the Firebase Function emulator
   - Token validation should work

## Testing Token Validation

### Test Without Token (Should Fail in Production)

1. Temporarily remove `NEXT_PUBLIC_API_TOKEN` from `.env.local`
2. Restart the dev server
3. Try uploading an image
4. Should get "Unauthorized" error

### Test With Invalid Token (Should Fail)

1. Set `NEXT_PUBLIC_API_TOKEN=wrong-token` in `.env.local`
2. Restart the dev server
3. Try uploading an image
4. Should get "Unauthorized" error

### Test With Valid Token (Should Work)

1. Set matching tokens in `.env.local`
2. Restart the dev server
3. Try uploading an image
4. Should process successfully

## Environment Variable Priority

The app checks for tokens in this order:
1. `NEXT_PUBLIC_API_TOKEN` (client-side, embedded in bundle)
2. `API_TOKEN` (server-side only)

For local testing, set both to the same value.

## Troubleshooting

### "Unauthorized" Error in Development

- Check that tokens are set correctly in `.env.local`
- Restart the dev server after changing `.env.local`
- Verify token values match between client and server

### Firebase Emulator Not Working

- Make sure Firebase CLI is installed: `npm install -g firebase-tools`
- Check that functions are built: `cd functions && npm run build`
- Verify emulator is running on the expected port (default: 5001)

### Function URL Not Found

- Check the function URL format: `http://localhost:5001/PROJECT_ID/REGION/FUNCTION_NAME`
- Verify your project ID in `.firebaserc`
- Check that the function name matches `processImage` in `functions/src/index.ts`

## Production Checklist

Before deploying to production, test locally:

- [ ] Token validation works
- [ ] Invalid tokens are rejected
- [ ] Valid tokens work
- [ ] Firebase Functions work (if using)
- [ ] File upload and processing works
- [ ] Error handling works correctly
- [ ] CORS headers are correct (if testing from different origin)

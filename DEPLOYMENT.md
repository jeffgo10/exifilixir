# Deployment Guide

This guide explains how to deploy EXIFilixir to Firebase with automatic endpoint switching.

## How It Works

The app automatically detects the environment and uses the appropriate endpoint:

- **Development (localhost)**: Uses Next.js API route at `/api/process`
- **Firebase Production**: Automatically detects Firebase hosting and uses Cloud Functions
- **Manual Override**: Set `NEXT_PUBLIC_FIREBASE_FUNCTION_URL` to explicitly specify the function URL

## Prerequisites

1. Node.js 18+
2. Firebase CLI installed: `npm install -g firebase-tools`
3. A Firebase project created at [Firebase Console](https://console.firebase.google.com/)
4. Generate a secure API token (see Security section below)

## Step-by-Step Deployment

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### 2. Initialize Firebase (First Time Only)

```bash
firebase login
firebase init
```

When prompted:
- Select **Functions** and **Hosting**
- Choose your Firebase project
- For Functions:
  - Language: **TypeScript**
  - ESLint: Yes (optional)
  - Install dependencies: Yes
- For Hosting:
  - Public directory: `out`
  - Single-page app: Yes
  - Set up automatic builds: No (we'll build manually)

### 3. Build Next.js App for Static Export

Since Firebase Hosting serves static files, we need to export the Next.js app:

**Option A: Temporary export config**

1. Update `next.config.js` temporarily:
```javascript
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  output: 'export', // Add this for static export
};
```

2. Build and export:
```bash
npm run build
```

3. The `out` directory will contain your static files.

**Option B: Keep both configs**

You can create a separate build script that temporarily adds the export option.

### 4. Deploy Firebase Functions

```bash
# Build functions
cd functions
npm run build
cd ..

# Deploy functions
firebase deploy --only functions
```

After deployment, note the function URL. It will look like:
```
https://us-central1-your-project-id.cloudfunctions.net/processImage
```

### 5. Set Up API Token (Security)

Generate a secure random token:
```bash
openssl rand -hex 32
```

Set this token in your environment:
- For Next.js API routes: Set `API_TOKEN` in your `.env.local` or production environment
- For client-side: Set `NEXT_PUBLIC_API_TOKEN` (this will be embedded in the bundle)
- For Firebase Functions: Set `API_TOKEN` as a Firebase Function environment variable:
  ```bash
  firebase functions:config:set api.token="your-generated-token"
  ```

**Important**: Use the same token value for all three if you want them to work together, or use different tokens for different security levels.

### 6. Set Environment Variables

Before building the Next.js app for production, set the Firebase function URL:

**Option A: Environment file (recommended)**

Create `.env.production`:
```bash
NEXT_PUBLIC_FIREBASE_FUNCTION_URL=https://us-central1-your-project-id.cloudfunctions.net/processImage
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_REGION=us-central1
```

**Option B: Build-time variables**

Set them when building:
```bash
NEXT_PUBLIC_FIREBASE_FUNCTION_URL=https://... npm run build
```

### 7. Rebuild Next.js with Function URL

If you set environment variables, rebuild:
```bash
npm run build
```

### 8. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Or deploy both at once:
```bash
firebase deploy
```

## Verification

1. Visit your Firebase Hosting URL (e.g., `https://your-project.web.app`)
2. Open browser DevTools → Network tab
3. Upload an image
4. Check the network request - it should go to your Cloud Function URL, not `/api/process`

## Troubleshooting

### Function URL Not Detected

If the app still uses `/api/process` in production:

1. Check that you're on a Firebase hosting domain (`.web.app` or `.firebaseapp.com`)
2. Verify environment variables are set correctly
3. Check browser console for any errors
4. Manually set `NEXT_PUBLIC_FIREBASE_FUNCTION_URL` in your build

### CORS Errors

The Firebase Function includes CORS headers. If you see CORS errors:
- Check that the function is deployed correctly
- Verify the function URL is correct
- Check Firebase Function logs: `firebase functions:log`

### Function Timeout

By default, Firebase Functions have a 60-second timeout. For larger images:
- Consider increasing the timeout in `functions/src/index.ts`
- Or optimize image processing

### Build Errors

If you get build errors:
- Ensure all dependencies are installed
- Check Node.js version (should be 18+)
- Clear `.next` and `out` directories and rebuild

## Development vs Production

### Local Development

```bash
npm run dev
```

- Uses Next.js API route at `/api/process`
- No Firebase Functions needed
- Hot reloading enabled

### Production (Firebase)

- Uses Firebase Cloud Functions
- Static files served from Firebase Hosting
- Automatic environment detection

## Updating Functions

After making changes to `functions/src/index.ts`:

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

## Updating Frontend

After making changes to the Next.js app:

```bash
npm run build
firebase deploy --only hosting
```

Or deploy both:
```bash
npm run build
cd functions && npm run build && cd ..
firebase deploy
```

## CI / GitHub Actions

Merges to `main`/`master` (and manual **workflow_dispatch**) run [`.github/workflows/firebase-deploy.yml`](.github/workflows/firebase-deploy.yml):

1. `npm ci` + `npm run build` (static export → `out/`) with `NEXT_PUBLIC_*` secrets
2. `functions/` install + build
3. `firebase deploy --only hosting,functions` via `FIREBASE_SERVICE_ACCOUNT`

Required GitHub secrets: `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `GH_PACKAGES_READ_TOKEN` (PAT with `read:packages` for `@jeffgo10/*`), `NEXT_PUBLIC_API_TOKEN`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_REGION`, and optionally `NEXT_PUBLIC_FIREBASE_FUNCTION_URL`.

The deploy SA needs **Service Usage Consumer** (and usually Artifact Registry + Cloud Build roles) or CI fails with `403 Permission denied to get service [artifactregistry.googleapis.com]`. See README secret table for the full role list. As project owner you can also enable APIs once:

```bash
gcloud services enable artifactregistry.googleapis.com cloudbuild.googleapis.com cloudfunctions.googleapis.com --project=exifilixir
```

**Out of CI:** set the Cloud Function `API_TOKEN` once in Cloud Run / Firebase Console so it matches `NEXT_PUBLIC_API_TOKEN`. See README “CI / GitHub Actions” for the full table.

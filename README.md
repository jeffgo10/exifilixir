# EXIFilixir - 360° Image Fixer

A Next.js PWA application that fixes EXIF metadata for 360° panorama images (like those from DJI drones) to make them compatible with Facebook's 360° image viewer.

## Features

- 🔧 **Aspect Ratio Fix**: Automatically adjusts images to 2:1 ratio (required by Facebook)
- 📸 **EXIF Metadata Injection**: Adds Google Photo Sphere (GPano) XMP metadata
- 🎨 **Modern UI**: Built with Ant Design for a beautiful user experience
- 📱 **PWA Support**: Installable as a Progressive Web App
- ☁️ **Firebase Ready**: Configured for Firebase Hosting deployment
- 🔐 **Token Authentication**: Protected API endpoints to prevent abuse

## Live app

- If deployed to Firebase Hosting, your URL is typically: `https://<project-id>.web.app`
- This repo uses `NEXT_PUBLIC_SITE_URL` for canonical/OG metadata (recommended).

## Donate

If this tool saved you time and you’d like to support it:

- PayPal donate link: `https://www.paypal.com/ncp/payment/GUDHT2MCK5UCW`

## How It Works

1. **Aspect Ratio Fix**: Uses Sharp to resize images to a perfect 2:1 ratio (width:height)
2. **Metadata Injection**: Uses ExifTool to inject the required XMP-GPano tags:
   - `XMP-GPano:ProjectionType`: "equirectangular"
   - `XMP-GPano:UsePanoramaViewer`: "True"
   - Camera metadata (Ricoh Theta S) for better recognition

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd exifilixir
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example file
cp .env.local.example .env.local

# Generate a secure token (optional, for production)
openssl rand -hex 32

# Edit .env.local and add your tokens
# API_TOKEN=your-generated-token-here
# NEXT_PUBLIC_API_TOKEN=your-generated-token-here
```

**Note**: In development, the API will work without tokens. In production, tokens are required.

## SEO / indexing

- **Site URL**: Set `NEXT_PUBLIC_SITE_URL` (for canonical/OG metadata), for example:
  - `NEXT_PUBLIC_SITE_URL=https://exifilixir.web.app`
- **Crawler files**: `public/robots.txt` and `public/sitemap.xml` are included for basic indexing.

**Local (emulator):** So the Cloud Function emulator validates the token when you run `npm run functions:serve`, create `functions/.env` with the same token:
```bash
cp functions/.env.example functions/.env
# Edit functions/.env and set API_TOKEN=your-secret (same value as NEXT_PUBLIC_API_TOKEN)
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## PWA Icons

Before deploying, you need to add PWA icons to the `public` directory:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)
- `favicon.ico`

You can generate these from any image using online tools or image editing software.

## Deployment

### Option 1: Deploy to Vercel (Recommended)

Vercel natively supports Next.js API routes:

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Option 2: Deploy to Firebase

The app is configured to automatically use:
- **Firebase Functions emulator** in development (localhost)
- **Firebase Cloud Functions** in production (when deployed to Firebase Hosting)

#### Setup and Deploy

1. **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Login to Firebase:**
```bash
firebase login
```

3. **Initialize Firebase (if not already done):**
```bash
firebase init
```
   - Select "Functions" and "Hosting"
   - Choose your Firebase project
   - For functions, use TypeScript
   - For hosting, set public directory to `out`

4. **Install function dependencies:**
```bash
cd functions
npm install
cd ..
```

5. **Build the Next.js app:**
```bash
npm run build
```

6. **Export static files:**
   - Update `next.config.js` to add `output: 'export'` temporarily, OR
   - Use a custom build script that exports after build

7. **Set environment variables:**
   After deploying functions, you'll get a function URL. Set it in your Next.js build:
   ```bash
   # In your build/deploy script or .env.production
   NEXT_PUBLIC_FIREBASE_FUNCTION_URL=https://us-central1-your-project.cloudfunctions.net/processImage
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_REGION=us-central1
   ```

   **API token (Firebase):** To stop "API_TOKEN not set - allowing all requests" in production:
   - **Cloud Function:** In [Google Cloud Console](https://console.cloud.google.com) → **Cloud Run** → select the `processimage` service → **Edit & deploy new revision** → **Variables & secrets** → **Add variable**: name `API_TOKEN`, value your secret. Deploy the new revision.
   - **Frontend:** When you run `npm run build` before deploying hosting, set `NEXT_PUBLIC_API_TOKEN` to the same value (e.g. `NEXT_PUBLIC_API_TOKEN=your-token npm run build`) so the client can send the token. Without it, production requests from the app will get 401 Unauthorized.

8. **Deploy functions:**
```bash
firebase deploy --only functions
```

9. **Deploy hosting:**
```bash
firebase deploy --only hosting
```

#### Environment Detection

The app automatically detects the environment:
- **Development (localhost)**: Uses the Functions emulator at `http://localhost:5001/.../processImage`
- **Firebase Hosting**: Detects `.web.app` or `.firebaseapp.com` domains and uses Cloud Functions
- **Manual override**: Set `NEXT_PUBLIC_FIREBASE_FUNCTION_URL` to explicitly use a function URL

## Project Structure

```
exifilixir/
├── app/
│   ├── api/
│   │   └── process/
│   │       └── route.ts      # API endpoint for image processing
│   ├── layout.tsx            # Root layout with Ant Design config
│   ├── page.tsx              # Main UI component
│   └── globals.css           # Global styles
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icons/                # PWA icons (you'll need to add these)
├── firebase.json             # Firebase configuration
├── next.config.js            # Next.js configuration
└── package.json              # Dependencies
```

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Ant Design**: UI component library
- **Sharp**: High-performance image processing
- **ExifTool-vendored**: EXIF metadata manipulation
- **Firebase**: Hosting and deployment

## Limitations

- API routes in Next.js work best on Vercel. For Firebase, consider using Firebase Functions
- Large images may take time to process
- Currently processes one image at a time

## License

MIT

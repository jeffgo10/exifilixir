# Quick Setup Guide

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add PWA Icons:**
   Place the following icon files in the `public` directory:
   - `icon-192x192.png` (192x192 pixels)
   - `icon-512x512.png` (512x512 pixels)
   - `favicon.ico`
   
   You can create these from any square image using online tools like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Testing

1. Upload a 360° panorama image (preferably from a DJI drone)
2. Wait for processing (the image will be resized to 2:1 ratio and EXIF metadata will be injected)
3. Download the fixed image
4. Upload to Facebook - it should now be recognized as a 360° image!

## Troubleshooting

### "Module not found" errors
- Make sure all dependencies are installed: `npm install`
- If using Node.js 18+, you may need to rebuild native modules: `npm rebuild`

### Processing fails
- Check that the uploaded file is a valid image
- Ensure the file size is under 50MB
- Check server logs for detailed error messages

### PWA not working
- PWA features are disabled in development mode
- Build for production: `npm run build && npm start`
- Access via HTTPS (required for service workers)

## Production Build

```bash
npm run build
npm start
```

## Deployment

See README.md for deployment instructions to Vercel or Firebase.

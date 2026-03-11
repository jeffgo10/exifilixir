import * as functions from 'firebase-functions';
import { exiftoolPath } from 'exiftool-vendored';
import sharp from 'sharp';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { platform } from 'os';

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const PANO_TAGS: Record<string, string> = {
  'XMP-GPano:ProjectionType': 'equirectangular',
  'XMP-GPano:UsePanoramaViewer': 'True',
  Make: 'Ricoh',
  Model: 'Theta S',
};

let cachedVendoredExiftoolPath: string | null = null;

/** Get path to vendored ExifTool script (for one-shot spawn). Cached after first call. */
async function getVendoredExiftoolPath(): Promise<string> {
  if (cachedVendoredExiftoolPath) return cachedVendoredExiftoolPath;
  cachedVendoredExiftoolPath = await exiftoolPath();
  return cachedVendoredExiftoolPath;
}

/** Run ExifTool as a one-shot subprocess (no stay_open daemon). Works in both emulator and production. */
async function exifToolWrite(filePath: string, tags: Record<string, string>, extraArgs: string[]): Promise<void> {
  const args = [...extraArgs];
  for (const [key, value] of Object.entries(tags)) {
    args.push(`-${key}=${value}`);
  }
  args.push(filePath);

  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

  if (isEmulator) {
    // Local: use system exiftool if on PATH (e.g. brew install exiftool).
    const result = spawnSync('exiftool', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    if (result.error) {
      if ((result.error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('ExifTool not found. Install it for local dev: brew install exiftool');
      }
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`ExifTool failed (${result.status}): ${result.stderr || result.stdout || 'unknown'}`);
    }
    return;
  }

  // Production: run vendored ExifTool script with perl (one-shot, no daemon).
  const scriptPath = await getVendoredExiftoolPath();
  const perl = platform() === 'win32' ? 'perl' : '/usr/bin/perl';
  const result = spawnSync(perl, [scriptPath, ...args], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, LANG: 'C' },
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`ExifTool failed (${result.status}): ${result.stderr || result.stdout || 'unknown'}`);
  }
}

// Validate API token
function validateToken(token: string | null): boolean {
  // Get the expected token from environment
  const expectedToken = process.env.API_TOKEN;
  
  // If no token is configured in the function, allow all requests
  // This allows deployment without token setup (you should set it for production)
  if (!expectedToken) {
    console.warn('API_TOKEN not set in Firebase Functions - allowing all requests');
    return true;
  }

  // If function has token configured, validate the request token
  if (!token) {
    return false;
  }

  // Compare tokens
  return token === expectedToken;
}

// Helper function to set CORS headers
function setCorsHeaders(res: any) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Token');
}

export const processImage = functions.https.onRequest({
  timeoutSeconds: 300, // 5 minutes (max for HTTP functions in Gen 2)
  memory: '1GiB', // Maximum memory for faster processing
  maxInstances: 10,
}, async (req: any, res: any) => {
  // Set CORS headers on all responses
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate API token
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || 
                req.headers['x-api-token'] as string ||
                (req.query.token as string) || null;
  
  if (!validateToken(token)) {
    // Ensure CORS headers are set on error response
    setCorsHeaders(res);
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API token' });
    return;
  }

  try {
    console.log('Request received, method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);
    
    // Firebase Functions Gen 2 may buffer the request body
    // Try using rawBody if available, otherwise read the stream
    let bodyBuffer: Buffer;
    
    if ((req as any).rawBody) {
      // Use rawBody if Firebase provides it (Gen 2 behavior)
      console.log('Using req.rawBody');
      bodyBuffer = Buffer.from((req as any).rawBody);
    } else {
      // Fallback: read the stream
      console.log('Reading request stream...');
      const chunks: Buffer[] = [];
      let totalSize = 0;
      
      bodyBuffer = await new Promise<Buffer>((resolve, reject) => {
        req.on('data', (chunk: Buffer) => {
          totalSize += chunk.length;
          if (totalSize > MAX_FILE_SIZE) {
            reject(new Error(`Request body exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`));
            return;
          }
          chunks.push(chunk);
        });
        
        req.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        
        req.on('error', (err: Error) => {
          reject(err);
        });
      });
    }
    
    console.log('Body buffer size:', bodyBuffer.length, 'bytes');
    
    // Parse multipart form data from buffer
    const busboy = require('busboy');
    
    // Convert headers to the format busboy expects (lowercase keys)
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers[key.toLowerCase()] = Array.isArray(value) ? value[0] : value;
      }
    }
    
    const bb = busboy({ 
      headers: headers,
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
      defParamCharset: 'utf8'
    });
    
    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let fileType = '';
    let processingError: Error | null = null;

    // Handle busboy errors
    bb.on('error', (err: Error) => {
      console.error('Busboy error:', err);
      processingError = err;
      if (!res.headersSent) {
        setCorsHeaders(res);
        res.status(400).json({ error: `Failed to parse form data: ${err.message}` });
      }
    });

    bb.on('file', (name: string, file: any, info: any) => {
      const { filename, mimeType } = info;
      fileName = filename;
      fileType = mimeType;

      if (!mimeType || !mimeType.startsWith('image/')) {
        processingError = new Error('File must be an image');
        file.resume(); // Drain the file stream
        return;
      }

      const chunks: Buffer[] = [];
      let fileSize = 0;

      file.on('data', (data: Buffer) => {
        fileSize += data.length;
        if (fileSize > MAX_FILE_SIZE) {
          processingError = new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
          file.resume(); // Drain the file stream
          return;
        }
        chunks.push(data);
      });

      file.on('end', () => {
        if (!processingError) {
          fileBuffer = Buffer.concat(chunks);
          console.log('File received:', fileBuffer.length, 'bytes');
        }
      });

      file.on('error', (err: Error) => {
        console.error('File stream error:', err);
        processingError = err;
      });
    });

    // Process the form data
    // Set a timeout to detect if processing takes too long
    const processingTimeout = setTimeout(() => {
      console.error('Processing timeout - taking longer than expected');
      if (!res.headersSent) {
        setCorsHeaders(res);
        res.status(504).json({ error: 'Processing timeout - image may be too large or complex' });
      }
    }, 290000); // 290 seconds (leave 10s buffer before function timeout of 300s)
    
    await new Promise<void>((resolve, reject) => {
      bb.on('finish', async () => {
        clearTimeout(processingTimeout);
        console.log('Form parsing finished. File buffer:', fileBuffer ? `${fileBuffer.length} bytes` : 'null', 'File name:', fileName);
        
        if (processingError) {
          if (!res.headersSent) {
            setCorsHeaders(res);
            res.status(400).json({ error: processingError.message });
          }
          reject(processingError);
          return;
        }
        if (!fileBuffer || !fileName) {
          if (!res.headersSent) {
            setCorsHeaders(res);
            res.status(400).json({ 
              error: 'No file provided',
              debug: {
                hasBuffer: !!fileBuffer,
                hasFileName: !!fileName,
                bufferSize: fileBuffer?.length || 0
              }
            });
          }
          reject(new Error('No file provided'));
          return;
        }

        // Create temp directory
        const tempDir = join(tmpdir(), 'exifilixir');
        if (!existsSync(tempDir)) {
          await mkdir(tempDir, { recursive: true });
        }

        // Generate unique filenames with proper extension
        const timestamp = Date.now();
        const fileExtension = fileName.split('.').pop() || 'jpg';
        const outputPath = join(tempDir, `output-${timestamp}.${fileExtension}`);

        try {
          console.log('Starting image processing...');
          const startTime = Date.now();
          
          // Process directly from buffer - avoid file I/O overhead
          const image = sharp(fileBuffer, {
            failOnError: false,
          });
          
          const metadata = await image.metadata();
          console.log('Metadata read in', Date.now() - startTime, 'ms');

          if (!metadata.width) {
            throw new Error('Could not read image width');
          }

          const targetHeight = Math.round(metadata.width / 2);
          let processedBuffer: Buffer;

          if (metadata.height !== targetHeight) {
            console.log('Resizing from', metadata.width, 'x', metadata.height, 'to', metadata.width, 'x', targetHeight);
            const resizeStart = Date.now();
            
            // Optimize for speed: faster kernel, lower quality, no progressive
            processedBuffer = await image
              .resize({
                width: metadata.width,
                height: targetHeight,
                fit: 'fill',
                kernel: sharp.kernel.lanczos3, // Faster than lanczos2
                withoutEnlargement: false,
              })
              .jpeg({ 
                quality: 88, // Lower quality for speed (still acceptable)
                mozjpeg: true, // Faster encoding
                progressive: false, // Disable for speed
              })
              .toBuffer();
              
            console.log('Resize completed in', Date.now() - resizeStart, 'ms');
          } else {
            console.log('Aspect ratio already correct');
            processedBuffer = fileBuffer;
          }

          // Save to temp file only for ExifTool (it requires a file)
          // Cloud Functions use ephemeral storage which is slower than local SSDs
          console.log('Writing temp file for ExifTool (', processedBuffer.length, 'bytes)...');
          const writeStart = Date.now();
          await writeFile(outputPath, processedBuffer);
          console.log('Temp file written in', Date.now() - writeStart, 'ms');

          // 2. Inject XMP Metadata using ExifTool (optimized for cloud performance)
          console.log('Injecting EXIF metadata...');
          const exifStart = Date.now();
          await exifToolWrite(outputPath, PANO_TAGS, ['-overwrite_original', '-q', '-fast2']);
          console.log('EXIF metadata injected in', Date.now() - exifStart, 'ms');
          console.log('Total processing time:', Date.now() - startTime, 'ms');

          // Read the processed file
          const processedFile = await import('fs').then((fs) =>
            fs.promises.readFile(outputPath)
          );

          // Cleanup temp files (async, don't wait for completion)
          unlink(outputPath).catch(() => {});

          // Determine content type based on file extension
          const contentType = fileType || `image/${fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'jpeg' : fileExtension}`;

          // Return the processed image
          console.log('Sending response...');
          res.set('Content-Type', contentType);
          res.set('Content-Disposition', `attachment; filename="fixed-${fileName}"`);
          res.send(processedFile);
          console.log('Response sent successfully');
          resolve();
        } catch (error: any) {
          // Cleanup on error (async)
          unlink(outputPath).catch(() => {});

          console.error('Error processing image:', error);
          if (!res.headersSent) {
            setCorsHeaders(res);
            res.status(500).json({
              error: error.message || 'Failed to process image',
            });
          }
          reject(error);
        }
      });

      bb.on('error', (err: Error) => {
        console.error('Busboy stream error:', err);
        reject(err);
      });

      // Write the buffer directly to busboy (Firebase may have already buffered)
      const { Readable } = require('stream');
      const bodyStream = Readable.from(bodyBuffer);
      bodyStream.pipe(bb);
    });

  } catch (error: any) {
    console.error('Error processing request:', error);
    if (!res.headersSent) {
      setCorsHeaders(res);
      res.status(500).json({
        error: error.message || 'Failed to process request',
      });
    }
  }
});

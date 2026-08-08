/**
 * Generates PWA icons and OG image from public/exifilixir-icon.svg
 * Requires ImageMagick (`convert`) — available on macOS via `brew install imagemagick`
 * Run: npm run assets:generate
 */
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconSvg = join(publicDir, 'exifilixir-icon.svg');

if (!existsSync(iconSvg)) {
  console.error('Missing', iconSvg);
  process.exit(1);
}

function convert(args) {
  execFileSync('convert', args, { stdio: 'inherit' });
}

for (const size of [192, 512]) {
  const out = join(publicDir, `icon-${size}x${size}.png`);
  convert(['-background', 'none', iconSvg, '-resize', `${size}x${size}`, out]);
  console.log('Wrote', `icon-${size}x${size}.png`);
}

convert(['-background', 'none', iconSvg, '-resize', '32x32', join(publicDir, 'favicon.png')]);
console.log('Wrote favicon.png');

// OG card: gradient background + icon + title (built as layered SVG then rasterized)
const ogSvg = join(publicDir, 'og-image.svg');
const ogPng = join(publicDir, 'og-image.png');

// Rasterize OG SVG at 2x for crisp text, then resize to 1200x630 if needed
convert([ogSvg, '-resize', '1200x630!', ogPng]);
console.log('Wrote og-image.png');

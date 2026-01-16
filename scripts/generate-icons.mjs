import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');
const logoPath = path.join(publicDir, 'logo.png');

// Sizes for PWA icons
const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons from logo.png...\n');

  for (const { size, name } of sizes) {
    const outputPath = path.join(publicDir, name);

    try {
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`✓ Generated ${name} (${size}x${size}) - ${(stats.size / 1024).toFixed(2)}KB`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate favicon.ico (using 32x32)
  try {
    const faviconPath = path.join(publicDir, 'favicon.ico');
    await sharp(logoPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(faviconPath);

    const stats = fs.statSync(faviconPath);
    console.log(`✓ Generated favicon.ico (32x32) - ${(stats.size / 1024).toFixed(2)}KB`);
  } catch (error) {
    console.error('✗ Failed to generate favicon.ico:', error.message);
  }

  console.log('\n✨ All icons generated successfully!');
}

generateIcons().catch(console.error);

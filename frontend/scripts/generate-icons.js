const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');
const screenshotsDir = path.join(publicDir, 'screenshots');

// Ensure directories exist
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const svgPath = path.join(iconsDir, 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generateImages() {
  console.log('Generating PNG images from SVG...\n');

  // Generate icon-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512.png'));
  console.log('✓ icons/icon-512x512.png (512x512)');

  // Generate splash-200x200.png (required: exactly 200x200)
  await sharp(svgBuffer)
    .resize(200, 200)
    .png()
    .toFile(path.join(iconsDir, 'splash-200x200.png'));
  console.log('✓ icons/splash-200x200.png (200x200)');

  // Generate icon-192x192.png (for PWA)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192x192.png'));
  console.log('✓ icons/icon-192x192.png (192x192)');

  // Generate apple-touch-icon.png
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ icons/apple-touch-icon.png (180x180)');

  // Generate og-image.png (3:2 ratio = 1200x800)
  const ogImage = await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 4,
      background: { r: 10, g: 11, b: 13, alpha: 1 } // #0A0B0D
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(300, 300).png().toBuffer(),
        top: 250,
        left: 450
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('✓ og-image.png (1200x800 - 3:2 ratio)');

  // Generate hero-image.png (1200x630)
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 10, g: 11, b: 13, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(svgBuffer).resize(250, 250).png().toBuffer(),
        top: 190,
        left: 475
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'hero-image.png'));
  console.log('✓ hero-image.png (1200x630)');

  // Generate placeholder screenshots (424x695 - mini app dimensions)
  const screenshotBg = { r: 10, g: 11, b: 13, alpha: 1 };

  for (const name of ['dashboard', 'create', 'transaction']) {
    await sharp({
      create: {
        width: 424,
        height: 695,
        channels: 4,
        background: screenshotBg
      }
    })
      .composite([
        {
          input: await sharp(svgBuffer).resize(150, 150).png().toBuffer(),
          top: 270,
          left: 137
        }
      ])
      .png()
      .toFile(path.join(screenshotsDir, `${name}.png`));
    console.log(`✓ screenshots/${name}.png (424x695)`);
  }

  console.log('\n✅ All images generated successfully!');
  console.log('\nNote: These are placeholder images. Replace with actual screenshots for production.');
}

generateImages().catch(console.error);

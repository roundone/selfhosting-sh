#!/usr/bin/env node
/**
 * Generate PNG brand assets from SVG sources using sharp
 * Run from: /opt/selfhosting-sh
 */

const sharp = require('/opt/selfhosting-sh/site/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const BRAND_DIR = '/opt/selfhosting-sh/site/public/branding';
const PUBLIC_DIR = '/opt/selfhosting-sh/site/public';

async function generate() {
  console.log('Generating brand PNG assets...');

  // Logo/avatar: 400x400, 200x200
  const logoSvg = fs.readFileSync(path.join(BRAND_DIR, 'logo.svg'));
  await sharp(logoSvg)
    .resize(400, 400)
    .png()
    .toFile(path.join(BRAND_DIR, 'logo-400.png'));
  console.log('  logo-400.png');

  await sharp(logoSvg)
    .resize(200, 200)
    .png()
    .toFile(path.join(BRAND_DIR, 'logo-200.png'));
  console.log('  logo-200.png');

  await sharp(logoSvg)
    .resize(800, 800)
    .png()
    .toFile(path.join(BRAND_DIR, 'logo-800.png'));
  console.log('  logo-800.png');

  // Social header: 1500x500
  const headerSvg = fs.readFileSync(path.join(BRAND_DIR, 'header.svg'));
  await sharp(headerSvg)
    .resize(1500, 500)
    .png()
    .toFile(path.join(BRAND_DIR, 'header-1500x500.png'));
  console.log('  header-1500x500.png');

  // Favicons: 32x32 and 180x180 (Apple touch icon)
  const faviconSvg = fs.readFileSync(path.join(BRAND_DIR, 'favicon.svg'));
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
  console.log('  favicon-32x32.png');

  await sharp(faviconSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('  apple-touch-icon.png');

  await sharp(faviconSvg)
    .resize(192, 192)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
  console.log('  icon-192.png');

  // Also copy favicon.svg to public for modern browsers
  fs.copyFileSync(
    path.join(BRAND_DIR, 'favicon.svg'),
    path.join(PUBLIC_DIR, 'favicon.svg')
  );
  console.log('  favicon.svg (copied to public/)');

  console.log('Done! Assets in:');
  console.log('  ' + BRAND_DIR + '/');
  console.log('  ' + PUBLIC_DIR + '/');
}

generate().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const edge = '"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"';
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const svgPath = path.join(iconsDir, 'icon.svg');
const maskableSvgPath = path.join(iconsDir, 'icon-maskable.svg');

function createHtml(svgFile, size) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:${size}px; height:${size}px; overflow:hidden; background:transparent; display:flex; align-items:center; justify-content:center; }
  img { width:${size}px; height:${size}px; display:block; }
</style>
</head>
<body>
  <img src="file:///${svgFile.replace(/\\/g, '/')}" width="${size}" height="${size}" />
</body>
</html>`;
}

const html512 = createHtml(svgPath, 512);
const html192 = createHtml(svgPath, 192);
const htmlMask512 = createHtml(maskableSvgPath, 512);
const htmlMask192 = createHtml(maskableSvgPath, 192);

fs.writeFileSync(path.join(iconsDir, 'temp512.html'), html512, 'utf8');
fs.writeFileSync(path.join(iconsDir, 'temp192.html'), html192, 'utf8');
fs.writeFileSync(path.join(iconsDir, 'tempMask512.html'), htmlMask512, 'utf8');
fs.writeFileSync(path.join(iconsDir, 'tempMask192.html'), htmlMask192, 'utf8');

try {
  console.log('Rendering 512x512 icon...');
  execSync(`${edge} --headless --disable-gpu --hide-scrollbars --window-size=512,512 --screenshot="${path.join(iconsDir, 'icon-512.png')}" "file:///${path.join(iconsDir, 'temp512.html').replace(/\\/g, '/')}"`);
  
  console.log('Rendering 192x192 icon...');
  execSync(`${edge} --headless --disable-gpu --hide-scrollbars --window-size=192,192 --screenshot="${path.join(iconsDir, 'icon-192.png')}" "file:///${path.join(iconsDir, 'temp192.html').replace(/\\/g, '/')}"`);
  
  console.log('Rendering Maskable 512x512 icon...');
  execSync(`${edge} --headless --disable-gpu --hide-scrollbars --window-size=512,512 --screenshot="${path.join(iconsDir, 'icon-maskable-512.png')}" "file:///${path.join(iconsDir, 'tempMask512.html').replace(/\\/g, '/')}"`);
  
  console.log('Rendering Maskable 192x192 icon...');
  execSync(`${edge} --headless --disable-gpu --hide-scrollbars --window-size=192,192 --screenshot="${path.join(iconsDir, 'icon-maskable-192.png')}" "file:///${path.join(iconsDir, 'tempMask192.html').replace(/\\/g, '/')}"`);

  // Cleanup
  fs.unlinkSync(path.join(iconsDir, 'temp512.html'));
  fs.unlinkSync(path.join(iconsDir, 'temp192.html'));
  fs.unlinkSync(path.join(iconsDir, 'tempMask512.html'));
  fs.unlinkSync(path.join(iconsDir, 'tempMask192.html'));

  console.log('All PWA PNG icons rendered successfully!');
} catch (e) {
  console.error('Render error:', e);
}

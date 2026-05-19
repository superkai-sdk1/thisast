/**
 * Generates icon-192.png and icon-512.png from icon.svg.
 * Run once after build: node scripts/generate-icons.mjs
 * Requires: npm install -g sharp  OR  pnpm add -D sharp
 */
import { createCanvas } from 'canvas';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/icons');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.222; // ~114/512 ratio for rounded rect

  // Background — iOS blue
  ctx.fillStyle = '#007AFF';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Letter
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(size * 0.547)}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Э', size / 2, size * 0.54);

  return canvas.toBuffer('image/png');
}

for (const size of [192, 512]) {
  const buf = generateIcon(size);
  writeFileSync(join(outDir, `icon-${size}.png`), buf);
  console.log(`✓ icon-${size}.png`);
}

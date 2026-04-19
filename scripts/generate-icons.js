/**
 * generate-icons.js
 * Generates icon-192.png and icon-512.png for the HealthLens PWA.
 * Uses only Node.js built-ins (zlib + Buffer) — no native canvas dep required.
 *
 * Design: teal (#0D9488) background, white "HL" text centered.
 * "HL" is rendered as simple pixel patterns via an embedded micro-font.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------------------------------------------------------------------------
// Minimal PNG encoder (RGBA, 8-bit, truecolour-alpha)
// ---------------------------------------------------------------------------
function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function encodePNG(width, height, pixels) {
  // pixels: Uint8Array of length width*height*4 (RGBA)
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: truecolour (RGB, no alpha needed but using 2)
  // Use colour type 6 (RGBA) for full support
  ihdr[9] = 6;
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Build raw scanlines with filter byte 0 (None)
  const stride = width * 4;
  const raw = Buffer.alloc((1 + stride) * height);
  for (let y = 0; y < height; y++) {
    raw[(1 + stride) * y] = 0; // filter type None
    pixels.copy(raw, (1 + stride) * y + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([PNG_SIG, chunk('IHDR', ihdr), idat, iend]);
}

// ---------------------------------------------------------------------------
// Simple pixel-font glyphs for "H" and "L" (5 wide × 7 tall bitmap)
// ---------------------------------------------------------------------------
const GLYPHS = {
  H: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  L: [
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
};

// ---------------------------------------------------------------------------
// Draw icon at given size
// ---------------------------------------------------------------------------
function generateIconPixels(size) {
  // Teal background: #0D9488 → (13, 148, 136)
  const [bgR, bgG, bgB] = [13, 148, 136];
  const pixels = Buffer.alloc(size * size * 4);

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4 + 0] = bgR;
    pixels[i * 4 + 1] = bgG;
    pixels[i * 4 + 2] = bgB;
    pixels[i * 4 + 3] = 255;
  }

  // Letter scale: each pixel of the glyph maps to `scale` screen pixels
  const scale = Math.floor(size / 16);
  const glyphW = 5 * scale;
  const glyphH = 7 * scale;
  const gap = scale; // gap between H and L

  const totalW = glyphW * 2 + gap;
  const startX = Math.floor((size - totalW) / 2);
  const startY = Math.floor((size - glyphH) / 2);

  function drawGlyph(glyph, offsetX) {
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (!glyph[row][col]) continue;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const px = offsetX + col * scale + dx;
            const py = startY + row * scale + dy;
            if (px < 0 || px >= size || py < 0 || py >= size) continue;
            const idx = (py * size + px) * 4;
            pixels[idx + 0] = 255; // white
            pixels[idx + 1] = 255;
            pixels[idx + 2] = 255;
            pixels[idx + 3] = 255;
          }
        }
      }
    }
  }

  drawGlyph(GLYPHS.H, startX);
  drawGlyph(GLYPHS.L, startX + glyphW + gap);

  return pixels;
}

// ---------------------------------------------------------------------------
// Write both icons
// ---------------------------------------------------------------------------
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [192, 512]) {
  const pixels = generateIconPixels(size);
  const png = encodePNG(size, size, pixels);
  const outPath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`✓ Generated ${outPath} (${png.length} bytes)`);
}

console.log('Done.');

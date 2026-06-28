/**
 * generate-icons.mjs
 *
 * Converts public/icon.svg → all PWA + browser icon sizes.
 *
 * Run: node scripts/generate-icons.mjs
 * Requires: pnpm add -D sharp  (already done)
 *
 * Outputs (all in public/):
 *   icon-512.png          — PWA 512×512
 *   icon-192.png          — PWA 192×192
 *   icon-maskable-512.png — Maskable PWA 512×512 (full-bleed square bg)
 *   icon-maskable-192.png — Maskable PWA 192×192
 *   apple-touch-icon.png  — Apple home screen 180×180
 *   favicon-32.png        — Browser tab fallback 32×32
 *   favicon-16.png        — Tiny browser favicon 16×16
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, "..");
const pub   = resolve(root, "public");

const svgPath = resolve(pub, "icon.svg");
const svgBuf  = readFileSync(svgPath);

// ── Rounded-square (non-maskable) sizes ──────────────────────────────────────
// sharp renders the SVG exactly as-is (transparent outside the rx=112 rounded rect)
const regularSizes = [
  { out: "icon-512.png",         size: 512 },
  { out: "icon-192.png",         size: 192 },
  { out: "apple-touch-icon.png", size: 180 },
  { out: "favicon-32.png",       size: 32  },
  { out: "favicon-16.png",       size: 16  },
];

// ── Maskable sizes ────────────────────────────────────────────────────────────
// Maskable icons must be full-bleed square (no transparent corners).
// We composite the icon onto a solid #0891B2 (cyan-600) background square.
const maskableSizes = [
  { out: "icon-maskable-512.png", size: 512 },
  { out: "icon-maskable-192.png", size: 192 },
];

async function generate() {
  console.log("Generating PWA icons from public/icon.svg …\n");

  // Regular (transparent bg, rounded square)
  for (const { out, size } of regularSizes) {
    await sharp(svgBuf)
      .resize(size, size)
      .png({ compressionLevel: 9, quality: 100 })
      .toFile(resolve(pub, out));
    console.log(`  ✓  ${out.padEnd(28)} ${size}×${size}`);
  }

  // Maskable (solid bg, full-bleed)
  for (const { out, size } of maskableSizes) {
    // 1. Render the SVG to PNG at target size
    const iconPng = await sharp(svgBuf)
      .resize(size, size)
      .png()
      .toBuffer();

    // 2. Create a solid cyan-600 background
    const bg = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 8, g: 145, b: 178, alpha: 1 }, // #0891B2
      },
    })
      .png()
      .toBuffer();

    // 3. Composite icon over background
    await sharp(bg)
      .composite([{ input: iconPng, blend: "over" }])
      .png({ compressionLevel: 9, quality: 100 })
      .toFile(resolve(pub, out));

    console.log(`  ✓  ${out.padEnd(28)} ${size}×${size}  (maskable)`);
  }

  // ── favicon.svg ── copy icon.svg as favicon.svg (modern browsers prefer SVG)
  const svgSrc = readFileSync(svgPath);
  writeFileSync(resolve(pub, "favicon.svg"), svgSrc);
  console.log("  ✓  favicon.svg                    (copied from icon.svg)");

  console.log("\nDone. All icons written to public/");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});

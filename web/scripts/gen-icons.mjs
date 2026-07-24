// Generates PWA PNG icons from public/icon-source.svg.
// Run: node scripts/gen-icons.mjs (from web/)
import sharp from "sharp";
import { readFileSync } from "node:fs";

const svg = readFileSync("public/icon-source.svg");
const out = [
  ["public/icon-512.png", 512],
  ["public/icon-192.png", 192],
  ["public/apple-touch-icon.png", 180],
];
for (const [f, s] of out) {
  await sharp(svg).resize(s, s).png().toFile(f);
}

// maskable: content inset to ~80% centered on a full-bleed brand background.
// flatten() first to fill the source rect's rounded-corner transparency with
// the brand color, so the final canvas is fully opaque (required for maskable).
await sharp(svg)
  .resize(410, 410)
  .flatten({ background: "#2563eb" })
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: "#2563eb" })
  .png()
  .toFile("public/icon-512-maskable.png");

console.log("done");

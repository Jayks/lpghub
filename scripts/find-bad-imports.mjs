/**
 * find-bad-imports.mjs
 * Scans for import statements that appear AFTER module-level code.
 * This pattern causes Turbopack worker crashes.
 *
 * Usage: node scripts/find-bad-imports.mjs
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"]);
const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", "drizzle"]);

let violations = 0;

function scan(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.has(entry)) scan(full);
      continue;
    }
    if (!EXTENSIONS.has(extname(entry))) continue;

    const src = readFileSync(full, "utf8");
    const lines = src.split("\n");

    let seenNonImport = false;
    let firstNonImportLine = -1;
    let inMultiLineImport = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip blank lines, comments, and "use client"/"use server" directives
      if (!line || line.startsWith("//") || line.startsWith("*") || line.startsWith("/*")) continue;
      if (/^["']use (client|server)["'];?$/.test(line)) continue;

      // Track multi-line imports: "import {" without closing "}" on same line
      if (inMultiLineImport) {
        if (line.includes("}")) inMultiLineImport = false;
        continue; // everything inside a multi-line import is skipped
      }

      const isImport = line.startsWith("import ");
      if (isImport && line.includes("{") && !line.includes("}")) {
        // Opening of a multi-line import block
        inMultiLineImport = true;
      }

      if (!isImport && !seenNonImport) {
        seenNonImport = true;
        firstNonImportLine = i + 1;
      }
      if (isImport && seenNonImport) {
        console.error(`\n❌ Bad import in ${full}:${i + 1}`);
        console.error(`   Import appears after module-level code (line ${firstNonImportLine})`);
        console.error(`   > ${lines[i]}`);
        violations++;
      }
    }
  }
}

scan(process.cwd());

if (violations === 0) {
  console.log("✅ No bad import ordering found.");
} else {
  console.error(`\n${violations} violation(s) found. Move all imports to the top of the file.`);
  process.exit(1);
}

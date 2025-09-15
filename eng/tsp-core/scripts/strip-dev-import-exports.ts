#!/usr/bin/env node
import fs from "fs";
import path from "path";

// Resolve the path to your package.json
const pkgPath = path.resolve(process.cwd(), "./package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

// Recursively remove "development" keys from exports
function removeDevExports(exportsField: any) {
  if (exportsField && typeof exportsField === "object") {
    if ("development" in exportsField) {
      delete exportsField.development;
    }
    // Recursively handle nested export objects
    for (const key of Object.keys(exportsField)) {
      removeDevExports(exportsField[key]);
    }
  }
}

if (pkg.exports) {
  removeDevExports(pkg.exports);
}

if (pkg.imports) {
  removeDevExports(pkg.imports);
}

// Write the modified package.json back
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log("Stripped development exports from package.json.");

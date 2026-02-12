#!/usr/bin/env node
import fs from "fs";
import path from "path";

// Resolve the path to your package.json
const pkgPath = path.resolve(process.cwd(), "./package.json");
const backupPath = pkgPath + ".bak";

function cleanup() {
  const originalText = fs.readFileSync(pkgPath, "utf8");
  fs.writeFileSync(backupPath, originalText);

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
}

function restore() {
  if (fs.existsSync(backupPath)) {
    const backupText = fs.readFileSync(backupPath, "utf8");
    fs.writeFileSync(pkgPath, backupText, "utf8");
    fs.rmSync(backupPath);
    console.log("Restored original package.json from backup.");
  }
}

if (process.argv.includes("--restore")) {
  restore();
} else {
  cleanup();
}

import * as fs from "fs";
import * as path from "path";

const sourceDir = path.join("node_modules", "@typespec", "spec-dashboard", "dist");
const destDir = path.join("dist", "spector");

// Ensure the destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy assets directory
const sourceAssetsDir = path.join(sourceDir, "assets");
const destAssetsDir = path.join(destDir, "assets");

function copyDirectory(source: string, destination: string) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

copyDirectory(sourceAssetsDir, destAssetsDir);

// Copy and rename index.html to dashboard.html
const sourceHtmlFile = path.join(sourceDir, "index.html");
const destHtmlFile = path.join(destDir, "dashboard.html");
fs.copyFileSync(sourceHtmlFile, destHtmlFile);

console.log("Files copied successfully.");

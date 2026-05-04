import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, relative } from "path";
import { parse } from "yaml";
import { repoRoot } from "./utils/common.js";

/**
 * Validates that all workspace package dependencies use `catalog:` or `workspace:` protocols,
 * ensuring versions are centrally managed via the pnpm catalog in pnpm-workspace.yaml.
 */

interface WorkspaceConfig {
  catalog?: Record<string, string>;
}

const workspaceConfig: WorkspaceConfig = parse(
  readFileSync(join(repoRoot, "pnpm-workspace.yaml"), "utf8"),
);
const catalog = workspaceConfig.catalog ?? {};

/**
 * Dependencies that are allowed to use explicit versions instead of catalog:.
 * Each entry maps a package.json path (relative to repo root) to a set of dependency names.
 */
const exceptions: Record<string, Set<string>> = {
  // vsce needs a real semver for @types/vscode to determine VS Code engine compatibility
  "packages/typespec-vscode/package.json": new Set(["@types/vscode"]),
};

const depTypes = ["dependencies", "devDependencies", "peerDependencies"] as const;

const errors: string[] = [];
const warnings: string[] = [];

// Resolve workspace packages from pnpm
const pnpmOutput = execSync("pnpm ls -r --json --depth -1", {
  cwd: repoRoot,
  encoding: "utf8",
});
const workspacePackages: { path: string }[] = JSON.parse(pnpmOutput);
const packageJsonPaths: string[] = workspacePackages.map((p) =>
  join(relative(repoRoot, p.path), "package.json"),
);

for (const relPath of packageJsonPaths) {
  const fullPath = join(repoRoot, relPath);
  const pkg = JSON.parse(readFileSync(fullPath, "utf8"));
  const fileExceptions = exceptions[relPath] ?? new Set();

  for (const depType of depTypes) {
    const deps: Record<string, string> | undefined = pkg[depType];
    if (!deps) continue;

    for (const [name, version] of Object.entries(deps)) {
      if (version === "catalog:" || version.startsWith("workspace:")) {
        continue;
      }
      if (fileExceptions.has(name)) {
        // Allowed exception — but warn if it drifts from the catalog
        if (catalog[name] && catalog[name] !== version) {
          warnings.push(
            `${relPath}: ${depType}.${name} has version "${version}" but catalog has "${catalog[name]}". Keep them in sync.`,
          );
        }
        continue;
      }
      errors.push(
        `${relPath}: ${depType}.${name} uses explicit version "${version}" instead of "catalog:".`,
      );
    }
  }
}

// Check that every catalog entry is actually used somewhere
const usedCatalogEntries = new Set<string>();
for (const relPath of packageJsonPaths) {
  const fullPath = join(repoRoot, relPath);
  const pkg = JSON.parse(readFileSync(fullPath, "utf8"));
  for (const depType of depTypes) {
    const deps: Record<string, string> | undefined = pkg[depType];
    if (!deps) continue;
    for (const [name, version] of Object.entries(deps)) {
      if (version === "catalog:") {
        usedCatalogEntries.add(name);
      }
    }
  }
}

for (const name of Object.keys(catalog)) {
  if (!usedCatalogEntries.has(name)) {
    warnings.push(`pnpm-workspace.yaml: catalog entry "${name}" is not used by any package.`);
  }
}

// Report results
if (warnings.length > 0) {
  console.log(`\n⚠ Warnings (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`  ${w}`);
  }
}

if (errors.length > 0) {
  console.log(`\n✘ Errors (${errors.length}):`);
  for (const e of errors) {
    console.log(`  ${e}`);
  }
  console.log(
    '\nAll external dependencies must use "catalog:" protocol. Add the version to the catalog in pnpm-workspace.yaml and use "catalog:" in package.json.',
  );
  process.exit(1);
}

console.log("✔ All dependencies are using catalog: or workspace: protocols.");

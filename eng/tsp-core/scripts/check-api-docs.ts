#!/usr/bin/env tsx
/* eslint-disable no-console */
// Enforces that the public API of a package is documented, replacing the
// `ae-undocumented` check previously provided by `@microsoft/api-extractor`.
//
// Unlike api-extractor (which only supported a single entry point), this uses
// TypeDoc and validates every *stable* public entry point declared in the
// package `exports` map. Experimental and testing entry points are excluded.
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { Application, LogLevel } from "typedoc";
import { fileURLToPath } from "url";

/** Entry point path segments that are not subject to documentation enforcement. */
const EXCLUDED_ENTRYPOINT_SEGMENTS = ["experimental", "testing", "internal"];

/** Reflection kinds that must be documented when part of the public API. */
// Reflection kinds that must be documented when part of the public API. This
// list mirrors the effective surface of api-extractor's `ae-undocumented` check:
// packages that previously enforced it report zero findings here. `Property`,
// `Variable` and `EnumMember` are intentionally omitted so the check does not
// descend into object-literal internals (e.g. the diagnostic messages defined
// on a library's `$lib` const), which api-extractor never enforced.
const REQUIRED_TO_BE_DOCUMENTED = [
  "Interface",
  "Function",
  "Class",
  "Method",
  "Enum",
  "TypeAlias",
  "Accessor",
];

interface PackageJson {
  name?: string;
  exports?: Record<string, unknown>;
}

function resolveTypesPath(entry: unknown): string | undefined {
  if (typeof entry === "string") {
    return entry.replace(/\.js$/, ".d.ts");
  }
  if (entry && typeof entry === "object") {
    const obj = entry as Record<string, unknown>;
    if (typeof obj.types === "string") {
      return obj.types;
    }
    for (const condition of ["import", "default"]) {
      const resolved = resolveTypesPath(obj[condition]);
      if (resolved) {
        return resolved;
      }
    }
  }
  return undefined;
}

function isExcluded(exportKey: string): boolean {
  const segments = exportKey.split("/");
  return segments.some((segment) => EXCLUDED_ENTRYPOINT_SEGMENTS.includes(segment));
}

/** Resolve the stable public source entry points from the package `exports` map. */
function resolveEntryPoints(packageDir: string, pkgJson: PackageJson): string[] {
  const exports = pkgJson.exports;
  if (!exports) {
    // Fall back to the conventional main entry point.
    const fallback = join(packageDir, "src", "index.ts");
    return existsSync(fallback) ? [fallback] : [];
  }

  const entryPoints = new Set<string>();
  for (const [key, value] of Object.entries(exports)) {
    if (isExcluded(key)) {
      continue;
    }
    const typesPath = resolveTypesPath(value);
    if (!typesPath) {
      continue;
    }
    // e.g. ./dist/src/index.d.ts -> src/index.ts
    const sourceRelative = typesPath.replace(/^\.\/dist\//, "./").replace(/\.d\.ts$/, ".ts");
    const sourcePath = resolve(packageDir, sourceRelative);
    if (existsSync(sourcePath)) {
      entryPoints.add(sourcePath);
    }
  }
  return [...entryPoints];
}

async function main() {
  const packageDir = resolve(process.cwd(), process.argv[2] ?? ".");
  const pkgJsonPath = join(packageDir, "package.json");
  if (!existsSync(pkgJsonPath)) {
    console.error(`No package.json found at ${pkgJsonPath}`);
    process.exit(1);
  }
  const pkgJson: PackageJson = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
  const entryPoints = resolveEntryPoints(packageDir, pkgJson);
  if (entryPoints.length === 0) {
    console.error(`No public entry points found for ${pkgJson.name ?? packageDir}`);
    process.exit(1);
  }

  const app = await Application.bootstrapWithPlugins({
    entryPoints,
    entryPointStrategy: "resolve",
    tsconfig: join(packageDir, "tsconfig.build.json"),
    excludeInternal: true,
    readme: "none",
    logLevel: LogLevel.Error,
    requiredToBeDocumented: REQUIRED_TO_BE_DOCUMENTED as never,
    validation: {
      notDocumented: true,
      invalidLink: false,
      notExported: false,
      rewrittenLink: false,
      unusedMergeModuleWith: false,
    },
  });

  // With `notExported`/`invalidLink` disabled, the only validation warnings are
  // the "does not have any documentation" ones, so capturing them here isolates
  // undocumented public API from unrelated TypeDoc noise.
  const undocumented: string[] = [];
  const originalValidationWarning = app.logger.validationWarning.bind(app.logger);
  app.logger.validationWarning = ((text: string, ...rest: unknown[]) => {
    undocumented.push(String(text));
    return (originalValidationWarning as (...args: unknown[]) => void)(text, ...rest);
  }) as typeof app.logger.validationWarning;

  const project = await app.convert();
  if (!project) {
    console.error("TypeDoc failed to analyze the package (see errors above).");
    process.exit(1);
  }
  app.validate(project);

  if (undocumented.length > 0) {
    console.error(
      `\n${undocumented.length} public API symbol(s) in ${pkgJson.name ?? packageDir} are missing documentation:\n`,
    );
    for (const message of undocumented) {
      console.error(`  - ${message}`);
    }
    console.error("");
    process.exit(1);
  }

  console.log(
    `✔ All public API of ${pkgJson.name ?? packageDir} is documented (${entryPoints.length} entry point(s)).`,
  );
}

// Allow running directly via tsx.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Application, ReflectionKind } from "typedoc";

const app = await Application.bootstrapWithPlugins({
  tsconfig: resolve("tsconfig.build.json"),
  excludeInternal: true,
  excludeExternals: true,
  disableSources: true,
  validation: {
    notDocumented: true,
    invalidLink: false,
    invalidPath: false,
    notExported: false,
    rewrittenLink: false,
    unusedMergeModuleWith: false,
  },
});

const isPublicEntryPoint = (name: string) =>
  !name
    .split("/")
    .some((part) => ["experimental", "testing", "internal", "internals"].includes(part));
const entryPoints = app.getEntryPoints()?.filter((entry) => isPublicEntryPoint(entry.displayName));
if (!entryPoints?.length || app.logger.hasErrors()) {
  throw new Error(`TypeDoc could not resolve public entry points in ${process.cwd()}.`);
}

const pkg: { name: string; exports?: Record<string, unknown> } = JSON.parse(
  await readFile("package.json", "utf8"),
);
const hasJsTarget = (value: unknown): boolean =>
  typeof value === "string"
    ? /\.[cm]?[jt]s$/.test(value)
    : value !== null && typeof value === "object" && Object.values(value).some(hasJsTarget);
for (const [name, target] of Object.entries(pkg.exports ?? {})) {
  const displayName = name === "." ? "" : name.slice(2);
  if (
    isPublicEntryPoint(displayName) &&
    hasJsTarget(target) &&
    !entryPoints.some((entry) => entry.displayName === displayName)
  ) {
    throw new Error(`TypeDoc could not resolve the public export ${pkg.name}${name.slice(1)}.`);
  }
}

app.options.setValue(
  "entryPoints",
  entryPoints.map((entry) => entry.sourceFile.fileName),
);
const project = await app.convert();
if (!project || app.logger.hasErrors()) {
  throw new Error(`TypeDoc failed to analyze ${pkg.name}.`);
}

// API Extractor treated library metadata as opaque types. Keep checking the exported
// variables themselves, without requiring comments on generated diagnostic/decorator maps.
for (const reflection of project.getReflectionsByKind(ReflectionKind.Variable)) {
  if (
    reflection.isDeclaration() &&
    (reflection.name === "$lib" || reflection.name === "$decorators")
  ) {
    project.removeTypeReflections(reflection.type);
  }
}

const warnings = app.logger.warningCount;
app.validate(project);
if (app.logger.hasErrors() || app.logger.warningCount > warnings) {
  process.exitCode = 1;
} else {
  console.log(`Public API documentation is complete for ${pkg.name}.`);
}

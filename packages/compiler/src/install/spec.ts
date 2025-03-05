import semverParse from "semver/functions/parse.js";
import semverSatisfies from "semver/functions/satisfies.js";
import semverValid from "semver/functions/valid.js";
import semverValidRange from "semver/ranges/valid.js";
import { DiagnosticError } from "../core/diagnostic-error.js";
import { getDirectoryPath, joinPaths } from "../core/path-utils.js";
import type { CompilerHost, SourceFile, Tracer } from "../core/types.js";
import type { PackageJson } from "../types/package-json.js";
import { isSupportedPackageManager, type SupportedPackageManager } from "./config.js";

export interface Descriptor {
  /** Name of the package manager */
  readonly name: SupportedPackageManager;

  /** Supported version range  */
  readonly range: string;

  readonly hash?: Hash;
}

export interface Hash {
  readonly algorithm: string;
  readonly value: string;
}

export interface ResolvedSpecResult {
  readonly kind: "resolved";
  /** Path to the resolved package.json */
  readonly path: string;
  /** Resolved spec of the package manager */
  readonly spec: Descriptor;
}

type PackageManagerSpecResult =
  | { readonly kind: "no-package"; readonly path: string }
  | { readonly kind: "no-spec"; readonly path: string }
  | ResolvedSpecResult;

const nodeModulesRegExp = /\/node_modules\//;

/**
 * Resolve the package manager required for the current working directory.
 * @throws {PackageManagerSpecError} if there is error resolving it(Invalid package.json, invalid packageManager field)
 */
export async function resolvePackageManagerSpec(
  host: CompilerHost,
  parentTracer: Tracer,
  cwd: string,
): Promise<PackageManagerSpecResult> {
  const tracer = parentTracer.sub("pm-spec");
  let nextCwd = cwd;
  let currentCwd = "";

  let resolved: [PackageJson, SourceFile] | null = null;

  while (nextCwd !== currentCwd && !resolved) {
    currentCwd = nextCwd;
    nextCwd = getDirectoryPath(currentCwd);

    if (nodeModulesRegExp.test(currentCwd)) continue;

    const pkgJsonPath = joinPaths(currentCwd, "package.json");
    const packageJson = await readPackage(host, pkgJsonPath);

    if (packageJson) {
      resolved = packageJson;
    }
  }

  if (resolved === null) {
    return { kind: "no-package", path: cwd };
  }

  const [packageJson, source] = resolved;

  const spec = extractSpecFromPackageJson(tracer, packageJson, source);
  if (spec === undefined) {
    return { kind: "no-spec", path: source.path };
  }

  tracer.trace("resolved", `${source.path} defines ${spec} as local package manager`);

  return {
    kind: "resolved",
    path: source.path,
    spec,
  };
}

function serializeSpec(spec: Descriptor): string {
  return `${spec.name}@${spec.range}${spec.hash ? `+${spec.hash.algorithm}.${spec.hash.value}` : ""}`;
}

export async function updatePackageManagerInPackageJson(
  host: CompilerHost,
  path: string,
  spec: Descriptor,
) {
  const [pkg] = (await readPackage(host, path))!;
  pkg.packageManager = serializeSpec(spec);
  return host.writeFile(path, JSON.stringify(pkg, undefined, 2));
}

async function readPackage(
  host: CompilerHost,
  path: string,
): Promise<[PackageJson, SourceFile] | undefined> {
  let file: SourceFile;
  try {
    file = await host.readFile(path);
  } catch (err) {
    if ((err as any)?.code === "ENOENT") return undefined;
    throw err;
  }

  let packageJson;
  try {
    packageJson = JSON.parse(file.text);
  } catch {
    return undefined;
  }

  if (typeof packageJson !== "object" || packageJson === null) {
    throw new PackageManagerSpecError(`Invalid package.json ${path}}`, file);
  }
  return [packageJson, file];
}

function extractSpecFromPackageJson(
  tracer: Tracer,
  packageJSONContent: PackageJson,
  source: SourceFile,
): Descriptor | undefined {
  const pm = packageJSONContent.packageManager
    ? parsePackageManagerField(packageJSONContent.packageManager, source)
    : undefined;
  const devEnginePm = packageJSONContent.devEngines?.packageManager;
  if (devEnginePm != null) {
    if (typeof devEnginePm !== "object") {
      return pm;
    }
    if (Array.isArray(devEnginePm)) {
      return pm;
    }

    const { name, version } = devEnginePm;
    validatePackageManager(name, source);
    if (typeof name !== "string" || name.includes("@")) {
      throw new PackageManagerSpecError(
        `devEngines.packageManager.name ${JSON.stringify(name)} must be a package manager name without the version`,
        source,
      );
    }

    if (version == null || typeof version !== "string" || !semverValidRange(version)) {
      throw new PackageManagerSpecError(
        `devEngines.packageManager.version ${JSON.stringify(version)} is not a valid semver range`,
        source,
      );
    }
    validateVersionNotUrl(version, source);

    tracer.trace("devEngines", `devEngines.packageManager specify ${name}@${version}`);

    if (pm) {
      if (pm.name !== name)
        throw new PackageManagerSpecError(
          `"packageManager" field "${pm}" does not match name of "devEngines.packageManager" set to "${name}"`,
          source,
        );
      else if (version != null && !semverSatisfies(pm.range, version))
        throw new PackageManagerSpecError(
          `"packageManager" field is set to "${pm}" does not match the version defined in "devEngines.packageManager" "${name}" @ "${version}"`,
          source,
        );

      return pm;
    }

    return { name, range: version };
  }

  return pm;
}

function validatePackageManager(
  name: string,
  source: SourceFile,
): asserts name is SupportedPackageManager {
  if (!isSupportedPackageManager(name)) {
    throw new PackageManagerSpecError(
      `Unsupported packageManager specification: Package manager ${name} is not supported.`,
      source,
    );
  }
}
function validateVersionNotUrl(version: string, source: SourceFile) {
  const isURL = URL.canParse(version);
  if (isURL) {
    throw new PackageManagerSpecError(
      `Urls are not supported for package manager specifications "${version}"`,
      source,
    );
  }
}

function parsePackageManagerField(raw: unknown, source: SourceFile): Descriptor {
  if (typeof raw !== "string") {
    throw new PackageManagerSpecError(`Invalid packageManager field : expected a string`, source);
  }

  const atIndex = raw.indexOf("@");

  if (atIndex === -1 || atIndex === raw.length - 1) {
    throw new PackageManagerSpecError(
      `Invalid packageManager field "${raw}": a version to be specified for package manager.`,
      source,
    );
  }

  const name = raw.slice(0, atIndex);
  const version = raw.slice(atIndex + 1);
  validatePackageManager(name, source);
  validateVersionNotUrl(version, source);
  if (!semverValid(version))
    throw new PackageManagerSpecError(
      `Invalid packageManager field "${raw}": expected a semver version`,
      source,
    );

  const semver = semverParse(version)!;
  const hash =
    semver.build[0] && semver.build[1]
      ? { algorithm: semver.build[0], value: semver.build[1] }
      : undefined;
  return {
    name,
    range: semver.version,
    hash,
  };
}

export class PackageManagerSpecError extends DiagnosticError {
  constructor(message: string, source: SourceFile) {
    super({
      code: "invalid-package-manager-spec",
      message,
      severity: "error",
      target: { file: source, pos: 0, end: 0 },
    });
  }
}

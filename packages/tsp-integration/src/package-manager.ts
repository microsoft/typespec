import { readFile, stat } from "node:fs/promises";
import { join } from "pathe";

export type PackageManager = "npm" | "pnpm";

export async function detectPackageManager(dir: string): Promise<PackageManager> {
  const path = join(dir, "package.json");
  const manifest: unknown = JSON.parse(await readFile(path, "utf8"));
  if (typeof manifest !== "object" || manifest === null || Array.isArray(manifest)) {
    throw new Error(`Invalid package.json: ${path}`);
  }

  if ("packageManager" in manifest) {
    const declaration = manifest.packageManager;
    const match = typeof declaration === "string" && /^([^@]+)@(.+)$/.exec(declaration);
    if (!match) {
      throw new Error(`Invalid packageManager in ${path}: expected a name@version declaration.`);
    }
    const name = match[1];
    if (name !== "npm" && name !== "pnpm") {
      throw new Error(`Unsupported package manager "${name}" in ${path}. Use npm or pnpm.`);
    }
    return name;
  }

  for (const file of ["pnpm-workspace.yaml", "pnpm-lock.yaml"]) {
    try {
      await stat(join(dir, file));
      return "pnpm";
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
  return "npm";
}

export function getInstallCommand(manager: PackageManager) {
  return {
    command: manager,
    args:
      manager === "pnpm"
        ? ["install", "--no-lockfile", "--no-frozen-lockfile"]
        : ["install", "--no-package-lock"],
  };
}

export function getCompileCommand(manager: PackageManager, file: string, args: string[] = []) {
  return {
    command: manager,
    args: [
      // Manifests have been restored; pnpm must not reinstall their original dependencies.
      ...(manager === "pnpm"
        ? ["--config.verify-deps-before-run=false", "exec"]
        : ["exec", "--no", "--"]),
      "tsp",
      "compile",
      file,
      "--warn-as-error",
      ...args,
    ],
  };
}

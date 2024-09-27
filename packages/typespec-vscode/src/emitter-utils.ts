import { join } from "path";
import { NpmPackage, NpmPackageProvider } from "./npm-package.js";
import { forCurAndParentDirectories, isFile } from "./utils.js";

const isEmitter = async (pkg: NpmPackage) => {
  const data = await pkg.getPackageJsonData();
  if (!data) return false;
  const dep = {
    ...data.dependencies,
    ...data.devDependencies,
  };
  if (dep["@typespec/compiler"]) {
    const exports = await pkg.getModuleExports();
    return exports && exports.$onEmit;
  }
  return false;
};

export async function listEmitters(
  tspconfigFileOrFolder: string,
  npmPackageProvider: NpmPackageProvider,
): Promise<Record<string, NpmPackage>> {
  const emitters: Record<string, NpmPackage> = {};
  await forCurAndParentDirectories(tspconfigFileOrFolder, async (dir: string) => {
    const packageJsonPath = join(dir, "package.json");
    if (await isFile(packageJsonPath)) {
      const pkg = await npmPackageProvider.get(dir);
      if (!pkg) return;

      const data = await pkg.getPackageJsonData();
      if (!data) return;

      // TO CHECK; will emitter to be defined in dev/peerDependencies?
      for (const dep of Object.keys(data.dependencies ?? {})) {
        if (emitters[dep]) {
          // the closer dep wins
          continue;
        }
        const depFolder = join(dir, "node_modules", dep);
        const depPkg = await npmPackageProvider.get(depFolder);
        if (depPkg && (await isEmitter(depPkg))) {
          emitters[dep] = depPkg;
        }
      }
    }
  });

  return emitters;
}

export async function getEmitter(
  tspconfigFileOrFolder: string,
  npmPackageProvider: NpmPackageProvider,
  emitterName: string,
): Promise<NpmPackage | undefined> {
  return await forCurAndParentDirectories(tspconfigFileOrFolder, async (dir: string) => {
    const packageJsonPath = join(dir, "package.json");
    if (await isFile(packageJsonPath)) {
      const pkg = await npmPackageProvider.get(dir);
      if (!pkg) return undefined;

      const data = await pkg.getPackageJsonData();
      if (!data) return undefined;

      if (data.dependencies && data.dependencies[emitterName]) {
        const depFolder = join(dir, "node_modules", emitterName);
        const depPkg = await npmPackageProvider.get(depFolder);
        if (depPkg && (await isEmitter(depPkg))) {
          return depPkg;
        }
      }
    }
    return undefined;
  });
}

import { join } from "path";
import npmPackageProvider, { NpmPackage } from "./npm-package.js";
import { foreachCurAndParentDirs, isFile } from "./utils.js";

export async function listEmitters(tspconfigFolder: string): Promise<Record<string, NpmPackage>> {
  const isEmitter = async (pkg: NpmPackage) => {
    const data = await pkg.getPackageJsonData();
    if (data && data.dependencies && data.dependencies["@typespec/compiler"]) {
      const exports = await pkg.getModuleExports();
      return exports && exports.$onEmit;
    }
    return false;
  };

  const emitters: Record<string, NpmPackage> = {};
  await foreachCurAndParentDirs(tspconfigFolder, async (dir: string) => {
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

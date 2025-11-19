import { loadScenarios } from "../scenarios-resolver.js";
import { Diagnostic } from "../utils/diagnostic-reporter.js";
import { getCommit, getPackageJson, type SpectorPackageJson } from "../utils/misc-utils.js";
import { ScenarioLocation, ScenarioManifest } from "@typespec/spec-coverage-sdk";
import { getSourceLocation, normalizePath, PackageJson } from "@typespec/compiler";
import { relative } from "path";
import type { Scenario } from "../lib/decorators.js";

export async function computeScenarioManifest(
  scenariosPath: string,
): Promise<[ScenarioManifest | undefined, readonly Diagnostic[]]> {
  const [scenarios, diagnostics] = await loadScenarios(scenariosPath);
  if (diagnostics.length > 0) {
    return [undefined, diagnostics];
  }

  const commit = getCommit(scenariosPath);
  const pkg = await getPackageJson(scenariosPath);
  return [createScenarioManifest(scenariosPath, pkg, commit, scenarios), []];
}

function getRepo(pkg: PackageJson): string | undefined {
  const repository = pkg.repository;
  const gitUrl = typeof repository === "string" ? repository : repository?.url;
  if (!gitUrl) {
    return undefined;
  }
  // Parse git+https://github.com/org/repo.git to https://github.com/org/repo
  return gitUrl.replace(/^git\+/, "").replace(/\.git$/, "");
}
export function createScenarioManifest(
  scenariosPath: string,
  pkg: SpectorPackageJson | undefined,
  commit: string,
  scenarios: Scenario[],
): ScenarioManifest {
  const sortedScenarios = [...scenarios].sort((a, b) => a.name.localeCompare(b.name));
  return {
    version: pkg?.version ?? "?",
    repo: pkg && getRepo(pkg),
    sourceUrl: pkg?.spector?.sourceUrl,
    packageName: pkg?.name,
    displayName: pkg && ("displayName" in pkg ? pkg.displayName as string : undefined),
    commit,
    scenarios: sortedScenarios.map(({ name, scenarioDoc, target, tier }) => {
      const tspLocation = getSourceLocation(target);
      const location: ScenarioLocation = {
        path: normalizePath(relative(scenariosPath, tspLocation.file.path)),
        start: tspLocation.file.getLineAndCharacterOfPosition(tspLocation.pos),
        end: tspLocation.file.getLineAndCharacterOfPosition(tspLocation.end),
      };
      return { name, scenarioDoc, location, tier};
    }),
  };
}

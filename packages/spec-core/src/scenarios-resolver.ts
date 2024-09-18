import { Operation } from "@typespec/compiler";
import { isSharedRoute } from "@typespec/http";
import { ScenarioMockApi } from "@typespec/spec-api";
import { Scenario } from "@typespec/spec-lib";
import { dirname, join, relative, resolve } from "path";
import pc from "picocolors";
import { pathToFileURL } from "url";
import { logger } from "./logger.js";
import { importSpecExpect, importTypeSpec, importTypeSpecHttp } from "./spec-utils/index.js";
import { findFilesFromPattern } from "./utils/file-utils.js";
import {
  createDiagnosticReporter,
  Diagnostic,
  ensureScenariosPathExists,
  getSourceLocationStr,
} from "./utils/index.js";
import { normalizePath } from "./utils/path-utils.js";

export interface MockApiFile {
  path: string;
  scenarios: Record<string, ScenarioMockApi>;
}

interface SpecScenarioFile {
  name: string;
  specFilePath: string;
}

export async function findScenarioSpecFiles(scenariosPath: string): Promise<SpecScenarioFile[]> {
  await ensureScenariosPathExists(scenariosPath);
  const normalizedScenarioPath = normalizePath(scenariosPath);
  const pattern = [
    `${normalizedScenarioPath}/**/client.tsp`,
    `${normalizedScenarioPath}/**/main.tsp`,
  ];
  logger.debug(`Looking for scenarios in ${pattern}`);
  const fullScenarios = await findFilesFromPattern(pattern);
  logger.info(`Found ${fullScenarios.length} full scenarios.`);
  const scenarioSet = new Set(fullScenarios);
  const scenarios = fullScenarios.filter((scenario) => {
    // Exclude main.tsp that have a client.tsp next to it, we should use that instead
    return !(
      normalizePath(scenario).endsWith("/main.tsp") &&
      scenarioSet.has(join(dirname(scenario), "client.tsp"))
    );
  });

  logger.info(`Found ${scenarios.length} scenarios.`);

  return scenarios.map((name) => ({
    name: normalizePath(relative(scenariosPath, name))
      .replace("/main.tsp", "")
      .replace("/client.tsp", ""),
    specFilePath: normalizePath(resolve(scenariosPath, name)),
  }));
}

export async function loadScenarios(
  scenariosPath: string,
): Promise<[Scenario[], readonly Diagnostic[]]> {
  const scenarioFiles = await findScenarioSpecFiles(scenariosPath);
  const typespecCompiler = await importTypeSpec(scenariosPath);
  const specExpect = await importSpecExpect(scenariosPath);
  const typespecHttp = await importTypeSpecHttp(scenariosPath);

  const scenarioNames = new Map<string, Scenario[]>();
  const endpoints = new Map<string, Operation[]>();
  const diagnostics = createDiagnosticReporter();

  for (const { name, specFilePath } of scenarioFiles) {
    logger.debug(`Found scenario "${specFilePath}"`);
    const program = await typespecCompiler.compile(typespecCompiler.NodeHost, specFilePath, {
      additionalImports: ["@typespec/spec-lib"],
      noEmit: true,
      warningAsError: true,
    });

    // Workaround https://github.com/Azure/cadl-azure/issues/2458
    const programDiagnostics = program.diagnostics.filter(
      (d) =>
        !(
          d.code === "@azure-tools/typespec-azure-core/casing-style" &&
          typeof d.target === "object" &&
          "kind" in d.target &&
          d.target.kind === "Namespace" &&
          d.target.name === "DPG"
        ),
    );

    if (programDiagnostics.length > 0) {
      for (const item of programDiagnostics) {
        const sourceLocation = typespecCompiler.getSourceLocation(item.target);
        diagnostics.reportDiagnostic({
          message: `${item.message}: ${sourceLocation && getSourceLocationStr(sourceLocation)}`,
        });
      }

      diagnostics.reportDiagnostic({
        message: `${pc.red("✘")} Scenario ${name} is invalid.`,
      });
      continue;
    }

    const scenarios = specExpect.listScenarios(program);
    logger.debug(`  ${scenarios.length} scenarios`);

    for (const scenario of scenarios) {
      const existing = scenarioNames.get(scenario.name);
      if (existing) {
        existing.push(scenario);
      } else {
        scenarioNames.set(scenario.name, [scenario]);
      }
    }

    const service = typespecCompiler.ignoreDiagnostics(typespecHttp.getAllHttpServices(program))[0];
    const server = typespecHttp.getServers(program, service.namespace)?.[0];
    if (server?.url === undefined || !server?.url.includes("{")) {
      const serverPath = server ? new URL(server.url).pathname : "";
      for (const route of service.operations) {
        const path = serverPath + route.path;
        const key = `${route.verb} ${path}`;
        const existing = endpoints.get(key);
        if (existing) {
          if (!isSharedRoute(program, route.operation)) {
            existing.push(route.operation);
          }
        } else {
          endpoints.set(key, [route.operation]);
        }
      }
    }
  }

  for (const [name, scenarios] of scenarioNames.entries()) {
    if (scenarios.length > 1) {
      for (const scenario of scenarios) {
        diagnostics.reportDiagnostic({
          message: `Duplicate scenario name "${name}".`,
          target: scenario.target,
        });
      }
    }
  }

  for (const [path, operations] of endpoints.entries()) {
    if (operations.length > 1) {
      for (const operation of operations) {
        diagnostics.reportDiagnostic({
          message: `Duplicate endpoint path "${path}".`,
          target: operation,
        });
      }
    }
  }

  return [[...scenarioNames.values()].map((x) => x[0]), diagnostics.diagnostics];
}

export async function loadScenarioMockApiFiles(scenariosPath: string): Promise<MockApiFile[]> {
  const pattern = normalizePath(join(scenariosPath, "../dist/**/*.js"));
  logger.debug(`Looking for mock api files in ${pattern}`);
  const files = await findFilesFromPattern(pattern);
  logger.debug(`Detected ${files.length} mock api files: ${files}`);
  const results: MockApiFile[] = [];
  for (const file of files) {
    const result = await import(pathToFileURL(file).href);
    if (result.Scenarios) {
      logger.debug(`File '${file}' contains ${Object.keys(result.Scenarios).length} scenarios.`);
      results.push({
        path: normalizePath(file),
        scenarios: result.Scenarios,
      });
    } else {
      logger.debug(`File '${file}' is not exporting any scenarios.`);
    }
  }
  logger.info("result length: " + results.length);
  return results;
}

export async function loadScenarioMockApis(
  scenariosPath: string,
): Promise<Record<string, ScenarioMockApi>> {
  const files = await loadScenarioMockApiFiles(scenariosPath);
  const result: Record<string, ScenarioMockApi> = {};

  for (const file of files) {
    for (const [key, scenario] of Object.entries(file.scenarios)) {
      if (key in result) {
        logger.warn(`Scenario ${key} is being defined twice.`);
      }
      result[key] = scenario;
    }
  }
  return result;
}

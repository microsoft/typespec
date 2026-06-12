import pc from "picocolors";
import { logger } from "../logger.js";
import { findScenarioSpecFiles, loadScenarioMockApiFiles } from "../scenarios-resolver.js";
import { importSpecExpect, importTypeSpec } from "../spec-utils/import-spec.js";
import { createDiagnosticReporter } from "../utils/diagnostic-reporter.js";
import { isMockApiUriConsistentWithRoute, normalizeMockApiUri } from "../utils/route-utils.js";

export interface ValidateMockApisConfig {
  scenariosPath: string;
  exitDueToPreviousError?: boolean;
  hasMoreScenarios?: boolean;
}

export async function validateMockApis({
  scenariosPath,
  exitDueToPreviousError,
  hasMoreScenarios,
}: ValidateMockApisConfig) {
  const mockApis = await loadScenarioMockApiFiles(scenariosPath);
  const scenarioFiles = await findScenarioSpecFiles(scenariosPath);

  const specCompiler = await importTypeSpec(scenariosPath);
  const specExpect = await importSpecExpect(scenariosPath);
  const diagnostics = createDiagnosticReporter();
  for (const { name, specFilePath } of scenarioFiles) {
    logger.debug(`Found scenario "${specFilePath}"`);
    const program = await specCompiler.compile(specCompiler.NodeHost, specFilePath, {
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
      specCompiler.logDiagnostics(programDiagnostics, specCompiler.NodeHost.logSink);
      diagnostics.reportDiagnostic({
        message: `Scenario ${name} is invalid.`,
      });
      continue;
    }

    const mockApiFile = mockApis.find((x) => x.path.endsWith(`/${name}/mockapi.js`));
    if (mockApiFile === undefined) {
      diagnostics.reportDiagnostic({
        message: `Scenario ${name} is missing a mockapi file. Make sure to have a mockapi.ts that is built.`,
      });
      logger.debug(`Expected mock api file at "${name}/mockapi.js"`);

      continue;
    }

    const scenarios = specExpect.listScenarios(program);

    let foundFailure = false;
    for (const scenario of scenarios) {
      const mockApiScenario = mockApiFile.scenarios[scenario.name];
      if (mockApiScenario === undefined) {
        foundFailure = true;
        diagnostics.reportDiagnostic({
          message: `Scenario ${scenario.name} is missing an implementation in the ${name} scenario file.`,
        });
        continue;
      }

      // Ensure the `uri` served by the mock api matches the route defined in the spec. Otherwise
      // a generated client (which calls the spec route) would get a 404 from the mock server.
      if (scenario.endpoints.length > 0 && Array.isArray(mockApiScenario.apis)) {
        for (const api of mockApiScenario.apis) {
          if (api.kind !== "MockApiDefinition") {
            continue;
          }
          const matches = scenario.endpoints.some((endpoint) =>
            isMockApiUriConsistentWithRoute(endpoint.path, api.uri),
          );
          if (!matches) {
            foundFailure = true;
            diagnostics.reportDiagnostic({
              message: `Scenario ${scenario.name} has a mock api uri "${normalizeMockApiUri(
                api.uri,
              )}" that does not match (segment-by-segment, treating route template params as wildcards) any of the routes defined in the spec: ${scenario.endpoints
                .map((endpoint) => `"${endpoint.path}"`)
                .join(", ")}.`,
            });
          }
        }
      }
    }

    if (!foundFailure) {
      logger.info(`${pc.green("✓")} Scenario ${name} has all implemented mock apis.`);
    }
  }

  if (diagnostics.diagnostics.length === 0) {
    if (exitDueToPreviousError && !hasMoreScenarios) {
      process.exit(1);
    }
    if (exitDueToPreviousError) return exitDueToPreviousError;
    else return false;
  } else {
    if (hasMoreScenarios) {
      return true;
    } else {
      process.exit(1);
    }
  }
}

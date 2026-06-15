import type { Operation } from "@typespec/compiler";
import pc from "picocolors";
import { logger } from "../logger.js";
import { findScenarioSpecFiles, loadScenarioMockApiFiles } from "../scenarios-resolver.js";
import { importSpecExpect, importTypeSpec, importTypeSpecHttp } from "../spec-utils/import-spec.js";
import { createDiagnosticReporter } from "../utils/diagnostic-reporter.js";
import {
  getServerPathPrefixSegmentCount,
  isMockApiUriConsistentWithRoute,
  normalizeMockApiUri,
} from "../utils/route-utils.js";

interface OperationRouteInfo {
  routePath: string;
  serverPrefixSegmentCount: number;
}

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
  const httpLib = await importTypeSpecHttp(scenariosPath);
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

    // Resolve the real HTTP route of every operation from the spec. Unlike the route summary
    // attached to each scenario endpoint, these routes are fully resolved (e.g. ARM routes,
    // `@path` parameters and api-version path segments are included), so they can be reliably
    // compared against the mock api uris.
    const routeInfoByOperation = new Map<Operation, OperationRouteInfo[]>();
    const [httpServices] = httpLib.getAllHttpServices(program);
    for (const service of httpServices) {
      const servers = httpLib.getServers(program, service.namespace);
      const serverPrefixSegmentCount =
        servers && servers.length > 0
          ? Math.min(...servers.map((server) => getServerPathPrefixSegmentCount(server.url)))
          : 0;
      for (const httpOperation of service.operations) {
        const infos = routeInfoByOperation.get(httpOperation.operation) ?? [];
        infos.push({ routePath: httpOperation.path, serverPrefixSegmentCount });
        routeInfoByOperation.set(httpOperation.operation, infos);
      }
    }

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

      // Ensure every route defined in the spec is served by at least one mock api `uri`. Otherwise
      // a generated client (which calls the spec route) would get a 404 from the mock server.
      //
      // The check is done per spec route (rather than per mock api uri) on purpose: a scenario may
      // legitimately register extra mock handlers that are not declared operations in the spec
      // (e.g. long-running-operation status-polling urls or server-driven pagination continuation
      // pages), and those should not be flagged.
      if (scenario.endpoints.length > 0 && Array.isArray(mockApiScenario.apis)) {
        const mockUris = mockApiScenario.apis
          .filter((api) => api.kind === "MockApiDefinition")
          .map((api) => api.uri);

        if (mockUris.length > 0) {
          for (const endpoint of scenario.endpoints) {
            const routeInfos = routeInfoByOperation.get(endpoint.target);
            // Only validate when the route could be resolved. If it could not (e.g. an operation
            // without an HTTP route), skip rather than risk a false positive.
            if (!routeInfos || routeInfos.length === 0) {
              continue;
            }
            const matched = routeInfos.some((info) =>
              mockUris.some((uri) =>
                isMockApiUriConsistentWithRoute(info.routePath, uri, info.serverPrefixSegmentCount),
              ),
            );
            if (!matched) {
              foundFailure = true;
              diagnostics.reportDiagnostic({
                message: `Scenario ${scenario.name} defines the route ${routeInfos
                  .map((info) => `"${info.routePath}"`)
                  .join(
                    " or ",
                  )} but none of its mock api uris match it (route template params are treated as wildcards). Mock api uris: ${mockUris
                  .map((uri) => `"${normalizeMockApiUri(uri)}"`)
                  .join(", ")}.`,
              });
            }
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

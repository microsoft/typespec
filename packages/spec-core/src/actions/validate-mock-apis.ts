import pc from "picocolors";
import { logger } from "../logger.js";
import { findScenarioSpecFiles, loadScenarioMockApiFiles } from "../scenarios-resolver.js";
import { importSpecExpect, importTypeSpec } from "../spec-utils/import-spec.js";
import { createDiagnosticReporter } from "../utils/diagnostic-reporter.js";

export interface ValidateMockApisConfig {
  scenariosPath: string;
}

export async function validateMockApis({ scenariosPath }: ValidateMockApisConfig) {
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
      specCompiler.logDiagnostics(programDiagnostics, { log: logger.error });
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
      if (mockApiFile.scenarios[scenario.name] === undefined) {
        foundFailure = true;
        diagnostics.reportDiagnostic({
          message: `Scenario ${scenario.name} is missing implementation in for ${name} scenario file.`,
        });
      }
    }

    if (!foundFailure) {
      logger.info(`${pc.green("✓")} Scenario ${name} has all implemented mock apis.`);
    }
  }

  if (diagnostics.diagnostics.length) {
    process.exit(1);
  }
}

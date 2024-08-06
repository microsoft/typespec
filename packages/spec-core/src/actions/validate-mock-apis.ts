import pc from "picocolors";
import { logger } from "../logger.js";
import { findScenarioCadlFiles, loadScenarioMockApiFiles } from "../scenarios-resolver.js";
import { importCadlRanchExpect, importTypeSpec } from "../spec-utils/import-cadl.js";
import { createDiagnosticReporter } from "../utils/diagnostic-reporter.js";

export interface ValidateMockApisConfig {
  scenariosPath: string;
}

export async function validateMockApis({ scenariosPath }: ValidateMockApisConfig) {
  const mockApis = await loadScenarioMockApiFiles(scenariosPath);
  const scenarioFiles = await findScenarioCadlFiles(scenariosPath);

  const cadlCompiler = await importTypeSpec(scenariosPath);
  const cadlRanchExpect = await importCadlRanchExpect(scenariosPath);
  const diagnostics = createDiagnosticReporter();
  for (const { name, cadlFilePath } of scenarioFiles) {
    logger.debug(`Found scenario "${cadlFilePath}"`);
    const program = await cadlCompiler.compile(cadlCompiler.NodeHost, cadlFilePath, {
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
        )
    );

    if (programDiagnostics.length > 0) {
      cadlCompiler.logDiagnostics(programDiagnostics, { log: logger.error });
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

    const scenarios = cadlRanchExpect.listScenarios(program);

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

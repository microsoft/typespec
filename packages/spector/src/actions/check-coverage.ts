import { CoverageReport, ScenarioStatus } from "@typespec/spec-coverage-sdk";
import { readFile, writeFile } from "fs/promises";
import { loadSpecConfig } from "../config/config.js";
import { createCoverageReport } from "../coverage/coverage-report.js";
import { loadScenarioMockApis } from "../scenarios-resolver.js";
import { createDiagnosticReporter, findFilesFromPattern } from "../utils/index.js";

export interface CheckCoverageConfig {
  scenariosPath: string;
  configFile?: string;
  coverageFiles: string[];
  mergedCoverageFile: string;
  ignoreNotImplemented?: boolean;
}

export async function checkCoverage(config: CheckCoverageConfig) {
  const inputCoverageFiles = (
    await Promise.all(config.coverageFiles.map((x) => findFilesFromPattern(x)))
  ).flat();

  const results: Record<string, ScenarioStatus> = {};
  const diagnosticsReporter = createDiagnosticReporter();
  const scenarios = await loadScenarioMockApis(config.scenariosPath);

  for (const scenarioName of Object.keys(scenarios)) {
    results[scenarioName] = "not-implemented";
  }

  if (config.configFile) {
    const [specConfig, diagnostics] = await loadSpecConfig(config.configFile);
    diagnosticsReporter.reportDiagnostics(diagnostics);

    for (const scenarioName of specConfig.unsupportedScenarios) {
      results[scenarioName] = "not-supported";
    }
  }

  for (const coverageFile of inputCoverageFiles) {
    const content = await readFile(coverageFile);
    const inputCoverage: CoverageReport = JSON.parse(content.toString());

    for (const [scenarioName, scenarioStatus] of Object.entries(inputCoverage.results)) {
      const existing = results[scenarioName];
      if (existing === undefined) {
        diagnosticsReporter.reportDiagnostic({
          message: `Scenario ${scenarioName} with coverage in file "${coverageFile}" is not defined in the scenarios in path "${config.scenariosPath}".`,
        });
        continue;
      }

      switch (scenarioStatus) {
        case "fail":
          results[scenarioName] = "fail";
          diagnosticsReporter.reportDiagnostic({
            message: `Scenario ${scenarioName} failed in "${coverageFile}".`,
          });
          break;
        case "pass":
        case "not-applicable":
        case "not-supported":
          if (existing === "not-implemented") {
            results[scenarioName] = scenarioStatus;
          }
          break;
        case "not-implemented":
        // nothing
      }
    }
  }

  if (!config.ignoreNotImplemented) {
    for (const [scenarioName, scenarioStatus] of Object.entries(results)) {
      if (scenarioStatus === "not-implemented") {
        diagnosticsReporter.reportDiagnostic({
          message: `Scenario ${scenarioName} is not implemented.`,
        });
      }
    }
  }

  const coverageReport = createCoverageReport(config.scenariosPath, results);
  await writeFile(config.mergedCoverageFile, JSON.stringify(coverageReport, null, 2));

  if (diagnosticsReporter.diagnostics.length) {
    process.exit(1);
  }
}

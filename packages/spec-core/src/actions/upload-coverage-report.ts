import { AzureCliCredential } from "@azure/identity";
import { CoverageReport, GeneratorMetadata, SpecCoverageClient } from "@typespec/spec-coverage-sdk";
import { readFile } from "fs/promises";
import pc from "picocolors";
import { logger } from "../logger.js";

export interface UploadCoverageReportConfig {
  coverageFile: string;
  storageAccountName: string;
  generatorName: string;
  generatorVersion: string;
  generatorCommit?: string;
  generatorMode: string;
}

export async function uploadCoverageReport({
  coverageFile,
  storageAccountName,
  generatorName,
  generatorVersion,
  generatorCommit: geenratorCommit,
  generatorMode,
}: UploadCoverageReportConfig) {
  const content = await readFile(coverageFile);
  const coverage: CoverageReport = JSON.parse(content.toString());

  const client = new SpecCoverageClient(storageAccountName, new AzureCliCredential());
  const generatorMetadata: GeneratorMetadata = {
    name: generatorName,
    version: generatorVersion,
    mode: generatorMode,
    commit: geenratorCommit,
  };
  await client.coverage.upload(generatorMetadata, coverage);

  logger.info(
    `${pc.green(
      "✓",
    )} Scenario coverage file "${coverageFile}" uploaded to ${storageAccountName} storage account for ${generatorName}@${generatorVersion}.`,
  );
}

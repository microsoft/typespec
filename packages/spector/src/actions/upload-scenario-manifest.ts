import { AzureCliCredential } from "@azure/identity";
import { SpecCoverageClient } from "@typespec/spec-coverage-sdk";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import pc from "picocolors";
import { computeScenarioManifest } from "../coverage/scenario-manifest.js";
import { logger } from "../logger.js";

export interface UploadScenarioManifestConfig {
  scenariosPath: string;
  storageAccountName: string;
  containerName: string;
  manifestName: string;
  override?: boolean;
}

export async function uploadScenarioManifest({
  scenariosPath,
  storageAccountName,
  containerName,
  manifestName,
  override = false,
}: UploadScenarioManifestConfig) {
  const path = resolve(process.cwd(), scenariosPath);
  logger.info(`Computing scenario manifest for ${path}`);
  const [manifest, diagnostics] = await computeScenarioManifest(path);
  if (manifest === undefined || diagnostics.length > 0) {
    process.exit(-1);
  }
  await writeFile("manifest.json", JSON.stringify(manifest, null, 2));
  const client = new SpecCoverageClient(storageAccountName, {
    credential: new AzureCliCredential(),
    containerName,
  });
  await client.createIfNotExists();
  if (override) {
    await client.manifest.upload(manifestName, manifest);
    logger.info(
      `${pc.green("✓")} Scenario manifest uploaded to ${storageAccountName} storage account.`,
    );
  } else {
    const result = await client.manifest.uploadIfVersionNew(manifestName, manifest);

    if (result === "uploaded") {
      logger.info(
        `${pc.green("✓")} Scenario manifest new version uploaded to ${storageAccountName} storage account.`,
      );
    } else {
      logger.info(
        `${pc.white("-")} Existing scenario manifest in ${storageAccountName} storage account is up to date. No upload needed.`,
      );
    }
  }
}

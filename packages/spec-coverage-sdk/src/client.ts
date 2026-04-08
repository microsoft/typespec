import { TokenCredential } from "@azure/identity";
import {
  AnonymousCredential,
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { eq as semverEq, gt as semverGt, valid as semverValid } from "semver";
import {
  CoverageReport,
  GeneratorMetadata,
  ResolvedCoverageReport,
  ScenarioManifest,
} from "./types.js";

export class SpecCoverageClient {
  #container: ContainerClient;
  manifest: SpecManifestOperations;
  coverage: SpecCoverageOperations;

  constructor(
    storageAccountName: string,
    options?: {
      credential?: StorageSharedKeyCredential | AnonymousCredential | TokenCredential;
      containerName?: string;
    },
  ) {
    this.#container = getCoverageContainer(
      storageAccountName,
      options?.credential,
      options?.containerName,
    );
    this.manifest = new SpecManifestOperations(this.#container);
    this.coverage = new SpecCoverageOperations(this.#container);
  }

  public async createIfNotExists() {
    await this.#container.createIfNotExists({
      access: "blob",
    });
  }
}

export class SpecManifestOperations {
  #container: ContainerClient;

  constructor(container: ContainerClient) {
    this.#container = container;
  }

  public async upload(name: string, manifest: ScenarioManifest): Promise<void> {
    await this.#upload(name, "latest", manifest);
    await this.#upload(name, manifest.version, manifest);
  }

  async #upload(name: string, version: string, manifest: ScenarioManifest): Promise<void> {
    const blob = this.#container.getBlockBlobClient(this.#blobName(name, version));
    const content = JSON.stringify(manifest, null, 2);
    await blob.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json; charset=utf-8",
      },
    });
  }

  public async uploadIfVersionNew(
    name: string,
    manifest: ScenarioManifest,
  ): Promise<"uploaded" | "skipped"> {
    const existingVersion = await this.tryGet(name, manifest.version);
    if (existingVersion) {
      return "skipped";
    }
    const existingLatest = await this.tryGet(name);
    if (existingLatest && !isVersionNewer(manifest.version, existingLatest.version)) {
      return "skipped";
    }

    await this.upload(name, manifest);
    return "uploaded";
  }

  public async get(name: string, version?: string): Promise<ScenarioManifest> {
    const blob = this.#container.getBlockBlobClient(this.#blobName(name, version));
    return readJsonBlob<ScenarioManifest>(blob);
  }

  public async tryGet(name: string, version?: string): Promise<ScenarioManifest | undefined> {
    const blob = this.#container.getBlockBlobClient(this.#blobName(name, version));
    try {
      return await readJsonBlob<ScenarioManifest>(blob);
    } catch (e: any) {
      if ("code" in e && e.code === "BlobNotFound") {
        return undefined;
      }
      throw e;
    }
  }

  #blobName(name: string, version?: string) {
    return `manifests/${name}/${version ?? "latest"}.json`;
  }
}

function areVersionsEquivalent(left: string, right: string): boolean {
  const leftValid = semverValid(left);
  const rightValid = semverValid(right);
  if (leftValid && rightValid) {
    return semverEq(leftValid, rightValid);
  }
  return left === right;
}

function isVersionNewer(candidate: string, existing: string): boolean {
  const candidateValid = semverValid(candidate);
  const existingValid = semverValid(existing);
  if (candidateValid && existingValid) {
    return semverGt(candidateValid, existingValid);
  }
  return !areVersionsEquivalent(candidate, existing);
}

export class SpecCoverageOperations {
  #container: ContainerClient;

  constructor(container: ContainerClient) {
    this.#container = container;
  }

  public async upload(generatorMetadata: GeneratorMetadata, report: CoverageReport): Promise<void> {
    const blob = this.#container.getBlockBlobClient(
      `${generatorMetadata.name}/reports/${generatorMetadata.version}/${generatorMetadata.mode}.json`,
    );
    const resolvedReport: ResolvedCoverageReport = { ...report, generatorMetadata };
    const content = JSON.stringify(resolvedReport, null, 2);
    await blob.upload(content, content.length, {
      metadata: {
        generatorName: generatorMetadata.name,
        generatorVersion: generatorMetadata.version,
        generatorMode: generatorMetadata.mode,
      },
      blobHTTPHeaders: {
        blobContentType: "application/json; charset=utf-8",
      },
    });

    await this.updateIndex(generatorMetadata.name, generatorMetadata.version);
  }

  public async getLatestCoverageFor(
    generatorName: string,
    generatorMode: string,
  ): Promise<ResolvedCoverageReport | undefined> {
    const index = await readJsonBlob<{ version: string; types: string[] }>(
      this.#container.getBlockBlobClient(`${generatorName}/index.json`),
    );

    // Compatible with current format, delete later
    const blobClientOldVersion = this.#container.getBlockBlobClient(
      `${generatorName}/reports/${index.version}.json`,
    );
    if (await blobClientOldVersion.exists()) {
      const blob = await blobClientOldVersion.download();
      const body = await blob.blobBody;
      const content = await body?.text();
      const report = content ? JSON.parse(content) : undefined;
      return {
        generatorMetadata: {
          version: blob.metadata?.generatorversion,
          name: blob.metadata?.generatorname,
          mode: "azure",
        },
        ...report,
      };
    } else {
      const blobClient = this.#container.getBlockBlobClient(
        `${generatorName}/reports/${index.version}/${generatorMode}.json`,
      );
      if (await blobClient.exists()) {
        const blob = await blobClient.download();
        const body = await blob.blobBody;
        const content = await body?.text();
        const report = content ? JSON.parse(content) : undefined;

        return {
          generatorMetadata: {
            version: blob.metadata?.generatorversion,
            name: blob.metadata?.generatorname,
            mode: blob.metadata?.generatorMode,
          },
          ...report,
        };
      } else return undefined;
    }
  }

  private async updateIndex(generatorName: string, version: string) {
    const blob = this.#container.getBlockBlobClient(`${generatorName}/index.json`);
    const data = {
      version,
    };
    const content = JSON.stringify(data, null, 2);
    await blob.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json; charset=utf-8",
      },
    });
  }
}

function getCoverageContainer(
  storageAccountName: string,
  credential?: StorageSharedKeyCredential | AnonymousCredential | TokenCredential,
  containerName?: string,
): ContainerClient {
  const blobSvc = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential,
  );
  containerName = containerName || "coverages";
  const containerClient = blobSvc.getContainerClient(containerName);
  return containerClient;
}

async function readJsonBlob<T>(blobClient: BlockBlobClient): Promise<T> {
  const blob = await blobClient.download();
  if (blob.blobBody) {
    const body = await blob.blobBody;
    const content = await body!.text();
    return JSON.parse(content);
  } else if (blob.readableStreamBody) {
    const stream = blob.readableStreamBody;
    let content = "";
    for await (const chunk of stream) {
      content += chunk;
    }
    return JSON.parse(content);
  } else {
    throw new Error("Blob has no body");
  }
}

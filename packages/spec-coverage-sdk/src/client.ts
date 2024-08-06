import {
  AnonymousCredential,
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { TokenCredential } from "@azure/identity";
import { CoverageReport, GeneratorMetadata, ResolvedCoverageReport, ScenarioManifest } from "./types.js";

export class CadlRanchCoverageClient {
  #container: ContainerClient;
  manifest: CadlRanchManifestOperations;
  coverage: CadlRanchCoverageOperations;

  constructor(
    storageAccountName: string,
    credential?: StorageSharedKeyCredential | AnonymousCredential | TokenCredential,
  ) {
    this.#container = getCoverageContainer(storageAccountName, credential);
    this.manifest = new CadlRanchManifestOperations(this.#container);
    this.coverage = new CadlRanchCoverageOperations(this.#container);
  }

  public async createIfNotExists() {
    await this.#container.createIfNotExists({
      access: "blob",
    });
  }
}

export class CadlRanchManifestOperations {
  #blob: BlockBlobClient;
  #container: ContainerClient;

  constructor(container: ContainerClient) {
    this.#container = container;
    this.#blob = this.#container.getBlockBlobClient("manifest.json");
  }

  public async upload(manifest: ScenarioManifest): Promise<void> {
    const content = JSON.stringify(manifest, null, 2);
    await this.#blob.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json; charset=utf-8",
      },
    });
  }

  public async get(): Promise<ScenarioManifest> {
    return readJsonBlob<ScenarioManifest>(this.#blob);
  }
}

export class CadlRanchCoverageOperations {
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
    const blobClientOldVersion = this.#container.getBlockBlobClient(`${generatorName}/reports/${index.version}.json`);
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
): ContainerClient {
  const blobSvc = new BlobServiceClient(`https://${storageAccountName}.blob.core.windows.net`, credential);
  const containerClient = blobSvc.getContainerClient(`coverages`);
  return containerClient;
}

async function readJsonBlob<T>(blobClient: BlockBlobClient): Promise<T> {
  const blob = await blobClient.download();
  const body = await blob.blobBody;
  const content = await body?.text();
  return content ? JSON.parse(content) : undefined;
}

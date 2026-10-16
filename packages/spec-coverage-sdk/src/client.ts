import type { TokenCredential } from "@azure/identity";
import type {
  AnonymousCredential,
  BlockBlobClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { BlobServiceClient } from "@azure/storage-blob";
import { eq as semverEq, gt as semverGt, valid as semverValid } from "semver";
import type {
  CoverageReport,
  GeneratorMetadata,
  ResolvedCoverageReport,
  ScenarioManifest,
} from "./types.js";

/**
 * Stores scenario manifests and generator coverage reports in an Azure Blob Storage container.
 *
 * Constructing a client does not create the container. Use
 * {@link SpecCoverageClient.createIfNotExists} before uploading to a new container.
 * Storage and JSON parsing errors reject the returned promises unless an operation
 * explicitly documents otherwise.
 */
export class SpecCoverageClient {
  #container: ContainerClient;
  /** Reads and publishes scenario manifests independently of generator coverage reports. */
  manifest: SpecManifestOperations;
  /** Publishes coverage reports and retrieves the report selected by a generator's index. */
  coverage: SpecCoverageOperations;

  /**
   * Creates operation clients for `https://<storageAccountName>.blob.core.windows.net`.
   * No request is made until an operation is called.
   *
   * @param storageAccountName - Azure Storage account name, not a URL.
   */
  constructor(
    storageAccountName: string,
    options?: {
      /** Credential used for storage requests. Omit for anonymous access to public blobs. */
      credential?: StorageSharedKeyCredential | AnonymousCredential | TokenCredential;
      /** Container holding both manifests and reports. Defaults to `"coverages"` when omitted or empty. */
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

  /**
   * Creates the container if absent, allowing anonymous reads of individual blobs
   * but not anonymous container listing. Leaves an existing container unchanged.
   * Requires credentials and account settings that permit the creation request.
   */
  public async createIfNotExists() {
    await this.#container.createIfNotExists({
      access: "blob",
    });
  }
}

/** Reads and publishes versioned scenario catalogs under `manifests/<name>/` in a container. */
export class SpecManifestOperations {
  #container: ContainerClient;

  /**
   * Uses an existing container client, including its endpoint and authentication.
   * Does not create the container.
   */
  constructor(container: ContainerClient) {
    this.#container = container;
  }

  /**
   * Overwrites `manifests/<name>/latest.json`, then the blob for `manifest.version`.
   * The writes are separate requests: a failure may leave only the latest copy updated.
   *
   * @param name - Storage key for the scenario set; independent of the manifest's package name.
   */
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

  /**
   * Publishes a manifest only if its version blob is absent and its version is newer
   * than the latest manifest. When both versions are valid semantic versions, uses
   * semantic-version ordering; otherwise, any different version string qualifies.
   *
   * These checks are not atomic with the upload. Storage and parsing errors are
   * propagated rather than treated as an absent manifest.
   *
   * @returns `"uploaded"` after both writes succeed, or `"skipped"` if the version
   * already exists or does not qualify to replace the latest manifest.
   */
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

  /**
   * Downloads and parses the manifest stored under the given scenario-set name.
   * Omitting `version` selects `latest.json`. Missing blobs and invalid JSON reject
   * the promise; the parsed value is not checked against the manifest schema.
   */
  public async get(name: string, version?: string): Promise<ScenarioManifest> {
    const blob = this.#container.getBlockBlobClient(this.#blobName(name, version));
    return readJsonBlob<ScenarioManifest>(blob);
  }

  /**
   * Reads a manifest like {@link SpecManifestOperations.get}, returning `undefined`
   * only when Azure reports `BlobNotFound`. Other failures, including a missing
   * container or invalid JSON, reject.
   */
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

/** Publishes generator reports and resolves the version selected by each generator's index. */
export class SpecCoverageOperations {
  #container: ContainerClient;

  /**
   * Uses an existing container client, including its endpoint and authentication.
   * Does not create the container.
   */
  constructor(container: ContainerClient) {
    this.#container = container;
  }

  /**
   * Overwrites `<name>/reports/<version>/<mode>.json` with the report and generator
   * metadata, then updates `<name>/index.json` to that version.
   *
   * The index is shared across modes and follows upload order, not version ordering.
   * A failure updating it can leave the report stored without making it the latest.
   */
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

  /**
   * Reads the generator's index and downloads the requested mode at its selected version.
   * A legacy `<name>/reports/<version>.json` blob takes precedence over mode-specific
   * blobs when present, regardless of the requested mode.
   *
   * Report content is parsed from `blobBody` when available. Node.js streaming responses
   * are not read by this method and currently return only generator metadata.
   *
   * @returns The stored report fields and generator metadata, or `undefined` if neither report
   * blob exists. The stored JSON is not normalized or validated against the report schema.
   * A missing index or storage failure rejects. Invalid report JSON rejects when its body is read.
   */
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

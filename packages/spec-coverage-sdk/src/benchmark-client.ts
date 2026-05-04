import type { TokenCredential } from "@azure/identity";
import {
  AnonymousCredential,
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import type { CompilerBenchmarkHistory, CompilerBenchmarkResult } from "./benchmark-types.js";

const BENCHMARK_HISTORY_BLOB = "compiler-benchmarks/history.json";

/**
 * Client for storing and retrieving TypeSpec compiler benchmark results.
 * Results are stored per commit so the dashboard can use commit as the x-axis.
 */
export class CompilerBenchmarkClient {
  readonly #container: ContainerClient;

  constructor(
    storageAccountName: string,
    options?: {
      credential?: StorageSharedKeyCredential | AnonymousCredential | TokenCredential;
      containerName?: string;
    },
  ) {
    const blobSvc = new BlobServiceClient(
      `https://${storageAccountName}.blob.core.windows.net`,
      options?.credential,
    );
    this.#container = blobSvc.getContainerClient(options?.containerName ?? "coverages");
  }

  /** Upload a new benchmark result for the given commit. */
  public async upload(result: CompilerBenchmarkResult): Promise<void> {
    const history = await this.#readHistory();
    // Remove any previous entry for the same commit to avoid duplicates.
    const filtered = history.results.filter((r) => r.commit !== result.commit);
    filtered.push(result);
    // Keep the list sorted by date (oldest first) so the dashboard renders naturally.
    filtered.sort((a, b) => a.date.localeCompare(b.date));
    await this.#writeHistory({ results: filtered });
  }

  /** Retrieve the full benchmark history. Returns an empty history if none exists. */
  public async getHistory(): Promise<CompilerBenchmarkHistory> {
    return this.#readHistory();
  }

  async #readHistory(): Promise<CompilerBenchmarkHistory> {
    const blob = this.#container.getBlockBlobClient(BENCHMARK_HISTORY_BLOB);
    try {
      return await readJsonBlob<CompilerBenchmarkHistory>(blob);
    } catch (e: any) {
      if ("code" in e && e.code === "BlobNotFound") {
        return { results: [] };
      }
      throw e;
    }
  }

  async #writeHistory(history: CompilerBenchmarkHistory): Promise<void> {
    const blob = this.#container.getBlockBlobClient(BENCHMARK_HISTORY_BLOB);
    const content = JSON.stringify(history, null, 2);
    await blob.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json; charset=utf-8",
      },
    });
  }
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

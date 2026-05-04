import { AzureCliCredential } from "@azure/identity";
import { CompilerBenchmarkClient, CompilerBenchmarkMetrics } from "@typespec/spec-coverage-sdk";
import { execFileSync } from "child_process";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import pc from "picocolors";
import { logger } from "../logger.js";

export interface UploadBenchmarkConfig {
  /** Full git commit SHA being benchmarked. */
  commit: string;
  /** Name of the Azure Blob Storage account. */
  storageAccountName: string;
  /** Name of the container within the storage account. */
  containerName: string;
  /** Path to the `tsp` CLI entry point. Defaults to the compiler in node_modules. */
  tspBin?: string;
}

/**
 * Run the TypeSpec compiler on a representative fixture, collect the
 * performance statistics, and upload the result to Azure Blob Storage
 * keyed by the commit SHA.
 */
export async function uploadBenchmark({
  commit,
  storageAccountName,
  containerName,
  tspBin,
}: UploadBenchmarkConfig): Promise<void> {
  const metrics = runBenchmark(tspBin);
  logger.info(`Benchmark result for commit ${commit.slice(0, 8)}:`, metrics as any);

  const client = new CompilerBenchmarkClient(storageAccountName, {
    credential: new AzureCliCredential(),
    containerName,
  });

  await client.upload({
    commit,
    date: new Date().toISOString(),
    metrics,
  });

  logger.info(
    `${pc.green("✓")} Benchmark result for commit ${commit.slice(0, 8)} uploaded to ${storageAccountName}/${containerName}.`,
  );
}

// ---------------------------------------------------------------------------
// Benchmark runner
// ---------------------------------------------------------------------------

const FIXTURE = `
import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({ title: "Benchmark Service" })
namespace BenchmarkService;

model Item {
  id: string;
  name: string;
  description?: string;
  createdAt: utcDateTime;
  tags: string[];
}

model CreateItemRequest {
  name: string;
  description?: string;
  tags?: string[];
}

@route("/items")
interface Items {
  @get list(): Item[];
  @post create(@body body: CreateItemRequest): Item;
  @get read(@path id: string): Item;
  @put update(@path id: string, @body body: CreateItemRequest): Item;
  @delete remove(@path id: string): void;
}
`;

function runBenchmark(tspBin?: string): CompilerBenchmarkMetrics {
  const dir = mkdtempSync(join(tmpdir(), "tsp-bench-"));
  try {
    const mainFile = join(dir, "main.tsp");
    writeFileSync(mainFile, FIXTURE);

    // Resolve the tsp compiler binary. Prefer an explicitly provided path; otherwise
    // look for the compiler CLI in the monorepo's node_modules/.bin.
    const bin =
      tspBin ??
      join(new URL("../../../..", import.meta.url).pathname, "node_modules", ".bin", "tsp");

    let output = "";
    let exitCode = 0;
    try {
      output = execFileSync(process.execPath, [bin, "compile", mainFile, "--no-emit", "--stats"], {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (e: any) {
      exitCode = e.status ?? 1;
      // tsp compile exits non-zero when there are only warnings; capture the output
      // so we can still parse the stats. However, if there is no usable output
      // (e.g. the binary was not found), surface the error immediately.
      output = (e.stdout ?? "") + (e.stderr ?? "");
      if (!output.trim()) {
        throw new Error(`tsp compile failed with exit code ${exitCode}: ${String(e.message ?? e)}`);
      }
    }

    const metrics = parseStats(output);
    // Sanity-check: if total is still 0 the output format may have changed.
    if (metrics.total === 0) {
      logger.warn(
        `Could not parse 'total' duration from tsp compile output. ` +
          `The stats output format may have changed. Raw output:\n${output}`,
      );
    }
    return metrics;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Parse timing values from the `tsp compile --stats` output.
 * Lines look like:   loader:   123ms
 */
function parseStats(output: string): CompilerBenchmarkMetrics {
  const extract = (key: string): number => {
    const match = output.match(new RegExp(`${key}[^\\d]*(\\d+(?:\\.\\d+)?)ms`, "i"));
    return match ? Math.round(parseFloat(match[1])) : 0;
  };
  return {
    total: extract("total"),
    loader: extract("loader"),
    resolver: extract("resolver"),
    checker: extract("checker"),
    validation: extract("validation"),
    linter: extract("linter"),
  };
}

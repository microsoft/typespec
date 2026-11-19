// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { execFileSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const packages = [
  ["http-client-csharp", "Azure.Generator.dll"],
  ["http-client-csharp-mgmt", "Azure.Generator.Management.dll"],
  ["http-client-csharp-provisioning", "Azure.Generator.Provisioning.dll"],
];

async function download(url, allowNotFound = false) {
  const response = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  if (allowNotFound && response.status === 404) {
    return undefined;
  }
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  return response;
}

export async function installAzureGenerators(
  root,
  baseUrl = "https://typespec.blob.core.windows.net/pkgs/",
) {
  const base = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  await mkdir(root, { recursive: true });
  for (const [packageDirectory, plugin] of packages) {
    const packageName = `@azure-typespec/${packageDirectory}`;
    const indexUrl = new URL(`${packageName}/latest.json`, base);
    const indexResponse = await download(indexUrl, true);
    if (!indexResponse) {
      process.stderr.write(`WARNING: Skipping ${packageName}: ${indexUrl} returned HTTP 404.\n`);
      continue;
    }
    const index = await indexResponse.json();
    if (typeof index.version !== "string" || !/^[0-9A-Za-z][0-9A-Za-z.+-]*$/.test(index.version)) {
      throw new Error(`Invalid published version for ${packageName}.`);
    }
    const runtimeUrl = new URL(`${packageName}/${index.version}/runtime.tgz`, base);
    if (index.runtimeUrl !== runtimeUrl.href) {
      throw new Error(`Invalid or missing runtimeUrl for ${packageName}@${index.version}.`);
    }

    const temporaryDirectory = await mkdtemp(join(tmpdir(), "azure-playground-runtime-"));
    try {
      const archive = join(temporaryDirectory, "runtime.tgz");
      await writeFile(archive, Buffer.from(await (await download(runtimeUrl)).arrayBuffer()));
      const packageRoot = join(root, packageDirectory);
      await mkdir(packageRoot);
      execFileSync(
        "tar",
        [
          "-xzf",
          archive,
          "--strip-components=1",
          "-C",
          packageRoot,
          "package/package.json",
          "package/dist/generator",
        ],
        { timeout: 120_000 },
      );
      const metadata = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
      if (metadata.name !== packageName || metadata.version !== index.version) {
        throw new Error(`Runtime package metadata does not match ${packageName}@${index.version}.`);
      }
      for (const file of [
        "Microsoft.TypeSpec.Generator.dll",
        "Microsoft.TypeSpec.Generator.runtimeconfig.json",
        plugin,
      ]) {
        await access(join(packageRoot, "dist", "generator", file));
      }
      process.stdout.write(`Installed ${packageName}@${metadata.version}\n`);
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await installAzureGenerators(
    resolve(process.argv[2] ?? "/azure-generators"),
    process.env.AZURE_GENERATOR_BLOB_BASE_URL,
  );
}

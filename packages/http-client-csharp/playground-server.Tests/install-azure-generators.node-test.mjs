// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { installAzureGenerators } from "../playground-server/install-azure-generators.mjs";

const packages = [
  ["http-client-csharp", "1.2.3", "Azure.Generator.dll"],
  ["http-client-csharp-mgmt", "2.3.4", "Azure.Generator.Management.dll"],
  ["http-client-csharp-provisioning", "3.4.5", "Azure.Generator.Provisioning.dll"],
];
let root;
let server;
let base;
let responses;
let requests;
let statuses;

async function archive(packageDirectory, version, { name, omit } = {}) {
  const source = await mkdtemp(join(root, "fixture-"));
  const generator = join(source, "package", "dist", "generator");
  await mkdir(generator, { recursive: true });
  await writeFile(
    join(source, "package", "package.json"),
    JSON.stringify({ name: name ?? `@azure-typespec/${packageDirectory}`, version }),
  );
  const plugin = packages.find(([directory]) => directory === packageDirectory)[2];
  for (const file of [
    "Microsoft.TypeSpec.Generator.dll",
    "Microsoft.TypeSpec.Generator.runtimeconfig.json",
    plugin,
  ]) {
    if (file !== omit) await writeFile(join(generator, file), `${packageDirectory}@${version}`);
  }
  const tarball = join(source, "runtime.tgz");
  execFileSync("tar", ["-czf", tarball, "-C", source, "package"]);
  return readFile(tarball);
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "azure-playground-installer-test-"));
  responses = new Map();
  requests = [];
  statuses = new Map();
  server = createServer((request, response) => {
    requests.push(request.url);
    const body = responses.get(request.url);
    response.writeHead(statuses.get(request.url) ?? (body === undefined ? 404 : 200));
    response.end(body);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}/pkgs/`;
  for (const [directory, version] of packages) {
    const packagePath = `@azure-typespec/${directory}`;
    responses.set(
      `/pkgs/${packagePath}/latest.json`,
      JSON.stringify({
        version,
        imports: {},
        runtimeUrl: `${base}${packagePath}/${version}/runtime.tgz`,
      }),
    );
    responses.set(`/pkgs/${packagePath}/${version}/runtime.tgz`, await archive(directory, version));
  }
});

afterEach(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await rm(root, { recursive: true, force: true });
});

test("installs the exact indexed tarball for each independent package", async () => {
  const destination = join(root, "installed");
  await installAzureGenerators(destination, base);
  for (const [directory, version, plugin] of packages) {
    const packageRoot = join(destination, directory);
    const metadata = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    assert.equal(metadata.name, `@azure-typespec/${directory}`);
    assert.equal(metadata.version, version);
    assert.equal(
      await readFile(join(packageRoot, "dist", "generator", plugin), "utf8"),
      `${directory}@${version}`,
    );
  }
  assert.equal(requests.length, 6);
  assert.ok(requests.every((url) => url.startsWith("/pkgs/@azure-typespec/")));
});

for (const [missingDirectory] of packages) {
  test(`skips unpublished ${missingDirectory} and installs the other generators`, async (t) => {
    const warning = t.mock.method(process.stderr, "write", () => true);
    responses.delete(`/pkgs/@azure-typespec/${missingDirectory}/latest.json`);
    const destination = join(root, "installed");
    await installAzureGenerators(destination, base);
    await assert.rejects(readFile(join(destination, missingDirectory, "package.json")), {
      code: "ENOENT",
    });
    for (const [directory, version] of packages) {
      if (directory === missingDirectory) continue;
      const metadata = JSON.parse(
        await readFile(join(destination, directory, "package.json"), "utf8"),
      );
      assert.equal(metadata.version, version);
    }
    assert.equal(requests.length, 5);
    const warnings = warning.mock.calls
      .map((call) => call.arguments[0].toString())
      .filter((message) => message.startsWith("WARNING:"));
    assert.equal(warnings.length, 1);
    assert.match(
      warnings[0],
      new RegExp(`WARNING: Skipping @azure-typespec/${missingDirectory}: .* returned HTTP 404\\.`),
    );
    assert.ok(
      !requests.some(
        (url) =>
          url.startsWith(`/pkgs/@azure-typespec/${missingDirectory}/`) &&
          url.endsWith("/runtime.tgz"),
      ),
    );
  });
}

test("supports an installation with no published Azure generators", async () => {
  responses.clear();
  const destination = join(root, "installed");
  await installAzureGenerators(destination, base);
  for (const [directory] of packages) {
    await assert.rejects(readFile(join(destination, directory, "package.json")), {
      code: "ENOENT",
    });
  }
  assert.equal(requests.length, 3);
});

for (const status of [403, 429, 500]) {
  test(`fails when the index request returns HTTP ${status}`, async () => {
    statuses.set("/pkgs/@azure-typespec/http-client-csharp/latest.json", status);
    await assert.rejects(
      installAzureGenerators(join(root, "installed"), base),
      new RegExp(`HTTP ${status}`),
    );
  });
}

for (const index of [
  { version: "1.2.3" },
  { version: "../invalid", runtimeUrl: "https://example.com/runtime.tgz" },
  { version: "1.2.3", runtimeUrl: "https://example.com/runtime.tgz" },
]) {
  test(`rejects invalid index ${JSON.stringify(index)}`, async () => {
    responses.set("/pkgs/@azure-typespec/http-client-csharp/latest.json", JSON.stringify(index));
    await assert.rejects(installAzureGenerators(join(root, "installed"), base), /Invalid/);
    assert.equal(requests.length, 1);
  });
}

test("fails when the indexed runtime tarball is not published", async () => {
  responses.delete("/pkgs/@azure-typespec/http-client-csharp/1.2.3/runtime.tgz");
  await assert.rejects(installAzureGenerators(join(root, "installed"), base), /HTTP 404/);
});

test("fails when the runtime tarball is corrupt", async () => {
  responses.set(
    "/pkgs/@azure-typespec/http-client-csharp/1.2.3/runtime.tgz",
    Buffer.from("invalid"),
  );
  await assert.rejects(installAzureGenerators(join(root, "installed"), base));
});

for (const [label, version, options] of [
  ["version mismatch", "9.9.9", {}],
  ["identity mismatch", "1.2.3", { name: "@azure-typespec/http-client-csharp-mgmt" }],
  ["missing generator", "1.2.3", { omit: "Microsoft.TypeSpec.Generator.dll" }],
  [
    "missing runtime configuration",
    "1.2.3",
    { omit: "Microsoft.TypeSpec.Generator.runtimeconfig.json" },
  ],
  ["missing plugin", "1.2.3", { omit: "Azure.Generator.dll" }],
]) {
  test(`fails on ${label}`, async () => {
    responses.set(
      "/pkgs/@azure-typespec/http-client-csharp/1.2.3/runtime.tgz",
      await archive("http-client-csharp", version, options),
    );
    await assert.rejects(installAzureGenerators(join(root, "installed"), base));
  });
}

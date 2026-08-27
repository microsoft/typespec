import * as http from "http";
import type { AddressInfo } from "net";
import { afterEach, beforeEach, expect, it } from "vitest";
import {
  fetchPackageManifest,
  getNpmRegistry,
  type NpmManifest,
  type NpmPackument,
} from "../../src/package-manger/npm-registry.js";

let server: http.Server;
let registryUrl: string;
let lastRequestUrl: string | undefined;
let responseStatus: number;
const originalTypeSpecNpmRegistry = process.env["TYPESPEC_NPM_REGISTRY"];
const originalNpmConfigRegistry = process.env["NPM_CONFIG_REGISTRY"];

beforeEach(async () => {
  lastRequestUrl = undefined;
  responseStatus = 200;
  server = http.createServer((req, res) => {
    lastRequestUrl = req.url ?? "";
    res.writeHead(responseStatus, { "Content-Type": "application/json" });
    res.end(JSON.stringify(createPackument()));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  registryUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  restoreEnvironmentVariable("TYPESPEC_NPM_REGISTRY", originalTypeSpecNpmRegistry);
  restoreEnvironmentVariable("NPM_CONFIG_REGISTRY", originalNpmConfigRegistry);
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

it("uses the registry URL from TYPESPEC_NPM_REGISTRY when set", async () => {
  process.env["TYPESPEC_NPM_REGISTRY"] = registryUrl;
  const manifest = await fetchPackageManifest("test-pkg", "latest");
  expect(manifest.version).toBe("2.0.0");
  expect(lastRequestUrl).toBe("/test-pkg");
});

it("strips trailing slash from TYPESPEC_NPM_REGISTRY", async () => {
  process.env["TYPESPEC_NPM_REGISTRY"] = `${registryUrl}/`;
  const manifest = await fetchPackageManifest("test-pkg", "1.0.0");
  expect(manifest.version).toBe("1.0.0");
  expect(lastRequestUrl).toBe("/test-pkg");
});

it("resolves a package version from a semver range", async () => {
  process.env["TYPESPEC_NPM_REGISTRY"] = registryUrl;

  const manifest = await fetchPackageManifest("test-pkg", "^1.0.0");

  expect(manifest.version).toBe("1.2.0");
});

it("encodes scoped package names", async () => {
  process.env["TYPESPEC_NPM_REGISTRY"] = registryUrl;

  await fetchPackageManifest("@scope/test-pkg", "latest");

  expect(lastRequestUrl).toBe("/@scope%2Ftest-pkg");
});

it("reports a missing package version or tag", async () => {
  process.env["TYPESPEC_NPM_REGISTRY"] = registryUrl;

  await expect(fetchPackageManifest("test-pkg", "unknown")).rejects.toThrow(
    `Package "test-pkg" does not have a version or tag matching "unknown".`,
  );
});

it("reports registry request failures", async () => {
  process.env["TYPESPEC_NPM_REGISTRY"] = registryUrl;
  responseStatus = 401;

  await expect(fetchPackageManifest("test-pkg", "latest")).rejects.toThrow(
    `Request to ${registryUrl}/test-pkg failed with status 401.`,
  );
});

it("does not use package-manager-specific registry environment variables", () => {
  delete process.env["TYPESPEC_NPM_REGISTRY"];
  process.env["NPM_CONFIG_REGISTRY"] = registryUrl;

  expect(getNpmRegistry()).toBe("https://registry.npmjs.org");
});

function createPackument(): NpmPackument {
  const versions = ["1.0.0", "1.2.0", "2.0.0"].map(createManifest);
  return {
    name: "test-pkg",
    "dist-tags": {
      latest: "2.0.0",
      next: "1.2.0",
    },
    versions: Object.fromEntries(versions.map((manifest) => [manifest.version, manifest])),
  };
}

function createManifest(version: string): NpmManifest {
  return {
    name: "test-pkg",
    version,
    dependencies: {},
    optionalDependencies: {},
    devDependencies: {},
    peerDependencies: {},
    bundleDependencies: false,
    dist: { shasum: "abc", tarball: `http://example.com/test-${version}.tgz` },
    bin: null,
    _shrinkwrap: null,
  };
}

function restoreEnvironmentVariable(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

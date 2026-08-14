import { mkdtemp, rm, writeFile } from "fs/promises";
import * as http from "http";
import type { AddressInfo } from "net";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { loadNpmRegistryConfig } from "../../src/package-manger/npm-registry-config.js";
import {
  fetchPackageManifest,
  getNpmRequestHeaders,
} from "../../src/package-manger/npm-registry.js";

let server: http.Server;
let registryUrl: string;
let lastRequestUrl: string | undefined;
let lastAuthorization: string | undefined;
let tempDirectory: string | undefined;
const originalHome = process.env["HOME"];
const originalUserProfile = process.env["USERPROFILE"];

beforeEach(async () => {
  lastRequestUrl = undefined;
  lastAuthorization = undefined;
  server = http.createServer((req, res) => {
    lastRequestUrl = req.url ?? "";
    lastAuthorization = req.headers.authorization;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        name: "test-pkg",
        version: "1.0.0",
        dependencies: {},
        optionalDependencies: {},
        devDependencies: {},
        peerDependencies: {},
        bundleDependencies: false,
        dist: { shasum: "abc", tarball: "http://example.com/test.tgz" },
        bin: null,
        _shrinkwrap: null,
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  registryUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  delete process.env["TYPESPEC_NPM_REGISTRY"];
  delete process.env["NPM_CONFIG_USERCONFIG"];
  restoreEnvironmentVariable("HOME", originalHome);
  restoreEnvironmentVariable("USERPROFILE", originalUserProfile);
  if (tempDirectory !== undefined) {
    await rm(tempDirectory, { recursive: true, force: true });
    tempDirectory = undefined;
  }
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

it("uses the registry URL from TYPESPEC_NPM_REGISTRY when set", async () => {
  process.env["TYPESPEC_NPM_REGISTRY"] = registryUrl;
  const manifest = await fetchPackageManifest("test-pkg", "latest");
  expect(manifest.name).toBe("test-pkg");
  expect(lastRequestUrl).toBe("/test-pkg/latest");
});

it("strips trailing slash from TYPESPEC_NPM_REGISTRY", async () => {
  process.env["TYPESPEC_NPM_REGISTRY"] = `${registryUrl}/`;
  const manifest = await fetchPackageManifest("test-pkg", "1.0.0");
  expect(manifest.name).toBe("test-pkg");
  expect(lastRequestUrl).toBe("/test-pkg/1.0.0");
});

it("loads registry and bearer authentication from NPM_CONFIG_USERCONFIG", async () => {
  const npmrcPath = await writeNpmrc(`
registry=${registryUrl}/
//${new URL(registryUrl).host}/:_authToken=test-token
`);
  process.env["NPM_CONFIG_USERCONFIG"] = npmrcPath;

  const config = await loadNpmRegistryConfig();
  const manifest = await fetchPackageManifest("test-pkg", "latest", config);

  expect(manifest.name).toBe("test-pkg");
  expect(lastAuthorization).toBe("Bearer test-token");
});

it("loads authentication from the default user npmrc", async () => {
  tempDirectory ??= await mkdtemp(join(tmpdir(), "typespec-npmrc-test-"));
  process.env["HOME"] = tempDirectory;
  process.env["USERPROFILE"] = tempDirectory;
  await writeFile(
    join(tempDirectory, ".npmrc"),
    `registry=${registryUrl}/\n//${new URL(registryUrl).host}/:_authToken=test-token\n`,
  );

  const config = await loadNpmRegistryConfig();
  await fetchPackageManifest("test-pkg", "latest", config);

  expect(lastAuthorization).toBe("Bearer test-token");
});

it("loads Azure DevOps basic authentication from NPM_CONFIG_USERCONFIG", async () => {
  const password = Buffer.from("test-password").toString("base64");
  const npmrcPath = await writeNpmrc(`
registry=${registryUrl}/
//${new URL(registryUrl).host}/:username=test-user
//${new URL(registryUrl).host}/:_password=${password}
`);
  process.env["NPM_CONFIG_USERCONFIG"] = npmrcPath;

  const config = await loadNpmRegistryConfig();
  await fetchPackageManifest("test-pkg", "latest", config);

  expect(lastAuthorization).toBe(
    `Basic ${Buffer.from("test-user:test-password").toString("base64")}`,
  );
});

it("does not send authentication outside its configured registry scope", async () => {
  const config = {
    authentication: [{ scope: "//registry.example.com/private/", authorization: "Bearer secret" }],
  };

  expect(getNpmRequestHeaders("https://registry.example.com/private/test", config)).toEqual({
    Authorization: "Bearer secret",
  });
  expect(getNpmRequestHeaders("https://registry.example.com/public/test", config)).toBeUndefined();
  expect(getNpmRequestHeaders("https://example.com/package.tgz", config)).toBeUndefined();
});

async function writeNpmrc(contents: string): Promise<string> {
  tempDirectory ??= await mkdtemp(join(tmpdir(), "typespec-npmrc-test-"));
  const npmrcPath = join(tempDirectory, ".npmrc");
  await writeFile(npmrcPath, contents);
  return npmrcPath;
}

function restoreEnvironmentVariable(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

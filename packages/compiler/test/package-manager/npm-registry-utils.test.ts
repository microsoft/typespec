import * as http from "http";
import type { AddressInfo } from "net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fetchPackageManifest } from "../../src/package-manger/npm-registry-utils.js";

describe("TYPESPEC_NPM_REGISTRY", () => {
  let server: http.Server;
  let registryUrl: string;
  let lastRequestUrl: string | undefined;

  beforeEach(async () => {
    lastRequestUrl = undefined;
    server = http.createServer((req, res) => {
      lastRequestUrl = req.url ?? "";
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
});

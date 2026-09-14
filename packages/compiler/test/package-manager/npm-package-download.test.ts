import * as http from "http";
import type { AddressInfo } from "net";
import { afterEach, expect, it, vi } from "vitest";
import { downloadAndExtractPackage } from "../../src/package-manger/npm-package-download.js";
import type { NpmPackageVersion } from "../../src/package-manger/npm-registry.js";

const tarballUrl = "https://registry.example.com/npm.tgz";
const manifest: NpmPackageVersion = {
  name: "npm",
  version: "1.0.0",
  dist: {
    shasum: "abc",
    tarball: tarballUrl,
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

it("reports tarball network failures", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));

  await expect(downloadAndExtractPackage(manifest, "/tmp/test")).rejects.toThrow(
    `Request to ${tarballUrl} failed: network unavailable`,
  );
});

it("reports unsuccessful tarball responses", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

  await expect(downloadAndExtractPackage(manifest, "/tmp/test")).rejects.toThrow(
    `Request to ${tarballUrl} failed with status 503.`,
  );
});

it("reports empty tarball responses", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body: null }));

  await expect(downloadAndExtractPackage(manifest, "/tmp/test")).rejects.toThrow(
    `Request to ${tarballUrl} returned an empty response.`,
  );
});

it("reports invalid tarball streams", async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(200);
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${port}/npm.tgz`;
  const invalidManifest: NpmPackageVersion = {
    ...manifest,
    dist: { ...manifest.dist, tarball: url },
  };

  try {
    await expect(downloadAndExtractPackage(invalidManifest, "/tmp")).rejects.toThrow(
      `Failed to extract package from ${url}`,
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

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

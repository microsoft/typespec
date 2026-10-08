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
  vi.unstubAllEnvs();
});

it("authenticates tarball downloads from the configured registry", async () => {
  vi.stubEnv("TYPESPEC_NPM_REGISTRY", "https://registry.example.com/");
  vi.stubEnv("TYPESPEC_NPM_REGISTRY_TOKEN", "test-token");
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
  vi.stubGlobal("fetch", fetch);

  await expect(downloadAndExtractPackage(manifest, "/tmp/test")).rejects.toThrow(
    "failed with status 503",
  );

  expect(fetch).toHaveBeenCalledWith(tarballUrl, {
    headers: { Authorization: "Bearer test-token" },
    redirect: "manual",
  });
});

it.each([
  ["a different host", "https://other.example.com/npm.tgz"],
  ["a different port", "https://registry.example.com:8443/feed/npm.tgz"],
  ["a different protocol", "http://registry.example.com/feed/npm.tgz"],
  ["a different feed", "https://registry.example.com/other-feed/npm.tgz"],
  ["a feed with a shared path prefix", "https://registry.example.com/feed-other/npm.tgz"],
])("does not send the registry token to %s", async (_description, url) => {
  vi.stubEnv("TYPESPEC_NPM_REGISTRY", "https://registry.example.com/feed/");
  vi.stubEnv("TYPESPEC_NPM_REGISTRY_TOKEN", "test-token");
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
  vi.stubGlobal("fetch", fetch);

  await expect(
    downloadAndExtractPackage(
      { ...manifest, dist: { ...manifest.dist, tarball: url } },
      "/tmp/test",
    ),
  ).rejects.toThrow("failed with status 503");

  expect(fetch).toHaveBeenCalledWith(url, { headers: {}, redirect: "manual" });
});

it("authenticates tarball downloads within the configured registry path", async () => {
  vi.stubEnv("TYPESPEC_NPM_REGISTRY", "https://registry.example.com/feed");
  vi.stubEnv("TYPESPEC_NPM_REGISTRY_TOKEN", "test-token");
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
  vi.stubGlobal("fetch", fetch);
  const url = "https://registry.example.com/feed/npm/-/npm.tgz";

  await expect(
    downloadAndExtractPackage(
      { ...manifest, dist: { ...manifest.dist, tarball: url } },
      "/tmp/test",
    ),
  ).rejects.toThrow("failed with status 503");

  expect(fetch).toHaveBeenCalledWith(url, {
    headers: { Authorization: "Bearer test-token" },
    redirect: "manual",
  });
});

it.each([
  ["/feed/redirected/npm.tgz", "Bearer test-token"],
  ["/other-feed/npm.tgz", undefined],
])("scopes registry credentials when redirected to %s", async (location, expectedAuthorization) => {
  const authorizationHeaders: (string | undefined)[] = [];
  const server = http.createServer((req, res) => {
    authorizationHeaders.push(req.headers.authorization);
    if (req.url === "/feed/npm.tgz") {
      res.writeHead(302, { Location: location });
    } else {
      res.writeHead(503);
    }
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const registryUrl = `http://127.0.0.1:${port}/feed`;
  const url = `${registryUrl}/npm.tgz`;
  vi.stubEnv("TYPESPEC_NPM_REGISTRY", registryUrl);
  vi.stubEnv("TYPESPEC_NPM_REGISTRY_TOKEN", "test-token");

  try {
    await expect(
      downloadAndExtractPackage(
        { ...manifest, dist: { ...manifest.dist, tarball: url } },
        "/tmp/test",
      ),
    ).rejects.toThrow("failed with status 503");

    expect(authorizationHeaders).toEqual(["Bearer test-token", expectedAuthorization]);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

it("does not forward the registry token to a different origin after a redirect", async () => {
  vi.stubEnv("TYPESPEC_NPM_REGISTRY", "https://registry.example.com/");
  vi.stubEnv("TYPESPEC_NPM_REGISTRY_TOKEN", "test-token");
  const url = "https://storage.example.com/npm.tgz";
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: url } }))
    .mockResolvedValueOnce(new Response(null, { status: 503 }));
  vi.stubGlobal("fetch", fetch);

  await expect(downloadAndExtractPackage(manifest, "/tmp/test")).rejects.toThrow(
    "failed with status 503",
  );

  expect(fetch).toHaveBeenNthCalledWith(1, tarballUrl, {
    headers: { Authorization: "Bearer test-token" },
    redirect: "manual",
  });
  expect(fetch).toHaveBeenNthCalledWith(2, url, { headers: {}, redirect: "manual" });
});

it("reports redirect loops instead of repeatedly downloading", async () => {
  vi.stubEnv("TYPESPEC_NPM_REGISTRY", "https://registry.example.com/");
  vi.stubEnv("TYPESPEC_NPM_REGISTRY_TOKEN", "test-token");
  const fetch = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response(null, { status: 302, headers: { Location: tarballUrl } })),
    );
  vi.stubGlobal("fetch", fetch);

  await expect(downloadAndExtractPackage(manifest, "/tmp/test")).rejects.toThrow(
    "exceeded 20 redirects",
  );

  expect(fetch).toHaveBeenCalledTimes(21);
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

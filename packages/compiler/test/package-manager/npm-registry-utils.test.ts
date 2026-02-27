import * as childProcess from "child_process";
import * as http from "http";
import * as https from "https";
import type { AddressInfo } from "net";
import { join } from "path";
import { tmpdir } from "os";
import { writeFileSync, unlinkSync } from "fs";
import { Readable } from "stream";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  makeRequest,
  NpmFetchConfig,
  parseNpmConfig,
  readNpmConfig,
  resetNpmConfigCache,
} from "../../src/package-manger/npm-registry-utils.js";

// Mock child_process so readNpmConfig tests can control execSync output without
// spawning a real npm process. vi.mock is hoisted by vitest above imports.
vi.mock("child_process", async (importOriginal) => {
  const mod = await importOriginal<typeof childProcess>();
  return { ...mod, execSync: vi.fn() };
});

// Module-level variable used to intercept https.request calls in TLS option tests.
// When set to a function, calls to https.request are captured; otherwise the real
// implementation is used transparently.
let captureHttpsRequest:
  | ((url: string | URL, opts: https.RequestOptions) => void)
  | undefined = undefined;

vi.mock("https", async (importOriginal) => {
  const mod = await importOriginal<typeof https>();
  return {
    ...mod,
    request: (url: any, opts: any, cb?: any) => {
      captureHttpsRequest?.(url, opts);
      return (mod.request as any)(url, opts, cb);
    },
  };
});

// ---------------------------------------------------------------------------
// parseNpmConfig – pure parsing, no execSync/readFileSync mocking needed
// ---------------------------------------------------------------------------
describe("parseNpmConfig", () => {
  it("reads registry and strict-ssl", () => {
    const config = parseNpmConfig({
      registry: "https://my-registry.example.com/",
      "strict-ssl": false,
    });
    expect(config.registry).toBe("https://my-registry.example.com");
    expect(config.strictSsl).toBe(false);
  });

  it("defaults registry to npmjs.org and strict-ssl to true when not set", () => {
    const config = parseNpmConfig({});
    expect(config.registry).toBe("https://registry.npmjs.org");
    expect(config.strictSsl).toBe(true);
  });

  it("reads proxy and https-proxy", () => {
    const config = parseNpmConfig({
      proxy: "http://proxy.example.com:8080",
      "https-proxy": "http://https-proxy.example.com:8080",
    });
    expect(config.proxy).toBe("http://proxy.example.com:8080");
    expect(config.httpsProxy).toBe("http://https-proxy.example.com:8080");
  });

  it("falls back httpsProxy to proxy when https-proxy is not set", () => {
    const config = parseNpmConfig({ proxy: "http://proxy.example.com:8080" });
    expect(config.proxy).toBe("http://proxy.example.com:8080");
    expect(config.httpsProxy).toBe("http://proxy.example.com:8080");
  });

  it("reads noproxy", () => {
    const config = parseNpmConfig({ noproxy: "localhost,127.0.0.1,.internal.corp" });
    expect(config.noProxy).toBe("localhost,127.0.0.1,.internal.corp");
  });

  it("reads ca, cert, and key", () => {
    const config = parseNpmConfig({
      ca: "-----BEGIN CERTIFICATE-----\ntest-ca\n-----END CERTIFICATE-----",
      cert: "-----BEGIN CERTIFICATE-----\ntest-cert\n-----END CERTIFICATE-----",
      key: "-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----",
    });
    expect(config.ca).toBe("-----BEGIN CERTIFICATE-----\ntest-ca\n-----END CERTIFICATE-----");
    expect(config.cert).toBe("-----BEGIN CERTIFICATE-----\ntest-cert\n-----END CERTIFICATE-----");
    expect(config.key).toBe("-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----");
  });

  it("reads ca as an array when multiple certs are provided", () => {
    const config = parseNpmConfig({ ca: ["cert1", "cert2"] });
    expect(Array.isArray(config.ca)).toBe(true);
    expect(config.ca).toHaveLength(2);
  });

  it("reads CA cert content from cafile when ca is not set", () => {
    const tmpFile = join(tmpdir(), `typespec-test-ca-${Date.now()}.pem`);
    writeFileSync(tmpFile, "-----BEGIN CERTIFICATE-----\nfile-ca\n-----END CERTIFICATE-----");
    try {
      const config = parseNpmConfig({ cafile: tmpFile });
      expect(config.ca).toBe("-----BEGIN CERTIFICATE-----\nfile-ca\n-----END CERTIFICATE-----");
    } finally {
      unlinkSync(tmpFile);
    }
  });

  it("prefers explicit ca over cafile", () => {
    const readFileCalled = { value: false };
    const config = parseNpmConfig(
      { ca: "explicit-ca", cafile: "/nonexistent/ca.pem" },
      () => {
        readFileCalled.value = true;
        return "file-ca";
      },
    );
    expect(config.ca).toBe("explicit-ca");
    expect(readFileCalled.value).toBe(false);
  });

  it("silently ignores cafile read errors", () => {
    const config = parseNpmConfig(
      { cafile: "/nonexistent/ca.pem" },
      () => {
        throw new Error("ENOENT: no such file");
      },
    );
    expect(config.ca).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// readNpmConfig – caching and execSync integration (uses vi.mock above)
// ---------------------------------------------------------------------------
describe("readNpmConfig", () => {
  beforeEach(() => {
    resetNpmConfigCache();
    vi.mocked(childProcess.execSync).mockReset();
  });

  afterEach(() => {
    resetNpmConfigCache();
  });

  it("passes execSync output through parseNpmConfig", () => {
    vi.mocked(childProcess.execSync).mockReturnValue(
      JSON.stringify({
        registry: "https://corp-registry.example.com",
        "strict-ssl": false,
        proxy: "http://corp-proxy:3128",
        noproxy: "localhost",
        ca: "corp-ca-cert",
      }),
    );

    const config = readNpmConfig();
    expect(config.registry).toBe("https://corp-registry.example.com");
    expect(config.strictSsl).toBe(false);
    expect(config.proxy).toBe("http://corp-proxy:3128");
    expect(config.noProxy).toBe("localhost");
    expect(config.ca).toBe("corp-ca-cert");
  });

  it("falls back to defaults when npm is unavailable", () => {
    vi.mocked(childProcess.execSync).mockImplementation(() => {
      throw new Error("npm not found");
    });

    const config = readNpmConfig();
    expect(config.registry).toBe("https://registry.npmjs.org");
    expect(config.strictSsl).toBe(true);
    expect(config.proxy).toBeUndefined();
    expect(config.ca).toBeUndefined();
  });

  it("caches the result across multiple calls", () => {
    vi.mocked(childProcess.execSync).mockReturnValue(
      JSON.stringify({ registry: "https://example.com" }),
    );

    readNpmConfig();
    readNpmConfig();
    readNpmConfig();

    expect(vi.mocked(childProcess.execSync)).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// makeRequest – integration tests against real local servers
// ---------------------------------------------------------------------------
describe("makeRequest", () => {
  afterEach(() => {
    captureHttpsRequest = undefined;
    vi.restoreAllMocks();
  });

  it("makes a successful HTTP GET request", async () => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;

    try {
      const config: NpmFetchConfig = { registry: "http://127.0.0.1", strictSsl: true };
      const result = await makeRequest(`http://127.0.0.1:${port}/test`, config);
      expect(JSON.parse(result.toString("utf8"))).toEqual({ ok: true });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("follows HTTP redirects", async () => {
    let requestCount = 0;
    let serverPort: number;
    const server = http.createServer((_req, res) => {
      requestCount++;
      if (requestCount === 1) {
        res.writeHead(302, { Location: `http://127.0.0.1:${serverPort}/final` });
        res.end();
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({ redirected: true }));
      }
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    serverPort = (server.address() as AddressInfo).port;

    try {
      const config: NpmFetchConfig = { registry: "http://127.0.0.1", strictSsl: true };
      const result = await makeRequest(`http://127.0.0.1:${serverPort}/start`, config);
      expect(JSON.parse(result.toString("utf8"))).toEqual({ redirected: true });
      expect(requestCount).toBe(2);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("rejects with an error when redirect limit is exceeded", async () => {
    let loopPort: number;
    const server = http.createServer((_req, res) => {
      res.writeHead(302, { Location: `http://127.0.0.1:${loopPort}/redirect` });
      res.end();
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    loopPort = (server.address() as AddressInfo).port;

    try {
      const config: NpmFetchConfig = { registry: "http://127.0.0.1", strictSsl: true };
      await expect(
        makeRequest(`http://127.0.0.1:${loopPort}/start`, config, 2),
      ).rejects.toThrow("Too many redirects");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("bypasses proxy for hosts in the noProxy list", async () => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200);
      res.end(JSON.stringify({ direct: true }));
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;

    try {
      // The proxy URL points to a non-existent server — connection should bypass it
      const config: NpmFetchConfig = {
        registry: `http://127.0.0.1:${port}`,
        strictSsl: true,
        proxy: "http://nonexistent-proxy.invalid:9999",
        noProxy: "127.0.0.1,localhost",
      };
      const result = await makeRequest(`http://127.0.0.1:${port}/test`, config);
      expect(JSON.parse(result.toString("utf8"))).toEqual({ direct: true });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("passes rejectUnauthorized from strictSsl to https.request", async () => {
    const capturedOptions: https.RequestOptions[] = [];
    captureHttpsRequest = (_url, opts) => capturedOptions.push(opts);

    // This request will fail (no real server), but we only care that the options
    // were built correctly before the connection attempt.
    const config: NpmFetchConfig = {
      registry: "https://unreachable.invalid",
      strictSsl: false,
      ca: "test-ca",
      cert: "test-cert",
      key: "test-key",
    };

    // The request will fail connecting but we should have captured the options
    await makeRequest("https://unreachable.invalid/test", config).catch(() => {});

    expect(capturedOptions).toHaveLength(1);
    expect(capturedOptions[0]).toMatchObject({
      rejectUnauthorized: false,
      ca: "test-ca",
      cert: "test-cert",
      key: "test-key",
    });
  });

  it("omits ca/cert/key from https.request options when not configured", async () => {
    const capturedOptions: https.RequestOptions[] = [];
    captureHttpsRequest = (_url, opts) => capturedOptions.push(opts);

    const config: NpmFetchConfig = {
      registry: "https://unreachable.invalid",
      strictSsl: true,
    };

    await makeRequest("https://unreachable.invalid/test", config).catch(() => {});

    expect(capturedOptions).toHaveLength(1);
    expect(capturedOptions[0].rejectUnauthorized).toBe(true);
    expect(capturedOptions[0]).not.toHaveProperty("ca");
    expect(capturedOptions[0]).not.toHaveProperty("cert");
    expect(capturedOptions[0]).not.toHaveProperty("key");
  });
});

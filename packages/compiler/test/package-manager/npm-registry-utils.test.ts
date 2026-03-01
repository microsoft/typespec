import * as childProcess from "child_process";
import { unlinkSync, writeFileSync } from "fs";
import * as http from "http";
import type { AddressInfo } from "net";
import { tmpdir } from "os";
import { join } from "path";
import { Agent, ProxyAgent } from "undici";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildFetchDispatcher,
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
    const config = parseNpmConfig({ ca: "explicit-ca", cafile: "/nonexistent/ca.pem" }, () => {
      readFileCalled.value = true;
      return "file-ca";
    });
    expect(config.ca).toBe("explicit-ca");
    expect(readFileCalled.value).toBe(false);
  });

  it("silently ignores cafile read errors", () => {
    const config = parseNpmConfig({ cafile: "/nonexistent/ca.pem" }, () => {
      throw new Error("ENOENT: no such file");
    });
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
// buildFetchDispatcher – verifies correct undici dispatcher is chosen
// ---------------------------------------------------------------------------
describe("buildFetchDispatcher", () => {
  it("returns an Agent for direct HTTPS with TLS settings", () => {
    const config: NpmFetchConfig = {
      registry: "https://registry.npmjs.org",
      strictSsl: false,
      ca: "test-ca",
      cert: "test-cert",
      key: "test-key",
    };
    const dispatcher = buildFetchDispatcher("https://registry.npmjs.org/pkg/latest", config);
    expect(dispatcher).toBeInstanceOf(Agent);
  });

  it("returns a ProxyAgent when a proxy is configured for HTTPS", () => {
    const config: NpmFetchConfig = {
      registry: "https://registry.npmjs.org",
      strictSsl: true,
      httpsProxy: "http://proxy.example.com:8080",
    };
    const dispatcher = buildFetchDispatcher("https://registry.npmjs.org/pkg/latest", config);
    expect(dispatcher).toBeInstanceOf(ProxyAgent);
  });

  it("uses http proxy (not httpsProxy) for HTTP URLs", () => {
    const config: NpmFetchConfig = {
      registry: "http://internal.registry.example.com",
      strictSsl: true,
      proxy: "http://proxy.example.com:8080",
      httpsProxy: "http://https-proxy.example.com:8080",
    };
    // HTTP URL should use `proxy`, not `httpsProxy`
    const dispatcher = buildFetchDispatcher("http://internal.registry.example.com/pkg", config);
    expect(dispatcher).toBeInstanceOf(ProxyAgent);
  });

  it("returns an Agent when the host is in the noProxy list", () => {
    const config: NpmFetchConfig = {
      registry: "https://internal.corp",
      strictSsl: true,
      httpsProxy: "http://proxy.example.com:8080",
      noProxy: "localhost,internal.corp,127.0.0.1",
    };
    const dispatcher = buildFetchDispatcher("https://internal.corp/pkg/latest", config);
    expect(dispatcher).toBeInstanceOf(Agent);
  });

  it("returns a ProxyAgent when the host is NOT in the noProxy list", () => {
    const config: NpmFetchConfig = {
      registry: "https://registry.npmjs.org",
      strictSsl: true,
      httpsProxy: "http://proxy.example.com:8080",
      noProxy: "localhost,internal.corp",
    };
    const dispatcher = buildFetchDispatcher("https://registry.npmjs.org/pkg/latest", config);
    expect(dispatcher).toBeInstanceOf(ProxyAgent);
  });

  it("returns an Agent when no proxy is configured", () => {
    const config: NpmFetchConfig = {
      registry: "https://registry.npmjs.org",
      strictSsl: true,
    };
    const dispatcher = buildFetchDispatcher("https://registry.npmjs.org/pkg/latest", config);
    expect(dispatcher).toBeInstanceOf(Agent);
  });

  it("makes a successful GET request via the dispatcher against a real local server", async () => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;

    try {
      const config: NpmFetchConfig = { registry: `http://127.0.0.1:${port}`, strictSsl: true };
      const url = `http://127.0.0.1:${port}/test`;
      const { fetch: undiciFetch } = await import("undici");
      const response = await undiciFetch(url, { dispatcher: buildFetchDispatcher(url, config) });
      expect(await response.json()).toEqual({ ok: true });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

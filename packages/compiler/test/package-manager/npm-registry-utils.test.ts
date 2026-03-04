import { spawn } from "child_process";
import { mkdtemp, rm, writeFile } from "fs/promises";
import * as http from "http";
import { createServer } from "http";
import { connect } from "net";
import type { AddressInfo } from "net";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fetchPackageManifest } from "../../src/package-manger/npm-registry-utils.js";

const nodeVersion = parseInt(process.versions.node.split(".")[0], 10);

// Minimal npm package manifest shape
const mockManifest = {
  name: "typescript",
  version: "5.0.0",
  dependencies: {},
  optionalDependencies: {},
  devDependencies: {},
  peerDependencies: {},
  bundleDependencies: false,
  dist: { shasum: "abc123", tarball: "http://example.com/ts.tgz" },
  bin: null,
  _shrinkwrap: null,
};

interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function execAsync(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ["ignore", "pipe", "pipe"] });
    child.on("error", reject);
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout?.on("data", (d: Buffer) => stdout.push(d));
    child.stderr?.on("data", (d: Buffer) => stderr.push(d));
    child.on("exit", (code) =>
      resolve({
        exitCode: code ?? -1,
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
      }),
    );
  });
}

// The test uses a non-existent hostname for the registry URL so that fetch can only
// succeed when HTTP_PROXY is respected. The proxy's CONNECT handler intercepts the
// connection and tunnels it to a local mock npm registry instead of the real host.
// This makes the test fail when --use-env-proxy is absent (DNS error) and pass only
// when the proxy is properly configured (Node.js 24+).
describe.runIf(nodeVersion >= 22)("npm-registry-utils: HTTP proxy support (Node >= 24)", () => {
  let mockRegistryServer: ReturnType<typeof createServer>;
  let proxyServer: ReturnType<typeof createServer>;
  let mockRegistryPort: number;
  let proxyPort: number;
  let tmpDir: string;
  let proxyWasUsed: boolean;

  beforeEach(async () => {
    proxyWasUsed = false;
    tmpDir = await mkdtemp(join(tmpdir(), "typespec-proxy-test-"));

    // Local mock npm registry serving a minimal package manifest
    mockRegistryServer = createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(mockManifest));
    });
    await new Promise<void>((resolve) =>
      mockRegistryServer.listen(0, "127.0.0.1", resolve as () => void),
    );
    mockRegistryPort = (mockRegistryServer.address() as { port: number }).port;

    // HTTP proxy: intercepts CONNECT tunneling (used by undici even for plain HTTP targets)
    // and redirects ALL connections to the local mock registry instead.
    proxyServer = createServer();
    proxyServer.on("connect", (req, clientSocket, head) => {
      proxyWasUsed = true;
      // Redirect the tunnel to our mock registry regardless of the requested host
      const serverSocket = connect(mockRegistryPort, "127.0.0.1", () => {
        clientSocket.write(
          "HTTP/1.1 200 Connection Established\r\nProxy-Agent: test-proxy\r\n\r\n",
        );
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
      });
      serverSocket.on("error", () => clientSocket.destroy());
      clientSocket.on("error", () => serverSocket.destroy());
    });
    await new Promise<void>((resolve) => proxyServer.listen(0, "127.0.0.1", resolve as () => void));
    proxyPort = (proxyServer.address() as { port: number }).port;
  });

  afterEach(async () => {
    proxyServer.closeAllConnections();
    mockRegistryServer.closeAllConnections();
    await Promise.all([
      new Promise<void>((resolve) => proxyServer.close(() => resolve())),
      new Promise<void>((resolve) => mockRegistryServer.close(() => resolve())),
    ]);
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("fetch routes through HTTP proxy when --use-env-proxy and HTTP_PROXY are set", async () => {
    const scriptPath = join(tmpDir, "test-fetch.mjs");
    const proxyUrl = `http://127.0.0.1:${proxyPort}`;

    // The script fetches from a non-existent hostname. Without a proxy that intercepts
    // and redirects the connection, this will fail with a DNS error.
    await writeFile(
      scriptPath,
      `
const res = await fetch("http://nonexistent-npm-registry.invalid/typescript/latest");
const data = await res.json();
console.log(data.name);
process.exit(0);
`,
    );

    const result = await execAsync(process.execPath, ["--use-env-proxy", scriptPath], {
      ...process.env,
      HTTP_PROXY: proxyUrl,
      http_proxy: proxyUrl,
      // Ensure no exclusions bypass the proxy
      NO_PROXY: "",
      no_proxy: "",
    });

    expect(result.exitCode, `Script failed:\n${result.stderr}`).toBe(0);
    expect(result.stdout.trim()).toBe("typescript");
    expect(proxyWasUsed, "Expected the fetch request to be routed through the HTTP proxy").toBe(
      true,
    );
  });
});

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

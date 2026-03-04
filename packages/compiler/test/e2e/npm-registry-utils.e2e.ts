import { spawn } from "child_process";
import { createServer, request as httpRequest } from "http";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { connect } from "net";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findTestPackageRoot } from "../../src/testing/test-utils.js";

const pkgRoot = await findTestPackageRoot(import.meta.url);
const nodeVersion = parseInt(process.versions.node.split(".")[0], 10);

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

describe.runIf(nodeVersion >= 24)(
  "npm-registry-utils: HTTP proxy support (Node >= 24 with --use-env-proxy)",
  () => {
    let proxyServer: ReturnType<typeof createServer>;
    let mockRegistryServer: ReturnType<typeof createServer>;
    let proxyPort: number;
    let mockRegistryPort: number;
    let tmpDir: string;
    let proxyWasUsed: boolean;

    beforeEach(async () => {
      proxyWasUsed = false;
      tmpDir = await mkdtemp(join(tmpdir(), "typespec-proxy-test-"));

      // Create mock npm registry that returns a minimal package manifest
      mockRegistryServer = createServer((_req, res) => {
        const manifest = {
          name: "typescript",
          version: "5.0.0",
          dependencies: {},
          optionalDependencies: {},
          devDependencies: {},
          peerDependencies: {},
          bundleDependencies: false,
          dist: {
            shasum: "abc123",
            tarball: "https://example.com/typescript-5.0.0.tgz",
          },
          bin: null,
          _shrinkwrap: null,
        };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(manifest));
      });
      await new Promise<void>((resolve) =>
        mockRegistryServer.listen(0, "127.0.0.1", resolve as () => void),
      );
      mockRegistryPort = (mockRegistryServer.address() as { port: number }).port;

      // Create a simple HTTP proxy that handles both regular HTTP and HTTPS CONNECT requests
      proxyServer = createServer();

      // Handle regular HTTP requests (non-CONNECT)
      proxyServer.on("request", (req, res) => {
        proxyWasUsed = true;
        const targetUrl = new URL(req.url!);
        const proxyReq = httpRequest(
          {
            hostname: targetUrl.hostname,
            port: Number(targetUrl.port) || 80,
            path: targetUrl.pathname + targetUrl.search,
            method: req.method,
            headers: req.headers,
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode!, proxyRes.headers);
            proxyRes.pipe(res);
          },
        );
        req.pipe(proxyReq);
        proxyReq.on("error", () => {
          res.writeHead(502);
          res.end("Bad Gateway");
        });
      });

      // Handle CONNECT requests (for HTTPS tunneling)
      proxyServer.on("connect", (req, clientSocket, head) => {
        proxyWasUsed = true;
        const [hostname, portStr] = req.url!.split(":");
        const serverSocket = connect(Number(portStr) || 443, hostname, () => {
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

      await new Promise<void>((resolve) =>
        proxyServer.listen(0, "127.0.0.1", resolve as () => void),
      );
      proxyPort = (proxyServer.address() as { port: number }).port;
    });

    afterEach(async () => {
      await new Promise<void>((resolve) => mockRegistryServer.close(() => resolve()));
      await new Promise<void>((resolve) => proxyServer.close(() => resolve()));
      await rm(tmpDir, { recursive: true, force: true });
    });

    it("fetchPackageManifest routes HTTP requests through the proxy when HTTP_PROXY is set", async () => {
      // Write a small script that uses fetchPackageManifest from the built package
      const utilsPath = join(pkgRoot, "dist/src/package-manger/npm-registry-utils.js");
      const scriptPath = join(tmpDir, "test-fetch.mjs");

      const mockRegistryUrl = `http://127.0.0.1:${mockRegistryPort}`;
      const proxyUrl = `http://127.0.0.1:${proxyPort}`;

      await writeFile(
        scriptPath,
        `import { fetchPackageManifest } from ${JSON.stringify(utilsPath)};
const manifest = await fetchPackageManifest("typescript", "latest");
console.log(manifest.name);
`,
      );

      const result = await execAsync(process.execPath, ["--use-env-proxy", scriptPath], {
        ...process.env,
        TYPESPEC_NPM_REGISTRY_URL: mockRegistryUrl,
        HTTP_PROXY: proxyUrl,
        http_proxy: proxyUrl,
        // Ensure 127.0.0.1 is not excluded from proxying
        NO_PROXY: "",
        no_proxy: "",
      });

      expect(result.exitCode, `Script failed:\n${result.stderr}`).toBe(0);
      expect(result.stdout.trim()).toBe("typescript");
      expect(proxyWasUsed, "Expected the fetch request to be routed through the HTTP proxy").toBe(
        true,
      );
    });
  },
);

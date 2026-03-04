import { spawn } from "child_process";
import { createServer } from "http";
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

describe.runIf(nodeVersion >= 22)("HTTP proxy support (Node >= 24)", () => {
  let proxyServer: ReturnType<typeof createServer>;
  let proxyPort: number;
  let tmpDir: string;
  let proxyWasUsed: boolean;

  beforeEach(async () => {
    proxyWasUsed = false;
    tmpDir = await mkdtemp(join(tmpdir(), "typespec-proxy-test-"));

    // Create a simple HTTP proxy that handles HTTPS CONNECT tunneling
    proxyServer = createServer();

    // Handle CONNECT requests (used for HTTPS tunneling)
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
    await new Promise<void>((resolve) => proxyServer.close(() => resolve()));
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("fetchPackageManifest routes HTTPS requests through the proxy when HTTPS_PROXY is set", async () => {
    // Write a small script that uses fetchPackageManifest from the built package
    const utilsPath = join(pkgRoot, "dist/src/package-manger/npm-registry-utils.js");
    const scriptPath = join(tmpDir, "test-fetch.mjs");

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
      HTTPS_PROXY: proxyUrl,
      https_proxy: proxyUrl,
    });

    expect(result.exitCode, `Script failed:\n${result.stderr}`).toBe(0);
    expect(result.stdout.trim()).toBe("typescript");
    expect(proxyWasUsed, "Expected the fetch request to be routed through the HTTPS proxy").toBe(
      true,
    );
  });
});

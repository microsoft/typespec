import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { pathToFileURL } from "url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NodeSystemHost } from "../../../src/core/node-system-host.js";
import type { runInSandbox as RunInSandbox } from "../../../src/core/permissions/index.js";
import { createPermissionSet } from "../../../src/core/permissions/index.js";

// The sandbox forks a child that must run compiled JS (the permission model is
// incompatible with the tsx loader's write cache). These tests therefore run
// against the built `dist` and are skipped when the package has not been built.
const distRuntime = resolve("dist/src/core/permissions/sandbox/runtime.js");
const isBuilt = existsSync(distRuntime);

describe.skipIf(!isBuilt)("runInSandbox (process isolation)", () => {
  let runInSandbox: typeof RunInSandbox;
  let workDir: string;
  let fixturePath: string;

  beforeAll(async () => {
    ({ runInSandbox } = await import(pathToFileURL(distRuntime).href));
    workDir = mkdtempSync(join(tmpdir(), "tsp-sandbox-"));
    fixturePath = join(workDir, "fixture.js");
    writeFileSync(
      fixturePath,
      `
      export default async function (context) {
        const out = {};
        // Legitimate write through the broker (within granted scope).
        try {
          await context.host.mkdirp(context.payload.allowedDir);
          await context.host.writeFile(context.payload.allowedFile, "hello");
          out.brokerWriteOk = true;
        } catch (e) { out.brokerWriteOk = false; out.brokerWriteErr = e.code; }
        // Write through the broker outside granted scope -> broker denies.
        try {
          await context.host.writeFile(context.payload.deniedFile, "x");
          out.brokerWriteDenied = "ALLOWED";
        } catch (e) { out.brokerWriteDenied = e.code; }
        // Direct fs access -> blocked by the OS permission model.
        try {
          const fs = await import("node:fs/promises");
          await fs.readFile("/etc/hosts", "utf8");
          out.directRead = "ALLOWED";
        } catch (e) { out.directRead = e.code; }
        // Ambient network is denied by default.
        out.fetchDenied = typeof fetch === "function";
        try { await fetch("https://example.com"); out.fetchCall = "ALLOWED"; }
        catch (e) { out.fetchCall = e.code; }
        context.reportDiagnostic({ code: "from-sandbox" });
        return out;
      }
      `,
    );
  });

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it("enforces OS-level fs restrictions while allowing brokered writes in scope", async () => {
    const allowedDir = join(workDir, "out");
    const allowedFile = join(allowedDir, "result.txt");
    const deniedFile = join(workDir, "secret", "leak.txt");
    const diagnostics: unknown[] = [];

    const result = (await runInSandbox({
      modulePath: fixturePath,
      payload: { allowedDir, allowedFile, deniedFile },
      permissions: createPermissionSet([{ kind: "fs-write", paths: [join(workDir, "out")] }]),
      host: NodeSystemHost,
      onDiagnostic: (d) => diagnostics.push(d),
    })) as Record<string, unknown>;

    // Brokered write inside the granted scope succeeded and hit disk.
    expect(result.brokerWriteOk).toBe(true);
    expect(readFileSync(allowedFile, "utf8")).toBe("hello");

    // Brokered write outside the granted scope was denied by the broker.
    expect(result.brokerWriteDenied).toBe("ERR_ACCESS_DENIED");

    // Direct file-system access was blocked by the OS permission model.
    expect(result.directRead).toBe("ERR_ACCESS_DENIED");

    // Ambient network was denied by default.
    expect(result.fetchCall).toBe("ERR_ACCESS_DENIED");

    // Diagnostics round-tripped back to the parent.
    expect(diagnostics).toEqual([{ code: "from-sandbox" }]);
  });

  it("propagates errors thrown by the sandboxed module", async () => {
    const throwingFixture = join(workDir, "throwing.js");
    writeFileSync(
      throwingFixture,
      `export default async function () { throw new Error("boom from sandbox"); }`,
    );
    await expect(
      runInSandbox({
        modulePath: throwingFixture,
        permissions: createPermissionSet([]),
        host: NodeSystemHost,
      }),
    ).rejects.toThrow(/boom from sandbox/);
  });
});

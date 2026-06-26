import { fork } from "child_process";
import { existsSync, mkdirSync, realpathSync } from "fs";
import { dirname, resolve as resolvePathNative } from "path";
import { fileURLToPath } from "url";
import type { SystemHost } from "../../types.js";
import { createPermissionedSystemHost } from "../permissioned-host.js";
import type { PermissionSet } from "../types.js";
import { buildSandboxEnv, permissionSetToNodeArgs } from "./node-args.js";
import {
  deserializeError,
  serializeError,
  type SandboxChildMessage,
  type SandboxHostMethod,
  type SandboxJob,
} from "./protocol.js";

export interface RunInSandboxOptions {
  /** Absolute path to the module the sandboxed child should import and run. */
  readonly modulePath: string;
  /** Named export to invoke; defaults to the module's default export. */
  readonly exportName?: string;
  /** JSON-serializable payload passed to the invoked function. */
  readonly payload?: unknown;
  /** The effective permissions to enforce on the child (OS-level + broker). */
  readonly permissions: PermissionSet;
  /** The privileged host used by the broker to service the child's requests. */
  readonly host: SystemHost;
  /** Working directory for the child process. */
  readonly cwd?: string;
  /** Read scopes the child always needs (bootstrap, modules, compiler). */
  readonly essentialReadScopes?: readonly string[];
  /** Write scopes the child always needs (e.g. temp dirs). */
  readonly essentialWriteScopes?: readonly string[];
  /** Called for each diagnostic the child reports. */
  readonly onDiagnostic?: (diagnostic: unknown) => void;
  /** Parent environment to derive the curated child env from. Defaults to `process.env`. */
  readonly env?: NodeJS.ProcessEnv;
}

const bootstrapPath = resolvePathNative(dirname(fileURLToPath(import.meta.url)), "bootstrap.js");

// The compiler package root (…/dist/src/core/permissions/sandbox → package root).
// Granting read here lets the child load the bootstrap and the rest of the
// compiler `dist`. Its `node_modules` (and any hoisted ones) are added
// separately via `nodeModulesAncestors`, since the child re-imports the
// compiler and therefore needs its dependencies.
const compilerPackageRoot = resolvePathNative(dirname(bootstrapPath), "..", "..", "..", "..", "..");

/**
 * Every `node_modules` directory on the path from `start` up to the filesystem
 * root. These are the module-resolution roots a child needs read access to in
 * order to import bare specifiers (the compiler and its dependencies, including
 * hoisted monorepo dependencies).
 */
function nodeModulesAncestors(start: string): string[] {
  const roots: string[] = [];
  let current = resolvePathNative(start);
  for (;;) {
    const candidate = resolvePathNative(current, "node_modules");
    if (existsSync(candidate)) {
      roots.push(candidate);
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return roots;
}

/**
 * Run a module export inside an OS-isolated child process whose file-system and
 * child-process access is constrained to `permissions` via Node's permission
 * model. The child can only reach the outside world through the broker, which
 * re-validates each request against the same permissions.
 *
 * Resolves with the value the invoked function returned, or rejects if the child
 * threw, exited abnormally, or attempted a denied operation.
 */
export function runInSandbox(options: RunInSandboxOptions): Promise<unknown> {
  const { permissions, host } = options;
  const parentEnv = options.env ?? process.env;

  const essentialReadScopes = realpathScopes([
    compilerPackageRoot,
    ...nodeModulesAncestors(compilerPackageRoot),
    dirname(bootstrapPath),
    dirname(options.modulePath),
    options.modulePath,
    ...(options.essentialReadScopes ?? []),
  ]);
  const essentialWriteScopes = realpathScopes(options.essentialWriteScopes ?? []);
  const grantedReadRealpaths = realpathScopes(permissions.fsRead);
  const grantedWriteRealpaths = realpathScopes(permissions.fsWrite);

  // Node resolves permission scopes at process startup: a write scope that does
  // not yet exist cannot be matched against paths the child creates later (even
  // the child's own `mkdir` of the scope leaves subsequent writes to its
  // children denied). The privileged parent therefore pre-creates the writable
  // directories so each scope resolves to a real, recursive directory before the
  // child is forked.
  for (const scope of [...essentialWriteScopes, ...grantedWriteRealpaths]) {
    if (!existsSync(scope)) {
      try {
        mkdirSync(scope, { recursive: true });
      } catch {
        // Best effort: if creation fails the child will surface the denial.
      }
    }
  }

  // The child must import the canonical (realpath-resolved) module path so the
  // permission model — which compares real paths — does not have to traverse
  // intermediate symlinks (e.g. macOS `/var`→`/private/var`) that are not in
  // the granted scopes.
  const moduleRealpath = realpathScope(options.modulePath);

  const execArgv = permissionSetToNodeArgs(
    { ...permissions, fsRead: grantedReadRealpaths, fsWrite: grantedWriteRealpaths },
    { essentialReadScopes, essentialWriteScopes },
  );

  const broker = createPermissionedSystemHost(host, permissions);

  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    const child = fork(bootstrapPath, [], {
      execArgv,
      cwd: options.cwd,
      env: buildSandboxEnv(permissions, parentEnv),
      stdio: ["inherit", "inherit", "inherit", "ipc"],
    });

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
      child.removeAllListeners();
      if (child.connected) child.disconnect();
      if (child.exitCode === null) child.kill();
    };

    child.on("message", (message: SandboxChildMessage) => {
      switch (message.kind) {
        case "host-request":
          void serviceHostRequest(broker, message.method, message.args).then(
            (value) => child.send({ kind: "host-response", id: message.id, ok: true, value }),
            (error) =>
              child.send({
                kind: "host-response",
                id: message.id,
                ok: false,
                error: serializeError(error),
              }),
          );
          break;
        case "diagnostic":
          options.onDiagnostic?.(message.diagnostic);
          break;
        case "result":
          if (message.ok) {
            settle(() => resolvePromise(message.value));
          } else {
            settle(() =>
              rejectPromise(
                message.error ? deserializeError(message.error) : new Error("Sandbox job failed"),
              ),
            );
          }
          break;
      }
    });

    child.on("error", (error) => settle(() => rejectPromise(error)));
    child.on("exit", (code, signal) => {
      settle(() =>
        rejectPromise(
          new Error(`Sandboxed process exited unexpectedly (code: ${code}, signal: ${signal})`),
        ),
      );
    });

    const job: SandboxJob = {
      kind: "job",
      modulePath: moduleRealpath,
      exportName: options.exportName,
      payload: options.payload,
    };
    child.send(job);
  });
}

async function serviceHostRequest(
  host: SystemHost,
  method: SandboxHostMethod,
  args: readonly unknown[],
): Promise<unknown> {
  switch (method) {
    case "readUrl":
      return host.readUrl(args[0] as string);
    case "readFile":
      return host.readFile(args[0] as string);
    case "writeFile":
      return host.writeFile(args[0] as string, args[1] as string);
    case "readDir":
      return host.readDir(args[0] as string);
    case "rm":
      return host.rm(args[0] as string, args[1] as any);
    case "mkdirp":
      return host.mkdirp(args[0] as string);
    case "stat": {
      const s = await host.stat(args[0] as string);
      return { isDirectory: s.isDirectory(), isFile: s.isFile() };
    }
    case "realpath":
      return host.realpath(args[0] as string);
  }
}

/**
 * Resolve each scope to its real path (the permission model compares real
 * paths). For paths that do not yet exist (e.g. an output dir), resolve the
 * nearest existing ancestor and re-append the remainder so the grant still
 * covers the eventual location.
 */
function realpathScopes(scopes: readonly string[]): string[] {
  return [...new Set(scopes.map(realpathScope))];
}

/**
 * Resolve a single path to its real path, tolerating paths that do not yet
 * exist (resolves the nearest existing ancestor and re-appends the remainder).
 *
 * Paths handed to a sandboxed child — the spec entry point, the emitter module,
 * output directories — must be realpath-resolved by the (unrestricted) parent,
 * because the permission model compares real paths and the child cannot itself
 * traverse symlinks (e.g. macOS `/var`→`/private/var`) that fall outside its
 * granted scopes.
 */
export function resolveRealpath(path: string): string {
  return realpathScope(path);
}

function realpathScope(scope: string): string {
  const abs = resolvePathNative(scope);
  if (existsSync(abs)) {
    try {
      return realpathSync(abs);
    } catch {
      return abs;
    }
  }
  let current = abs;
  let suffix = "";
  while (current !== dirname(current)) {
    const parent = dirname(current);
    suffix = suffix ? `${basename(current)}/${suffix}` : basename(current);
    if (existsSync(parent)) {
      try {
        return `${realpathSync(parent)}/${suffix}`;
      } catch {
        return abs;
      }
    }
    current = parent;
  }
  return abs;
}

function basename(p: string): string {
  return p.slice(dirname(p).length + 1);
}

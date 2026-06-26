import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import type { CompilerOptions } from "../../options.js";
import type { SystemHost } from "../../types.js";
import type { PermissionSet } from "../types.js";
import type { SandboxEmitPayload } from "./emit-job.js";
import type { SandboxEmitResult } from "./emit-protocol.js";
import { resolveRealpath, runInSandbox } from "./runtime.js";

const emitJobPath = resolve(dirname(fileURLToPath(import.meta.url)), "emit-job.js");

export interface RunEmitterSandboxedOptions {
  /** Spec entry point the child recompiles. */
  readonly mainFile: string;
  /** Compiler options to recompile with (the child restricts `emit` to one emitter). */
  readonly options: CompilerOptions;
  /** Name or path of the single emitter to run in the child. */
  readonly emitterNameOrPath: string;
  /** The effective permission set the user granted this emitter. */
  readonly permissions: PermissionSet;
  /** Privileged host used by the broker to service the child's requests. */
  readonly host: SystemHost;
  /** Project root; the child needs read access to it (specs + node_modules) to recompile. */
  readonly projectRoot: string;
}

/**
 * Run a single emitter inside an OS-isolated child process. The child re-runs
 * compilation locally to rebuild the live `Program`, then invokes only this
 * emitter's `$onEmit`, returning its diagnostics and emitted files.
 *
 * File-system, child-process and (best-effort) network/env access in the child
 * are constrained to `permissions`.
 */
export async function runEmitterSandboxed(
  opts: RunEmitterSandboxedOptions,
): Promise<SandboxEmitResult> {
  // The emitter may always read its own package directory (its static assets /
  // templates), the way the output dir is always writable. This is granted both
  // at the OS layer (read scope below) and at the host layer (the emitter
  // permission set the child wraps its host with).
  //
  // Scopes are realpath-resolved so the host wrapper compares the same canonical
  // paths the child actually touches: the permission model resolves symlinks
  // (e.g. macOS `/var`→`/private/var`) and the emitter's output dir is reached
  // by its real path.
  const emitterPackageDir = findPackageDir(opts.emitterNameOrPath);
  const emitterPermissions: PermissionSet = {
    ...opts.permissions,
    fsRead: resolveScopes([
      ...opts.permissions.fsRead,
      ...(emitterPackageDir ? [emitterPackageDir] : []),
    ]),
    fsWrite: resolveScopes(opts.permissions.fsWrite),
  };

  const payload: SandboxEmitPayload = {
    mainFile: opts.mainFile,
    options: stripNonClonable(opts.options),
    emitterNameOrPath: opts.emitterNameOrPath,
    emitterPermissions,
  };

  const essentialReadScopes = [opts.projectRoot, ...nodeModulesAncestors(opts.projectRoot)];
  if (emitterPackageDir) {
    essentialReadScopes.push(emitterPackageDir);
  }

  const result = await runInSandbox({
    modulePath: emitJobPath,
    payload,
    permissions: opts.permissions,
    host: opts.host,
    essentialReadScopes,
  });

  return result as SandboxEmitResult;
}

/** Realpath-resolve each scope, tolerating not-yet-existing paths, de-duped. */
function resolveScopes(scopes: readonly string[]): string[] {
  return [...new Set(scopes.map(resolveRealpath))];
}

/**
 * Nearest ancestor directory of `entryPath` containing a `package.json` — i.e.
 * the package the emitter entry point lives in. Returns `undefined` if none is
 * found (e.g. a bare script outside any package).
 */
function findPackageDir(entryPath: string): string | undefined {
  let current = dirname(resolve(entryPath));
  for (;;) {
    if (existsSync(resolve(current, "package.json"))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

/** `node_modules` directories from `start` up to the filesystem root. */
function nodeModulesAncestors(start: string): string[] {
  const roots: string[] = [];
  let current = resolve(start);
  for (;;) {
    const candidate = resolve(current, "node_modules");
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
 * Produce a structured-clone-safe copy of the compiler options for IPC. The
 * options object is plain data, but defensively drop anything that cannot cross
 * the process boundary.
 */
function stripNonClonable(options: CompilerOptions): CompilerOptions {
  return JSON.parse(JSON.stringify(options));
}

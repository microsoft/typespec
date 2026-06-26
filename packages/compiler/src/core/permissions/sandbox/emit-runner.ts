import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import type { CompilerOptions } from "../../options.js";
import type { SystemHost } from "../../types.js";
import type { SandboxEmitPayload } from "./emit-job.js";
import type { SandboxEmitResult } from "./emit-protocol.js";
import { runInSandbox } from "./runtime.js";
import type { PermissionSet } from "../types.js";

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
  const payload: SandboxEmitPayload = {
    mainFile: opts.mainFile,
    options: stripNonClonable(opts.options),
    emitterNameOrPath: opts.emitterNameOrPath,
  };

  const essentialReadScopes = [opts.projectRoot, ...nodeModulesAncestors(opts.projectRoot)];

  const result = await runInSandbox({
    modulePath: emitJobPath,
    payload,
    permissions: opts.permissions,
    host: opts.host,
    essentialReadScopes,
  });

  return result as SandboxEmitResult;
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

import { realpath } from "fs";
import type { CompilerOptions } from "../../options.js";
import type { CompilerHost } from "../../types.js";
import type { PermissionSet } from "../types.js";
import type { SandboxEmitResult } from "./emit-protocol.js";

/**
 * Payload handed to the sandboxed emit job by the parent ({@link runEmitterSandboxed}).
 */
export interface SandboxEmitPayload {
  readonly mainFile: string;
  readonly options: CompilerOptions;
  readonly emitterNameOrPath: string;
  /**
   * Effective permissions the emitter's own host is constrained to while
   * `$onEmit` runs. Tighter than the child's OS-level grants (which must also
   * allow the broader access the local recompile needs): the emitter may only
   * touch the file system / network through the host within these scopes.
   */
  readonly emitterPermissions: PermissionSet;
}

interface SandboxContext {
  readonly payload: unknown;
}

/**
 * Entry point executed inside the sandboxed child process. It re-runs
 * compilation locally (using a real {@link NodeHost}, whose file-system access
 * is already constrained by the Node permission flags the parent applied) and
 * invokes a single emitter, returning that emitter's diagnostics and emitted
 * files back to the parent.
 *
 * The compiler is imported lazily so the permission flags are fully in effect
 * before any of its module-load side effects run.
 */
export default async function runSandboxedEmit(
  context: SandboxContext,
): Promise<SandboxEmitResult> {
  const payload = context.payload as SandboxEmitPayload;
  const { NodeHost } = await import("../../node-host.js");
  const { runEmitterRecompiled } = await import("../../program.js");
  return runEmitterRecompiled(
    sandboxHost(NodeHost),
    payload.mainFile,
    payload.options,
    payload.emitterNameOrPath,
    payload.emitterPermissions,
  );
}

/**
 * Adapt a {@link CompilerHost} for use inside the sandbox.
 *
 * Two adjustments are needed so the child can re-run compilation under Node's
 * permission model:
 *
 * 1. `NodeHost.realpath` uses the async *callback* `fs.realpath` (a JS
 *    implementation that `lstat`s every ancestor path segment) as a workaround
 *    for a bug in the promise-based variant. Under the permission model that
 *    LOOP is denied because intermediate ancestors of a granted scope are not
 *    themselves granted. The *native* realpath resolves in a single syscall the
 *    permission model allows, so we route the child's `realpath` through it.
 *
 * 2. Module/library resolution probes many candidate paths by walking up the
 *    directory tree. Probes that land outside the granted read scopes are
 *    rejected by the OS with `ERR_ACCESS_DENIED`. The resolver only treats
 *    `ENOENT`/`ENOTDIR` as "keep looking", so we translate access-denied on
 *    probe operations into `ENOENT`: an inaccessible path is, for resolution
 *    purposes, simply not there. Actual reads of granted files are unaffected.
 */
function sandboxHost(host: CompilerHost): CompilerHost {
  return {
    ...host,
    realpath: (path: string) =>
      new Promise<string>((resolvePromise, rejectPromise) =>
        realpath.native(path, (error, resolved) =>
          error ? rejectPromise(error) : resolvePromise(resolved),
        ),
      ),
    stat: (path: string) => host.stat(path).catch(notFoundIfDenied),
    readDir: (path: string) => host.readDir(path).catch(notFoundIfDenied),
  };
}

/**
 * Re-map an `ERR_ACCESS_DENIED` rejection to `ENOENT` so directory-walking
 * resolution treats an out-of-scope path as absent rather than failing hard.
 */
function notFoundIfDenied(error: any): never {
  if (error?.code === "ERR_ACCESS_DENIED") {
    const notFound: NodeJS.ErrnoException = new Error(error.message);
    notFound.code = "ENOENT";
    throw notFound;
  }
  throw error;
}

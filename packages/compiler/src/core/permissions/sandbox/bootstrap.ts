import type { SystemHost } from "../../types.js";
import {
  deserializeError,
  serializeError,
  type SandboxChildMessage,
  type SandboxHostMethod,
  type SandboxHostResponse,
  type SandboxJob,
  type SandboxParentMessage,
} from "./protocol.js";

/**
 * Entry point that runs *inside* the sandboxed child process. It is launched by
 * {@link runInSandbox} with Node permission flags already restricting its file
 * system / child-process access. Here we additionally:
 *  - expose a brokered {@link SystemHost} that forwards IO to the parent,
 *  - deny ambient network access by default (best effort; not OS-enforced),
 *  - import and invoke the requested module export with that context.
 */

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

const pending = new Map<number, PendingRequest>();
let nextId = 0;

function send(message: SandboxChildMessage): void {
  process.send!(message);
}

function hostCall(method: SandboxHostMethod, ...args: unknown[]): Promise<unknown> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    send({ kind: "host-request", id, method, args });
  });
}

/** A SystemHost whose operations are serviced (and re-validated) by the broker. */
const brokeredHost: SystemHost = {
  readUrl: (url) => hostCall("readUrl", url) as any,
  readFile: (path) => hostCall("readFile", path) as any,
  writeFile: (path, content) => hostCall("writeFile", path, content) as any,
  readDir: (path) => hostCall("readDir", path) as any,
  rm: (path, options) => hostCall("rm", path, options) as any,
  mkdirp: (path) => hostCall("mkdirp", path) as any,
  stat: async (path) => {
    const s = (await hostCall("stat", path)) as { isDirectory: boolean; isFile: boolean };
    return { isDirectory: () => s.isDirectory, isFile: () => s.isFile };
  },
  realpath: (path) => hostCall("realpath", path) as any,
};

/** Context handed to the invoked sandboxed function. */
export interface SandboxContext {
  readonly host: SystemHost;
  readonly payload: unknown;
  /** Report a diagnostic back to the parent program. */
  reportDiagnostic(diagnostic: unknown): void;
}

function handleHostResponse(message: SandboxHostResponse): void {
  const entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id);
  if (message.ok) {
    entry.resolve(message.value);
  } else {
    entry.reject(message.error ? deserializeError(message.error) : new Error("Host request failed"));
  }
}

async function runJob(job: SandboxJob): Promise<void> {
  try {
    const mod = await import(job.modulePath);
    const fn = job.exportName ? mod[job.exportName] : (mod.default ?? mod);
    if (typeof fn !== "function") {
      throw new Error(
        `Sandbox module '${job.modulePath}' does not export a callable '${job.exportName ?? "default"}'.`,
      );
    }
    const context: SandboxContext = {
      host: brokeredHost,
      payload: job.payload,
      reportDiagnostic: (diagnostic) => send({ kind: "diagnostic", diagnostic }),
    };
    const value = await fn(context);
    send({ kind: "result", ok: true, value });
  } catch (error) {
    send({ kind: "result", ok: false, error: serializeError(error) });
  } finally {
    process.disconnect?.();
  }
}

// Deny ambient network by default. This is a courtesy guard for well-behaved
// code; it is NOT a security boundary (Node's permission model does not cover
// network, so a determined module could still reach `node:net`). Hard network
// isolation requires OS-level sandboxing.
const denyNetwork = () => {
  throw Object.assign(new Error("Network access is not granted to this sandboxed emitter/library."), {
    code: "ERR_ACCESS_DENIED",
  });
};
(globalThis as any).fetch = denyNetwork;

process.on("message", (message: SandboxParentMessage) => {
  if (message.kind === "host-response") {
    handleHostResponse(message);
  } else if (message.kind === "job") {
    void runJob(message);
  }
});

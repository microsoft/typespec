import type { RmOptions } from "../../types.js";

/**
 * Messages exchanged between the privileged parent (broker) and the sandboxed
 * child over the IPC channel. The child can only affect the outside world by
 * asking the broker, which re-validates every request against the granted
 * permissions before touching the real file system or network.
 */

/** A host file-system / network operation the child asks the broker to perform. */
export type SandboxHostMethod =
  | "readUrl"
  | "readFile"
  | "writeFile"
  | "readDir"
  | "rm"
  | "mkdirp"
  | "stat"
  | "realpath";

export interface SandboxHostRequest {
  readonly kind: "host-request";
  readonly id: number;
  readonly method: SandboxHostMethod;
  readonly args: readonly unknown[];
}

export interface SandboxHostResponse {
  readonly kind: "host-response";
  readonly id: number;
  readonly ok: boolean;
  readonly value?: unknown;
  readonly error?: SandboxSerializedError;
}

/** A diagnostic the child wants surfaced by the parent program. */
export interface SandboxDiagnosticMessage {
  readonly kind: "diagnostic";
  readonly diagnostic: unknown;
}

/** Final outcome reported by the child once the sandboxed job completes. */
export interface SandboxResultMessage {
  readonly kind: "result";
  readonly ok: boolean;
  readonly value?: unknown;
  readonly error?: SandboxSerializedError;
}

/** The job description sent from parent to child at startup. */
export interface SandboxJob {
  readonly kind: "job";
  /** Absolute path to the module the child should import and run. */
  readonly modulePath: string;
  /** Name of the exported function to invoke (defaults to the module default). */
  readonly exportName?: string;
  /** Arbitrary JSON-serializable payload passed to the invoked function. */
  readonly payload?: unknown;
}

export type SandboxParentMessage = SandboxJob | SandboxHostResponse;
export type SandboxChildMessage =
  | SandboxHostRequest
  | SandboxDiagnosticMessage
  | SandboxResultMessage;

export interface SandboxSerializedError {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
  readonly code?: string;
}

export function serializeError(error: unknown): SandboxSerializedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as { code?: string }).code,
    };
  }
  return { name: "Error", message: String(error) };
}

export function deserializeError(error: SandboxSerializedError): Error {
  const err = new Error(error.message);
  err.name = error.name;
  if (error.stack) err.stack = error.stack;
  if (error.code) (err as { code?: string }).code = error.code;
  return err;
}

/** Re-export for the bootstrap's `rm` typing. */
export type { RmOptions };

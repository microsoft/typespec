import type { CompilerHost, SystemHost } from "../types.js";
import { isHostWithinScopes, isPathWithinScopes } from "./permission-set.js";
import type { PermissionSet } from "./types.js";

/**
 * Error thrown when sandboxed code attempts a system operation outside its
 * granted permissions. The `code` mirrors Node's permission-model error code so
 * callers can treat broker-side and OS-side denials uniformly.
 */
export class PermissionDeniedError extends Error {
  readonly code = "ERR_ACCESS_DENIED";
  /** The permission category that was violated. */
  readonly permission: "fs-read" | "fs-write" | "network";
  /** The path or host that was denied. */
  readonly resource: string;

  constructor(permission: "fs-read" | "fs-write" | "network", resource: string) {
    super(
      `Permission denied: '${permission}' access to '${resource}' is not granted to this sandboxed emitter/library.`,
    );
    this.name = "PermissionDeniedError";
    this.permission = permission;
    this.resource = resource;
  }
}

function assertReadable(path: string, permissions: PermissionSet): void {
  if (!isPathWithinScopes(path, permissions.fsRead)) {
    throw new PermissionDeniedError("fs-read", path);
  }
}

function assertWritable(path: string, permissions: PermissionSet): void {
  if (!isPathWithinScopes(path, permissions.fsWrite)) {
    throw new PermissionDeniedError("fs-write", path);
  }
}

function assertNetwork(url: string, permissions: PermissionSet): void {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    // A non-URL (e.g. a file path passed to readUrl): treat as a read.
    assertReadable(url, permissions);
    return;
  }
  if (!isHostWithinScopes(host, permissions.network)) {
    throw new PermissionDeniedError("network", host);
  }
}

/**
 * Wrap a {@link SystemHost} so every file-system and network operation is
 * validated against the given {@link PermissionSet} before it reaches the real
 * host. This is the privileged-side enforcement used by the sandbox broker and
 * provides defense in depth alongside the OS-level Node permission model.
 *
 * Operations outside the granted scopes throw {@link PermissionDeniedError}.
 */
export function createPermissionedSystemHost(
  inner: SystemHost,
  permissions: PermissionSet,
): SystemHost {
  return {
    readUrl: async (url) => {
      assertNetwork(url, permissions);
      return inner.readUrl(url);
    },
    readFile: async (path) => {
      assertReadable(path, permissions);
      return inner.readFile(path);
    },
    writeFile: async (path, content) => {
      assertWritable(path, permissions);
      return inner.writeFile(path, content);
    },
    readDir: async (path) => {
      assertReadable(path, permissions);
      return inner.readDir(path);
    },
    rm: async (path, options) => {
      assertWritable(path, permissions);
      return inner.rm(path, options);
    },
    mkdirp: async (path) => {
      assertWritable(path, permissions);
      return inner.mkdirp(path);
    },
    stat: async (path) => {
      assertReadable(path, permissions);
      return inner.stat(path);
    },
    realpath: async (path) => {
      assertReadable(path, permissions);
      return inner.realpath(path);
    },
  };
}

/**
 * Wrap a {@link CompilerHost} so its file-system/network surface is constrained
 * to the given {@link PermissionSet}. Non-IO members (module loading helpers,
 * path conversion, log sink) are passed through unchanged.
 */
export function createPermissionedHost(
  inner: CompilerHost,
  permissions: PermissionSet,
): CompilerHost {
  const system = createPermissionedSystemHost(inner, permissions);
  return {
    ...inner,
    ...system,
  };
}

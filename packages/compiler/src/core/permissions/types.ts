/**
 * Permission model for sandboxed execution of TypeSpec libraries and emitters.
 *
 * These types describe *what* a library/emitter may request and what a user may
 * grant. They are intentionally platform agnostic and contain no Node.js
 * specifics so they can be unit tested and reused across hosts. Translation of a
 * granted {@link PermissionSet} into concrete enforcement (Node permission
 * flags, env scrubbing, network brokering) lives in the sandbox runtime.
 */

/** The categories of system capability that can be requested/granted. */
export type PermissionKind = "fs-read" | "fs-write" | "network" | "env" | "exec";

/** Read files within the given path scopes. */
export interface FsReadPermission {
  readonly kind: "fs-read";
  /** Absolute (or config relative) directory/file scopes the code may read. */
  readonly paths: readonly string[];
}

/** Write files within the given path scopes. Defaults to the emitter output dir. */
export interface FsWritePermission {
  readonly kind: "fs-write";
  /** Absolute (or config relative) directory/file scopes the code may write. */
  readonly paths: readonly string[];
}

/**
 * Make network requests to the given hosts. A host may be an exact host name,
 * a wildcard pattern such as `*.example.com`, or `*` to allow any host.
 */
export interface NetworkPermission {
  readonly kind: "network";
  readonly hosts: readonly string[];
}

/** Read the given environment variable names. */
export interface EnvPermission {
  readonly kind: "env";
  readonly names: readonly string[];
}

/**
 * Spawn child processes. When {@link ExecPermission.commands} is omitted any
 * command may be spawned; otherwise only the listed commands are permitted.
 */
export interface ExecPermission {
  readonly kind: "exec";
  readonly commands?: readonly string[];
}

/** A single granular permission a library/emitter can request or be granted. */
export type Permission =
  | FsReadPermission
  | FsWritePermission
  | NetworkPermission
  | EnvPermission
  | ExecPermission;

/**
 * A permission a library/emitter declares in its manifest, paired with a
 * human-readable reason shown to the user when they review/approve it.
 */
export interface PermissionRequest {
  readonly permission: Permission;
  /** Why the library/emitter needs this permission. Shown to users. */
  readonly reason?: string;
}

/**
 * The normalized, aggregated view of a set of permissions. This is the canonical
 * form used to compute grants (intersection of requested and approved) and to
 * detect missing permissions for diagnostics.
 */
export interface PermissionSet {
  /** Path scopes readable from the file system. */
  readonly fsRead: readonly string[];
  /** Path scopes writable on the file system. */
  readonly fsWrite: readonly string[];
  /** Network host patterns that may be contacted. */
  readonly network: readonly string[];
  /** Environment variable names that may be read. */
  readonly env: readonly string[];
  /**
   * Child-process capability. `false` = no exec; `true` = any command;
   * `string[]` = only the listed commands.
   */
  readonly exec: boolean | readonly string[];
}

/** A {@link PermissionSet} that grants nothing. The secure default. */
export const EMPTY_PERMISSION_SET: PermissionSet = Object.freeze({
  fsRead: Object.freeze([]),
  fsWrite: Object.freeze([]),
  network: Object.freeze([]),
  env: Object.freeze([]),
  exec: false,
});

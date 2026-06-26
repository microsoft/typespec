import { getNormalizedPathComponents } from "../path-utils.js";
import {
  EMPTY_PERMISSION_SET,
  type Permission,
  type PermissionKind,
  type PermissionSet,
} from "./types.js";

/**
 * Build a normalized {@link PermissionSet} from a flat list of granular
 * {@link Permission}s. Repeated kinds are merged (their scopes unioned).
 */
export function createPermissionSet(permissions: readonly Permission[]): PermissionSet {
  const fsRead = new Set<string>();
  const fsWrite = new Set<string>();
  const network = new Set<string>();
  const env = new Set<string>();
  let exec: boolean | Set<string> = false;

  for (const permission of permissions) {
    switch (permission.kind) {
      case "fs-read":
        for (const p of permission.paths) fsRead.add(p);
        break;
      case "fs-write":
        for (const p of permission.paths) fsWrite.add(p);
        break;
      case "network":
        for (const h of permission.hosts) network.add(h);
        break;
      case "env":
        for (const n of permission.names) env.add(n);
        break;
      case "exec":
        if (permission.commands === undefined) {
          exec = true;
        } else if (exec !== true) {
          const set: Set<string> = exec instanceof Set ? exec : new Set<string>();
          for (const c of permission.commands) set.add(c);
          exec = set;
        }
        break;
    }
  }

  return {
    fsRead: [...fsRead],
    fsWrite: [...fsWrite],
    network: [...network],
    env: [...env],
    exec: exec instanceof Set ? [...exec] : exec,
  };
}

/** Union two permission sets (used to compute the combined needs of libraries). */
export function mergePermissionSets(a: PermissionSet, b: PermissionSet): PermissionSet {
  return {
    fsRead: unionScopes(a.fsRead, b.fsRead),
    fsWrite: unionScopes(a.fsWrite, b.fsWrite),
    network: unionScopes(a.network, b.network),
    env: unionScopes(a.env, b.env),
    exec: unionExec(a.exec, b.exec),
  };
}

/**
 * Compute the effective grant: everything `requested` that is also covered by
 * `granted`. This is what the sandbox will actually be allowed to do — a library
 * never receives more than it asked for, nor more than the user approved.
 */
export function intersectPermissionSets(
  requested: PermissionSet,
  granted: PermissionSet,
): PermissionSet {
  return {
    fsRead: requested.fsRead.filter((p) => isPathWithinScopes(p, granted.fsRead)),
    fsWrite: requested.fsWrite.filter((p) => isPathWithinScopes(p, granted.fsWrite)),
    network: requested.network.filter((h) => isHostWithinScopes(h, granted.network)),
    env: requested.env.filter((n) => granted.env.includes(n)),
    exec: intersectExec(requested.exec, granted.exec),
  };
}

/**
 * Determine which of the `requested` permissions are NOT covered by `granted`.
 * Returns granular {@link Permission}s suitable for building an actionable
 * diagnostic telling the user exactly what to add to their config.
 */
export function findMissingPermissions(
  requested: PermissionSet,
  granted: PermissionSet,
): Permission[] {
  const missing: Permission[] = [];

  const fsRead = requested.fsRead.filter((p) => !isPathWithinScopes(p, granted.fsRead));
  if (fsRead.length > 0) missing.push({ kind: "fs-read", paths: fsRead });

  const fsWrite = requested.fsWrite.filter((p) => !isPathWithinScopes(p, granted.fsWrite));
  if (fsWrite.length > 0) missing.push({ kind: "fs-write", paths: fsWrite });

  const network = requested.network.filter((h) => !isHostWithinScopes(h, granted.network));
  if (network.length > 0) missing.push({ kind: "network", hosts: network });

  const env = requested.env.filter((n) => !granted.env.includes(n));
  if (env.length > 0) missing.push({ kind: "env", names: env });

  if (requested.exec === true && granted.exec !== true) {
    missing.push({ kind: "exec" });
  } else if (Array.isArray(requested.exec)) {
    const commands = requested.exec.filter((c) => !isExecCommandAllowed(c, granted.exec));
    if (commands.length > 0) missing.push({ kind: "exec", commands });
  }

  return missing;
}

/** Whether a permission set grants no capabilities at all. */
export function isEmptyPermissionSet(set: PermissionSet): boolean {
  return (
    set.fsRead.length === 0 &&
    set.fsWrite.length === 0 &&
    set.network.length === 0 &&
    set.env.length === 0 &&
    set.exec === false
  );
}

/**
 * Test whether `path` falls within at least one of the granted directory/file
 * `scopes`. Paths are normalized; a scope grants access to itself and anything
 * beneath it.
 */
export function isPathWithinScopes(path: string, scopes: readonly string[]): boolean {
  if (scopes.length === 0) return false;
  const target = getNormalizedPathComponents(path, undefined);
  return scopes.some((scope) => {
    const base = getNormalizedPathComponents(scope, undefined);
    if (target.length < base.length) return false;
    return base.every((component, i) => component === target[i]);
  });
}

/**
 * Test whether `host` is allowed by `scopes`. A scope of `*` allows any host;
 * a scope of `*.example.com` matches any sub-domain (and the apex) of
 * `example.com`; otherwise an exact (case-insensitive) match is required.
 */
export function isHostWithinScopes(host: string, scopes: readonly string[]): boolean {
  const normalized = host.toLowerCase();
  return scopes.some((scope) => {
    const pattern = scope.toLowerCase();
    if (pattern === "*") return true;
    if (pattern.startsWith("*.")) {
      const suffix = pattern.slice(1); // ".example.com"
      return normalized.endsWith(suffix) || normalized === suffix.slice(1);
    }
    return normalized === pattern;
  });
}

/** Human-readable rendering of a permission for diagnostics. */
export function formatPermission(permission: Permission): string {
  switch (permission.kind) {
    case "fs-read":
      return `fs-read(${permission.paths.join(", ")})`;
    case "fs-write":
      return `fs-write(${permission.paths.join(", ")})`;
    case "network":
      return `network(${permission.hosts.join(", ")})`;
    case "env":
      return `env(${permission.names.join(", ")})`;
    case "exec":
      return permission.commands ? `exec(${permission.commands.join(", ")})` : "exec";
  }
}

/** Stable display order of permission kinds. */
export const PERMISSION_KINDS: readonly PermissionKind[] = [
  "fs-read",
  "fs-write",
  "network",
  "env",
  "exec",
];

function unionScopes(a: readonly string[], b: readonly string[]): string[] {
  return [...new Set([...a, ...b])];
}

function unionExec(
  a: boolean | readonly string[],
  b: boolean | readonly string[],
): boolean | readonly string[] {
  if (a === true || b === true) return true;
  const aList = a === false ? [] : a;
  const bList = b === false ? [] : b;
  const merged = [...new Set([...aList, ...bList])];
  return merged.length === 0 ? false : merged;
}

function intersectExec(
  requested: boolean | readonly string[],
  granted: boolean | readonly string[],
): boolean | readonly string[] {
  if (requested === false || granted === false) return false;
  if (granted === true) return requested;
  if (requested === true) return granted;
  const result = requested.filter((c) => granted.includes(c));
  return result.length === 0 ? false : result;
}

function isExecCommandAllowed(command: string, granted: boolean | readonly string[]): boolean {
  if (granted === true) return true;
  if (granted === false) return false;
  return granted.includes(command);
}

export { EMPTY_PERMISSION_SET };

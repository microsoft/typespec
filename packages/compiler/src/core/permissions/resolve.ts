import { resolvePath } from "../path-utils.js";
import {
  createPermissionSet,
  findMissingPermissions,
  intersectPermissionSets,
  mergePermissionSets,
} from "./permission-set.js";
import {
  EMPTY_PERMISSION_SET,
  type Permission,
  type PermissionRequest,
  type PermissionSet,
} from "./types.js";

/**
 * Plain shape of a per-library permission grant as written in `tspconfig.yaml`.
 * Kept structural (rather than importing the config type) so the permissions
 * module stays free of a dependency on the config layer.
 */
export interface PermissionGrantInput {
  "fs-read"?: readonly string[];
  "fs-write"?: readonly string[];
  network?: readonly string[];
  env?: readonly string[];
  exec?: boolean | readonly string[];
}

export interface ResolveGrantOptions {
  /** Directory that relative grant paths are resolved against (the config dir). */
  readonly baseDir: string;
  /**
   * The emitter's output directory. Always granted for `fs-write` so emitters
   * can produce their output without an explicit grant. Should be absolute.
   */
  readonly outputDir?: string;
}

/** The outcome of resolving a library/emitter's requested permissions against a grant. */
export interface PermissionResolution {
  /** What the library/emitter asked for in its manifest. */
  readonly requested: PermissionSet;
  /** What the user granted in config (plus implicit output-dir write). */
  readonly granted: PermissionSet;
  /** The intersection actually handed to the sandbox. Never exceeds either side. */
  readonly effective: PermissionSet;
  /** Requested permissions the user did not grant. Empty means fully authorized. */
  readonly missing: Permission[];
}

/** Build the requested {@link PermissionSet} from a manifest's permission requests. */
export function manifestToPermissionSet(
  requests: readonly PermissionRequest[] | undefined,
): PermissionSet {
  if (!requests || requests.length === 0) {
    return EMPTY_PERMISSION_SET;
  }
  return createPermissionSet(requests.map((r) => r.permission));
}

/**
 * Build the granted {@link PermissionSet} from a user's config grant. Relative
 * path scopes are resolved against {@link ResolveGrantOptions.baseDir}, and the
 * emitter output directory is always added to the writable scopes.
 */
export function configGrantToPermissionSet(
  grant: PermissionGrantInput | undefined,
  options: ResolveGrantOptions,
): PermissionSet {
  const permissions: Permission[] = [];
  const resolve = (p: string) => resolvePath(options.baseDir, p);

  if (grant?.["fs-read"]?.length) {
    permissions.push({ kind: "fs-read", paths: grant["fs-read"].map(resolve) });
  }

  const writeScopes = grant?.["fs-write"]?.map(resolve) ?? [];
  const allWrites = options.outputDir
    ? [...writeScopes, resolvePath(options.outputDir)]
    : [...writeScopes];
  if (allWrites.length) {
    permissions.push({ kind: "fs-write", paths: allWrites });
  }

  if (grant?.network?.length) {
    permissions.push({ kind: "network", hosts: [...grant.network] });
  }
  if (grant?.env?.length) {
    permissions.push({ kind: "env", names: [...grant.env] });
  }
  if (grant?.exec === true) {
    permissions.push({ kind: "exec" });
  } else if (Array.isArray(grant?.exec) && grant.exec.length) {
    permissions.push({ kind: "exec", commands: [...grant.exec] });
  }

  return createPermissionSet(permissions);
}

/**
 * Resolve a library/emitter's manifest against the user's config grant, yielding
 * the effective permissions for the sandbox and the list of anything missing.
 */
export function resolvePermissions(
  requests: readonly PermissionRequest[] | undefined,
  grant: PermissionGrantInput | undefined,
  options: ResolveGrantOptions,
): PermissionResolution {
  const requested = manifestToPermissionSet(requests);
  const granted = configGrantToPermissionSet(grant, options);
  const missing = findMissingPermissions(requested, granted);

  // The intersection never exceeds what the emitter asked for *and* the user
  // granted. The emitter's own output directory is an exception: it is always
  // writable without an explicit request or grant, so merge it in directly
  // rather than gating it behind the intersection.
  const intersection = intersectPermissionSets(requested, granted);
  const effective = options.outputDir
    ? mergePermissionSets(
        intersection,
        createPermissionSet([{ kind: "fs-write", paths: [resolvePath(options.outputDir)] }]),
      )
    : intersection;

  return { requested, granted, effective, missing };
}

/**
 * Render a `tspconfig.yaml` snippet the user can paste to grant the `missing`
 * permissions to `libraryName`. Used in the `permission-not-granted` diagnostic.
 */
export function formatGrantSuggestion(libraryName: string, missing: readonly Permission[]): string {
  const lines: string[] = ["permissions:", `  "${libraryName}":`];
  for (const permission of missing) {
    switch (permission.kind) {
      case "fs-read":
      case "fs-write":
        lines.push(`    ${permission.kind}:`);
        for (const p of permission.paths) lines.push(`      - ${p}`);
        break;
      case "network":
        lines.push(`    network:`);
        for (const h of permission.hosts) lines.push(`      - ${h}`);
        break;
      case "env":
        lines.push(`    env:`);
        for (const n of permission.names) lines.push(`      - ${n}`);
        break;
      case "exec":
        if (permission.commands) {
          lines.push(`    exec:`);
          for (const c of permission.commands) lines.push(`      - ${c}`);
        } else {
          lines.push(`    exec: true`);
        }
        break;
    }
  }
  return lines.join("\n");
}

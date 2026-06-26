import type { PermissionSet } from "../types.js";

export interface NodeSandboxArgsOptions {
  /**
   * Read scopes the sandboxed process always needs regardless of the granted
   * permissions, e.g. the bootstrap script, the emitter module + its
   * `node_modules`, and the compiler installation. These are unioned with the
   * granted `fs-read` scopes. Should already be realpath-resolved.
   */
  readonly essentialReadScopes?: readonly string[];
  /**
   * Write scopes the sandboxed process always needs, e.g. a temp dir. Unioned
   * with the granted `fs-write` scopes. Should already be realpath-resolved.
   */
  readonly essentialWriteScopes?: readonly string[];
}

/**
 * Translate a granted {@link PermissionSet} into Node CLI flags that enforce it
 * via the (process-wide) permission model. The result is intended for the
 * `execArgv` of a forked child process.
 *
 * Important caveats, mirroring what the permission model actually covers:
 * - **fs-read / fs-write**: enforced. Paths MUST already be realpath-resolved by
 *   the caller (the model resolves real paths; e.g. `/tmp`→`/private/tmp`).
 * - **exec**: `--allow-child-process` is all-or-nothing; a command allow-list is
 *   NOT OS-enforceable, so any non-empty/`true` exec grant enables child
 *   processes and command filtering must be done by the broker.
 * - **network / env**: NOT covered by the permission model — enforced separately
 *   (broker-mediated network, curated `env`). They produce no flags here.
 */
export function permissionSetToNodeArgs(
  permissions: PermissionSet,
  options: NodeSandboxArgsOptions = {},
): string[] {
  const args = ["--permission"];

  const readScopes = uniq([...(options.essentialReadScopes ?? []), ...permissions.fsRead]);
  for (const scope of readScopes) {
    args.push(`--allow-fs-read=${scope}`);
  }

  const writeScopes = uniq([...(options.essentialWriteScopes ?? []), ...permissions.fsWrite]);
  for (const scope of writeScopes) {
    args.push(`--allow-fs-write=${scope}`);
  }

  if (permissions.exec === true || (Array.isArray(permissions.exec) && permissions.exec.length)) {
    args.push("--allow-child-process");
  }

  return args;
}

/**
 * Build the curated environment for the sandboxed process. Only the granted env
 * variable names are forwarded from `parentEnv`, plus a minimal set of variables
 * required for Node itself to run (e.g. `PATH`). Everything else is dropped so a
 * sandboxed emitter cannot read secrets from the ambient environment.
 */
export function buildSandboxEnv(
  permissions: PermissionSet,
  parentEnv: NodeJS.ProcessEnv,
  essentialNames: readonly string[] = ESSENTIAL_ENV_NAMES,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const name of essentialNames) {
    if (parentEnv[name] !== undefined) {
      env[name] = parentEnv[name];
    }
  }
  for (const name of permissions.env) {
    if (parentEnv[name] !== undefined) {
      env[name] = parentEnv[name];
    }
  }
  return env;
}

/** Environment variables Node/the OS generally needs to function. */
export const ESSENTIAL_ENV_NAMES: readonly string[] = [
  "PATH",
  "HOME",
  "TMPDIR",
  "TEMP",
  "TMP",
  "SystemRoot",
  "USERPROFILE",
  "NODE_OPTIONS",
];

function uniq(values: readonly string[]): string[] {
  return [...new Set(values)];
}

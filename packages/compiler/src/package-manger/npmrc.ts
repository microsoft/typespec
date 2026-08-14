// Node.js specific helpers to resolve the npm configuration(`.npmrc` files and `npm_config_*` environment variables)
// This is used so `tsp install` respect the registry and authentication configured by the user.
import { homedir } from "os";
import { getDirectoryPath, joinPaths, normalizePath } from "../core/path-utils.js";
import type { CompilerHost } from "../core/types.js";
import { defaultNpmRegistry } from "./npm-registry.js";

/** Resolved npm configuration */
export interface NpmConfig {
  /** All the resolved config entries. Keys are lowercased. */
  readonly values: ReadonlyMap<string, string>;

  /** Resolve the registry to use for the given package name.(Taking into account scoped registries) */
  getRegistry(packageName: string): string;

  /** Resolve the authentication headers to use when making a request to the given url. Returns an empty object if there is no credentials configured for that url. */
  getAuthHeaders(url: string): Record<string, string>;
}

const nodeModulesRegExp = /\/node_modules\//;

/**
 * Load the npm configuration applicable in the given directory.
 * Configs are resolved in the same order as npm(from the lowest to the highest priority):
 * global config, user config(`~/.npmrc`), project config(closest `.npmrc`) and `npm_config_*` environment variables.
 */
export async function resolveNpmConfig(
  host: CompilerHost,
  cwd: string,
  env: Record<string, string | undefined> = process.env,
): Promise<NpmConfig> {
  const values = new Map<string, string>();

  const files = [
    resolveGlobalConfigPath(env),
    resolveUserConfigPath(env),
    await findProjectConfigPath(host, cwd),
  ];

  for (const file of files) {
    if (file === undefined) continue;
    const content = await readFileIfExists(host, file);
    if (content === undefined) continue;
    for (const [key, value] of parseNpmrc(content, env)) {
      values.set(key, value);
    }
  }

  for (const [key, value] of loadEnvConfig(env)) {
    values.set(key, value);
  }

  return createNpmConfig(values, env);
}

/** Create a {@link NpmConfig} from the already resolved config entries. */
export function createNpmConfig(
  values: ReadonlyMap<string, string>,
  env: Record<string, string | undefined> = process.env,
): NpmConfig {
  return {
    values,
    getRegistry: (packageName) => getRegistry(values, packageName, env),
    getAuthHeaders: (url) => getAuthHeaders(values, url),
  };
}

function resolveUserConfigPath(env: Record<string, string | undefined>): string | undefined {
  const explicit = env["npm_config_userconfig"] ?? env["NPM_CONFIG_USERCONFIG"];
  if (explicit) return normalizePath(explicit);
  const home = env["HOME"] ?? env["USERPROFILE"] ?? homedir();
  return home ? joinPaths(normalizePath(home), ".npmrc") : undefined;
}

function resolveGlobalConfigPath(env: Record<string, string | undefined>): string | undefined {
  const explicit = env["npm_config_globalconfig"] ?? env["NPM_CONFIG_GLOBALCONFIG"];
  return explicit ? normalizePath(explicit) : undefined;
}

/** Find the closest `.npmrc` file walking up from the given directory. */
async function findProjectConfigPath(host: CompilerHost, cwd: string): Promise<string | undefined> {
  let current = "";
  let next = normalizePath(cwd);
  while (next !== current) {
    current = next;
    next = getDirectoryPath(current);
    if (nodeModulesRegExp.test(current)) continue;

    const path = joinPaths(current, ".npmrc");
    if (await isFile(host, path)) {
      return path;
    }
  }
  return undefined;
}

async function isFile(host: CompilerHost, path: string): Promise<boolean> {
  try {
    const stats = await host.stat(path);
    return stats.isFile();
  } catch (e: any) {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") return false;
    throw e;
  }
}

async function readFileIfExists(host: CompilerHost, path: string): Promise<string | undefined> {
  try {
    const file = await host.readFile(path);
    return file.text;
  } catch (e: any) {
    if (e.code === "ENOENT" || e.code === "ENOTDIR" || e.code === "EISDIR" || e.code === "EACCES") {
      return undefined;
    }
    throw e;
  }
}

/**
 * Parse the content of a `.npmrc` file.
 * Keys are lowercased and `${ENV_VAR}` references in values are replaced with the value of the environment variable.
 */
export function parseNpmrc(
  content: string,
  env: Record<string, string | undefined> = process.env,
): Map<string, string> {
  const result = new Map<string, string>();
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    // Comments and ini sections(not used by npm config) are ignored.
    if (line === "" || line.startsWith("#") || line.startsWith(";") || line.startsWith("[")) {
      continue;
    }
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    if (key === "") continue;
    const value = unquote(line.slice(index + 1).trim());
    result.set(key.toLowerCase(), replaceEnvVariables(value, env));
  }
  return result;
}

function unquote(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    if ((first === `"` || first === `'`) && value[value.length - 1] === first) {
      return value.slice(1, -1);
    }
  }
  return value;
}

/** Replace `${VAR}` with the value of the environment variable like npm does. */
function replaceEnvVariables(value: string, env: Record<string, string | undefined>): string {
  return value.replace(/\$\{([^}]+)\}/g, (match, name) => env[name] ?? match);
}

/** Load the config defined via `npm_config_*` environment variables. */
function loadEnvConfig(env: Record<string, string | undefined>): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) continue;
    const match = /^npm_config_(.+)$/i.exec(key);
    if (match === null) continue;
    result.set(match[1].toLowerCase(), value);
  }
  return result;
}

function getRegistry(
  values: ReadonlyMap<string, string>,
  packageName: string,
  env: Record<string, string | undefined>,
): string {
  // TypeSpec specific override takes precedence over any npm configuration.
  if (env["TYPESPEC_NPM_REGISTRY"]) {
    return trimTrailingSlash(env["TYPESPEC_NPM_REGISTRY"]);
  }
  const scope = packageName.startsWith("@") ? packageName.split("/")[0] : undefined;
  const registry =
    (scope && values.get(`${scope.toLowerCase()}:registry`)) ?? values.get("registry");
  return trimTrailingSlash(registry ?? defaultNpmRegistry);
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Resolve the authentication headers configured for the given url.
 * Credentials are configured per registry using the url without the protocol as a prefix.(e.g. `//registry.npmjs.org/:_authToken=abc`)
 */
function getAuthHeaders(values: ReadonlyMap<string, string>, url: string): Record<string, string> {
  if (!URL.canParse(url)) return {};
  const parsed = new URL(url);

  for (const prefix of getConfigPrefixes(parsed)) {
    const authToken = values.get(`${prefix}:_authtoken`);
    if (authToken) {
      return { authorization: `Bearer ${authToken}` };
    }
    const auth = values.get(`${prefix}:_auth`);
    if (auth) {
      return { authorization: `Basic ${auth}` };
    }
    const username = values.get(`${prefix}:username`);
    const password = values.get(`${prefix}:_password`);
    if (username && password) {
      const decodedPassword = Buffer.from(password, "base64").toString("utf8");
      const encoded = Buffer.from(`${username}:${decodedPassword}`, "utf8").toString("base64");
      return { authorization: `Basic ${encoded}` };
    }
  }
  return {};
}

/**
 * Compute the keys prefixes(`//host/path/`) that could hold the credentials for the given url from the most to the least specific.
 */
function getConfigPrefixes(url: URL): string[] {
  const prefixes: string[] = [];
  let path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  while (true) {
    prefixes.push(`//${url.host}${path}`.toLowerCase());
    // Also support the prefix defined without the trailing slash.
    if (path !== "/") {
      prefixes.push(`//${url.host}${path.slice(0, -1)}`.toLowerCase());
    } else {
      break;
    }
    path = path.slice(0, path.lastIndexOf("/", path.length - 2) + 1);
  }
  return prefixes;
}

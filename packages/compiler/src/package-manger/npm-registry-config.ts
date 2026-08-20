import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import type { NpmRegistryConfig } from "./npm-registry.js";

interface NpmrcAuthFields {
  auth?: string;
  authToken?: string;
  password?: string;
  username?: string;
}

export async function loadNpmRegistryConfig(): Promise<NpmRegistryConfig> {
  const npmrcPath = process.env["NPM_CONFIG_USERCONFIG"] ?? join(homedir(), ".npmrc");
  let content: string;
  try {
    content = await readFile(npmrcPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }

  const values = parseNpmrc(content);
  const registry = values.get("registry");
  const authFields = new Map<string, NpmrcAuthFields>();

  for (const [key, value] of values) {
    const separatorIndex = key.lastIndexOf(":");
    if (!key.startsWith("//") || separatorIndex === -1) {
      continue;
    }

    const scope = key.slice(0, separatorIndex);
    const field = key.slice(separatorIndex + 1);
    const fields = authFields.get(scope) ?? {};
    switch (field) {
      case "_auth":
        fields.auth = value;
        break;
      case "_authToken":
        fields.authToken = value;
        break;
      case "_password":
        fields.password = value;
        break;
      case "username":
        fields.username = value;
        break;
      default:
        continue;
    }
    authFields.set(scope, fields);
  }

  return {
    registry,
    authentication: [...authFields].flatMap(([scope, fields]) => {
      const authorization = createAuthorizationHeader(fields);
      return authorization === undefined ? [] : [{ scope, authorization }];
    }),
  };
}

function parseNpmrc(content: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#") || trimmed.startsWith(";")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/\$\{([^}]+)\}/g, (_, name: string) => process.env[name] ?? "");
    values.set(key, value);
  }
  return values;
}

function createAuthorizationHeader(fields: NpmrcAuthFields): string | undefined {
  if (fields.authToken !== undefined) {
    return `Bearer ${fields.authToken}`;
  }
  if (fields.auth !== undefined) {
    return `Basic ${fields.auth}`;
  }
  if (fields.username !== undefined && fields.password !== undefined) {
    const password = Buffer.from(fields.password, "base64").toString("utf8");
    return `Basic ${Buffer.from(`${fields.username}:${password}`).toString("base64")}`;
  }
  return undefined;
}

import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { parse } from "yaml";

export interface SampleConfig {
  directory?: false;
  title: string;
  description: string;
  llmstxt?: boolean;
  danger?: string;
  order?: number;
  playground?: boolean;
}

export interface SampleDirectoryConfig {
  directory: true;
  label?: string;
  danger?: string;
  order?: number;
  playground?: boolean;
}

export interface SampleCategory {
  id: string;
  label: string;
  order?: number;
}

export interface SampleEntry {
  id: string;
  directory: string;
  config: SampleConfig;
  category?: SampleCategory;
  playground: boolean;
  tspFiles: string[];
}

export interface SampleCatalog {
  samples: SampleEntry[];
  directories: Map<string, SampleDirectoryConfig>;
}

interface LoadedConfig {
  id: string;
  directory: string;
  config: SampleConfig | SampleDirectoryConfig;
}

/**
 * Discover and validate samples below the given specs directory.
 */
export async function loadSampleCatalog(specsDir: string): Promise<SampleCatalog> {
  const root = resolve(specsDir);
  const loadedConfigs: LoadedConfig[] = [];
  const entrypointDirs = new Set<string>();

  await walk(root);

  const configByDirectory = new Map(loadedConfigs.map((x) => [x.directory, x]));
  const directories = new Map<string, SampleDirectoryConfig>();
  const samples: SampleEntry[] = [];
  const titles = new Map<string, string>();

  for (const loaded of loadedConfigs) {
    if (loaded.config.directory === true) {
      directories.set(loaded.id, loaded.config);
      continue;
    }

    const existingTitle = titles.get(loaded.config.title);
    if (existingTitle) {
      throw new Error(
        `Sample "${loaded.id}" has duplicate title "${loaded.config.title}" also used by "${existingTitle}".`,
      );
    }
    titles.set(loaded.config.title, loaded.id);

    const tspFiles = await findTspFiles(loaded.directory);
    const hasMain = tspFiles.some((x) => x === resolve(loaded.directory, "main.tsp"));
    const hasPackage = entrypointDirs.has(loaded.directory);
    if (!hasMain && !hasPackage) {
      throw new Error(
        `Sample "${loaded.id}" must contain main.tsp or a package.json TypeSpec entrypoint.`,
      );
    }

    const ancestors = getAncestorDirectories(loaded.directory, root);
    const directoryConfigs = ancestors
      .map((x) => configByDirectory.get(x))
      .filter(
        (x): x is LoadedConfig & { config: SampleDirectoryConfig } => x?.config.directory === true,
      );
    const categoryConfig = directoryConfigs.at(-1);

    samples.push({
      id: loaded.id,
      directory: loaded.directory,
      config: loaded.config,
      category: categoryConfig
        ? {
            id: categoryConfig.id,
            label: categoryConfig.config.label ?? formatLabel(categoryConfig.id.split("/").at(-1)!),
            order: categoryConfig.config.order,
          }
        : undefined,
      playground:
        loaded.config.playground !== false &&
        directoryConfigs.every((x) => x.config.playground !== false),
      tspFiles,
    });
  }

  for (const entrypointDir of entrypointDirs) {
    const loaded = configByDirectory.get(entrypointDir);
    if (!loaded || loaded.config.directory === true) {
      throw new Error(
        `Sample at "${toPosix(relative(root, entrypointDir))}" is missing sample-config.yaml.`,
      );
    }
  }

  samples.sort(
    (a, b) =>
      (a.category?.order ?? Number.POSITIVE_INFINITY) -
        (b.category?.order ?? Number.POSITIVE_INFINITY) ||
      (a.config.order ?? Number.POSITIVE_INFINITY) - (b.config.order ?? Number.POSITIVE_INFINITY) ||
      a.id.localeCompare(b.id),
  );

  return { samples, directories };

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const fullPath = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name === "sample-config.yaml") {
        const id = toPosix(relative(root, directory));
        loadedConfigs.push({
          id,
          directory,
          config: parseSampleConfig(await readFile(fullPath, "utf-8"), fullPath),
        });
      } else if (entry.name === "main.tsp" || entry.name === "package.json") {
        entrypointDirs.add(directory);
      }
    }
  }
}

function parseSampleConfig(
  content: string,
  configPath: string,
): SampleConfig | SampleDirectoryConfig {
  let value: unknown;
  try {
    value = parse(content);
  } catch (error) {
    throw new Error(`Invalid YAML in ${configPath}.`, { cause: error });
  }

  if (!isRecord(value)) {
    throw new Error(`Sample config at ${configPath} must be a YAML object.`);
  }

  if (value.directory === true) {
    validateKnownKeys(
      value,
      new Set(["directory", "label", "danger", "order", "playground"]),
      configPath,
    );
    validateOptionalString(value, "label", configPath);
    validateOptionalString(value, "danger", configPath);
    validateOptionalNumber(value, "order", configPath);
    validateOptionalBoolean(value, "playground", configPath);
    return value as unknown as SampleDirectoryConfig;
  }

  validateKnownKeys(
    value,
    new Set(["directory", "title", "description", "llmstxt", "danger", "order", "playground"]),
    configPath,
  );
  if (value.directory !== undefined && value.directory !== false) {
    throw new Error(`Sample config at ${configPath} has invalid "directory"; expected false.`);
  }
  validateRequiredString(value, "title", configPath);
  validateRequiredString(value, "description", configPath);
  validateOptionalBoolean(value, "llmstxt", configPath);
  validateOptionalString(value, "danger", configPath);
  validateOptionalNumber(value, "order", configPath);
  validateOptionalBoolean(value, "playground", configPath);
  return value as unknown as SampleConfig;
}

function validateKnownKeys(
  value: Record<string, unknown>,
  keys: Set<string>,
  configPath: string,
): void {
  const unknown = Object.keys(value).find((x) => !keys.has(x));
  if (unknown) {
    throw new Error(`Sample config at ${configPath} has unknown field "${unknown}".`);
  }
}

async function findTspFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  await walk(directory);
  return files.sort();

  async function walk(current: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const fullPath = resolve(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith(".tsp")) {
        files.push(fullPath);
      }
    }
  }
}

function getAncestorDirectories(directory: string, root: string): string[] {
  const ancestors: string[] = [];
  let current = dirname(directory);
  while (current !== root && current.startsWith(`${root}${sep}`)) {
    ancestors.unshift(current);
    current = dirname(current);
  }
  return ancestors;
}

function formatLabel(value: string): string {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toPosix(path: string): string {
  return path.split(sep).join("/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateRequiredString(
  value: Record<string, unknown>,
  key: string,
  configPath: string,
): void {
  if (typeof value[key] !== "string" || value[key].trim() === "") {
    throw new Error(`Sample config at ${configPath} requires a non-empty "${key}" field.`);
  }
}

function validateOptionalString(
  value: Record<string, unknown>,
  key: string,
  configPath: string,
): void {
  if (value[key] !== undefined && typeof value[key] !== "string") {
    throw new Error(`Sample config at ${configPath} has invalid "${key}"; expected a string.`);
  }
}

function validateOptionalNumber(
  value: Record<string, unknown>,
  key: string,
  configPath: string,
): void {
  if (value[key] !== undefined && typeof value[key] !== "number") {
    throw new Error(`Sample config at ${configPath} has invalid "${key}"; expected a number.`);
  }
}

function validateOptionalBoolean(
  value: Record<string, unknown>,
  key: string,
  configPath: string,
): void {
  if (value[key] !== undefined && typeof value[key] !== "boolean") {
    throw new Error(`Sample config at ${configPath} has invalid "${key}"; expected a boolean.`);
  }
}

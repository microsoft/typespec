import { stringify } from "yaml";
import { TypeSpecConfigFilename } from "../config/config-loader.js";
import { formatTypeSpec } from "../core/formatter.js";
import { getDirectoryPath, joinPaths } from "../core/path-utils.js";
import { CompilerHost } from "../core/types.js";
import { PackageJson } from "../types/package-json.js";
import { readUrlOrPath, resolveRelativeUrlOrPath } from "../utils/misc.js";
import { FileTemplatingContext, createFileTemplatingContext, render } from "./file-templating.js";
import {
  InitTemplate,
  InitTemplateFile,
  InitTemplateLibrary,
  InitTemplateLibrarySpec,
} from "./init-template.js";

export interface ScaffoldingConfig {
  /** Template used to resolve that config */
  template: InitTemplate;

  /**
   * Path where this template was loaded from.
   */
  baseUri: string;

  /**
   * Directory full path where the project should be initialized.
   */
  directory: string;

  /**
   * folder name where the project should be initialized.
   */
  folderName: string;

  /**
   * Name of the project.
   */
  name: string;

  /**
   * List of libraries to include
   */
  libraries: InitTemplateLibrarySpec[];

  /**
   * Whether to generate a .gitignore file.
   */
  includeGitignore: boolean;

  /**
   * Custom parameters provided in the tempalates.
   */
  parameters: Record<string, any>;

  /**
   * Selected emitters the tempalates.
   */
  emitters: Record<string, any>;
}

export function normalizeLibrary(library: InitTemplateLibrary): InitTemplateLibrarySpec {
  if (typeof library === "string") {
    return { name: library };
  }
  return library;
}

export function makeScaffoldingConfig(
  template: InitTemplate,
  config: Partial<ScaffoldingConfig>,
): ScaffoldingConfig {
  return {
    template,
    libraries: config.libraries ?? template.libraries?.map(normalizeLibrary) ?? [],
    baseUri: config.baseUri ?? ".",
    name: config.name ?? "",
    directory: config.directory ?? "",
    folderName: config.folderName ?? "",
    parameters: config.parameters ?? {},
    includeGitignore: config.includeGitignore ?? true,
    emitters: config.emitters ?? {},
    ...config,
  };
}

/**
 * Scaffold a new TypeSpec project using the given scaffolding config.
 * @param host
 * @param config
 */
export async function scaffoldNewProject(host: CompilerHost, config: ScaffoldingConfig) {
  await host.mkdirp(config.directory);
  await writePackageJson(host, config);
  await writeConfig(host, config);
  await writeMain(host, config);
  await writeGitignore(host, config);
  await writeFiles(host, config);
}

function isFileSkipGeneration(fileName: string, files: InitTemplateFile[]): boolean {
  for (const file of files) {
    if (file.destination === fileName) {
      return file.skipGeneration ?? false;
    }
  }
  return false;
}

async function writePackageJson(host: CompilerHost, config: ScaffoldingConfig) {
  if (isFileSkipGeneration("package.json", config.template.files ?? [])) {
    return;
  }
  const peerDependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};

  if (!config.template.skipCompilerPackage) {
    peerDependencies["@typespec/compiler"] = "latest";
    devDependencies["@typespec/compiler"] = "latest";
  }

  for (const library of config.libraries) {
    peerDependencies[library.name] = await getPackageVersion(library);
    devDependencies[library.name] = await getPackageVersion(library);
  }

  for (const key of Object.keys(config.emitters)) {
    peerDependencies[key] = await getPackageVersion(config.emitters[key]);
    devDependencies[key] = await getPackageVersion(config.emitters[key]);
  }

  const packageJson: PackageJson = {
    name: config.name,
    version: "0.1.0",
    type: "module",
    peerDependencies,
    devDependencies,
    private: true,
  };

  return host.writeFile(
    joinPaths(config.directory, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );
}

const placeholderConfig = `
# extends: ../tspconfig.yaml                    # Extend another config file
# emit:                                         # Emitter name
#   - "<emitter-name"
# options:                                      # Emitter options
#   <emitter-name>:
#    "<option-name>": "<option-value>"
# environment-variables:                        # Environment variables which can be used to interpolate emitter options
#   <variable-name>:
#     default: "<variable-default>"
# parameters:                                   # Parameters which can be used to interpolate emitter options
#   <param-name>:
#     default: "<param-default>"
# trace:                                        # Trace areas to enable tracing
#  - "<trace-name>"
# warn-as-error: true                           # Treat warnings as errors
# output-dir: "{project-root}/_generated"       # Configure the base output directory for all emitters
`.trim();
async function writeConfig(host: CompilerHost, config: ScaffoldingConfig) {
  if (isFileSkipGeneration(TypeSpecConfigFilename, config.template.files ?? [])) {
    return;
  }

  let content: string = placeholderConfig;
  if (config.template.config !== undefined && Object.keys(config.template.config).length > 0) {
    content = stringify(config.template.config);
  } else if (Object.keys(config.emitters).length > 0) {
    const emitters = Object.keys(config.emitters);
    const options = Object.fromEntries(
      Object.entries(config.emitters).map(([key, emitter]) => [key, emitter.options]),
    );
    content = stringify({
      emit: emitters,
      options: Object.keys(options).length > 0 ? options : undefined,
    });
  }
  return host.writeFile(joinPaths(config.directory, TypeSpecConfigFilename), content);
}

async function writeMain(host: CompilerHost, config: ScaffoldingConfig) {
  if (isFileSkipGeneration("main.tsp", config.template.files ?? [])) {
    return;
  }
  const dependencies: Record<string, string> = {};

  for (const library of config.libraries) {
    dependencies[library.name] = await getPackageVersion(library);
  }

  const lines = [...config.libraries.map((x) => `import "${x.name}";`), ""];
  const content = lines.join("\n");

  return host.writeFile(joinPaths(config.directory, "main.tsp"), await formatTypeSpec(content));
}

const defaultGitignore = `
# MacOS
.DS_Store

# Default TypeSpec output
tsp-output/
dist/

# Dependency directories
node_modules/
`.trim();
async function writeGitignore(host: CompilerHost, config: ScaffoldingConfig) {
  if (!config.includeGitignore || isFileSkipGeneration(".gitignore", config.template.files ?? [])) {
    return;
  }

  return host.writeFile(joinPaths(config.directory, ".gitignore"), defaultGitignore);
}

async function writeFiles(host: CompilerHost, config: ScaffoldingConfig) {
  const templateContext = createFileTemplatingContext(config);
  if (!config.template.files) {
    return;
  }
  for (const file of config.template.files) {
    if (file.skipGeneration !== true) {
      await writeFile(host, config, templateContext, file);
    }
  }
}

async function writeFile(
  host: CompilerHost,
  config: ScaffoldingConfig,
  context: FileTemplatingContext,
  file: InitTemplateFile,
) {
  const baseDir = config.baseUri + "/";
  const template = await readUrlOrPath(host, resolveRelativeUrlOrPath(baseDir, file.path));
  const content = render(template.text, context);
  const destinationFilePath = joinPaths(config.directory, file.destination);
  // create folders in case they don't exist
  await host.mkdirp(getDirectoryPath(destinationFilePath) + "/");
  return host.writeFile(joinPaths(config.directory, file.destination), content);
}

async function getPackageVersion(packageInfo: { version?: string }): Promise<string> {
  // TODO: Resolve 'latest' version from npm, issue #1919
  return packageInfo.version ?? "latest";
}

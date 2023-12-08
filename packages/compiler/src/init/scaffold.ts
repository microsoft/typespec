import { stringify } from "yaml";
import { TypeSpecConfigFilename } from "../config/config-loader.js";
import { formatTypeSpec } from "../core/formatter.js";
import { NodePackage } from "../core/module-resolver.js";
import { getDirectoryPath, joinPaths } from "../core/path-utils.js";
import { CompilerHost } from "../core/types.js";
import { readUrlOrPath, resolveRelativeUrlOrPath } from "../core/util.js";
import { FileTemplatingContext, createFileTemplatingContext, render } from "./file-templating.js";
import { InitTemplate, InitTemplateFile, InitTemplateLibrarySpec } from "./init-template.js";

export interface ScaffoldingConfig {
  /** Template used to resolve that config */
  template: InitTemplate;

  /**
   * Path where this template was loaded from.
   */
  templateUri: string;

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
   * Custom parameters provided in the tempalates.
   */
  parameters: Record<string, any>;
}

export function makeScaffoldingConfig(
  template: InitTemplate,
  config: Partial<ScaffoldingConfig>
): ScaffoldingConfig {
  return {
    template,
    libraries: config.libraries ?? [],
    templateUri: config.templateUri ?? ".",
    name: config.name ?? "",
    directory: config.directory ?? "",
    folderName: config.folderName ?? "",
    parameters: config.parameters ?? {},
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
  await writeFiles(host, config);
}

function isFileSkipGeneration(fileName: string, files: InitTemplateFile[]): boolean {
  for (const file of files) {
    if (file.path === fileName) {
      return file.skipGeneration ?? false;
    }
  }
  return false;
}

async function writePackageJson(host: CompilerHost, config: ScaffoldingConfig) {
  if (isFileSkipGeneration("package.json", config.template.files ?? [])) {
    return;
  }
  const dependencies: Record<string, string> = {};

  if (!config.template.skipCompilerPackage) {
    dependencies["@typespec/compiler"] = "latest";
  }

  for (const library of config.libraries) {
    dependencies[library.name] = await getLibraryVersion(library);
  }

  const packageJson: NodePackage = {
    name: config.name,
    version: "0.1.0",
    type: "module",
    dependencies,
    private: true,
  };

  return host.writeFile(
    joinPaths(config.directory, "package.json"),
    JSON.stringify(packageJson, null, 2)
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
  const content = config.template.config ? stringify(config.template.config) : placeholderConfig;
  return host.writeFile(joinPaths(config.directory, TypeSpecConfigFilename), content);
}

async function writeMain(host: CompilerHost, config: ScaffoldingConfig) {
  if (isFileSkipGeneration("main.tsp", config.template.files ?? [])) {
    return;
  }
  const dependencies: Record<string, string> = {};

  for (const library of config.libraries) {
    dependencies[library.name] = await getLibraryVersion(library);
  }

  const lines = [...config.libraries.map((x) => `import "${x.name}";`), ""];
  const content = lines.join("\n");

  return host.writeFile(joinPaths(config.directory, "main.tsp"), await formatTypeSpec(content));
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
  file: InitTemplateFile
) {
  const baseDir = getDirectoryPath(config.templateUri) + "/";
  const template = await readUrlOrPath(host, resolveRelativeUrlOrPath(baseDir, file.path));
  const content = render(template.text, context);
  const destinationFilePath = joinPaths(config.directory, file.destination);
  // create folders in case they don't exist
  await host.mkdirp(getDirectoryPath(destinationFilePath) + "/");
  return host.writeFile(joinPaths(config.directory, file.destination), content);
}

async function getLibraryVersion(library: InitTemplateLibrarySpec): Promise<string> {
  // TODO: Resolve 'latest' version from npm, issue #1919
  return library.version ?? "latest";
}

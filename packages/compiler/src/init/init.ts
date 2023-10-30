import { readdir } from "fs/promises";
import Mustache from "mustache";
import prompts from "prompts";
import * as semver from "semver";
import { stringify } from "yaml";
import { TypeSpecConfigFilename } from "../config/config-loader.js";
import { formatTypeSpec } from "../core/formatter.js";
import { createDiagnostic } from "../core/messages.js";
import { NodePackage } from "../core/module-resolver.js";
import { getBaseFileName, getDirectoryPath, joinPaths } from "../core/path-utils.js";
import { createJSONSchemaValidator } from "../core/schema-validator.js";
import { CompilerHost, Diagnostic, NoTarget, SourceFile } from "../core/types.js";
import { readUrlOrPath, resolveRelativeUrlOrPath } from "../core/util.js";
import { MANIFEST } from "../manifest.js";
import {
  InitTemplate,
  InitTemplateFile,
  InitTemplateLibrarySpec,
  InitTemplateSchema,
} from "./init-template.js";

export interface ScaffoldingConfig extends InitTemplate {
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
   * A flag to indicate not adding @typespec/compiler package to package.json.
   * Other libraries may already brought in the dependency such as Azure template.
   */
  skipCompilerPackage: boolean;

  /**
   * Custom parameters provided in the tempalates.
   */
  parameters: Record<string, any>;

  /**
   * NormalizeVersion function replaces `-` with `_`.
   */
  normalizeVersion: () => (text: string, render: any) => string;

  /**
   * toLowerCase function for template replacement
   */
  toLowerCase: () => (text: string, render: any) => string;

  /**
   * Normalize package name for langauges other than C#. It replaces `.` with `-` and toLowerCase
   */
  normalizePackageName: () => (text: string, render: any) => string;
}

interface TemplatesUrl {
  /** The original URL specified by the user. */
  url: string;
  /** The final URL after HTTP redirects. Populated when template is downloaded. */
  finalUrl?: string;
  /** The actual template file. Populated when template is downloaded. */
  file?: SourceFile;
}

const normalizeVersion = function () {
  return function (text: string, render: any): string {
    return render(text).replaceAll("-", "_");
  };
};

const toLowerCase = function () {
  return function (text: string, render: any): string {
    return render(text).toLowerCase();
  };
};

const normalizePackageName = function () {
  return function (text: string, render: any): string {
    return render(text).replaceAll(".", "-").toLowerCase();
  };
};

export function makeScaffoldingConfig(config: Partial<ScaffoldingConfig>): ScaffoldingConfig {
  return {
    title: config.title ?? "",
    description: config.description ?? "",
    compilerVersion: config.compilerVersion ?? "",
    templateUri: config.templateUri ?? ".",
    libraries: config.libraries ?? [],
    name: config.name ?? "",
    directory: config.directory ?? "",
    skipCompilerPackage: config.skipCompilerPackage ?? false,
    folderName: config.folderName ?? "",
    parameters: config.parameters ?? {},
    config: config.config,
    files: config.files,
    normalizeVersion: config.normalizeVersion ?? normalizeVersion,
    toLowerCase: config.toLowerCase ?? toLowerCase,
    normalizePackageName: config.normalizePackageName ?? normalizePackageName,
  };
}

export async function initTypeSpecProject(
  host: CompilerHost,
  directory: string,
  templatesUrl?: string
) {
  if (!(await confirmDirectoryEmpty(directory))) {
    return;
  }

  const folderName = getBaseFileName(directory);
  const url: TemplatesUrl | undefined = templatesUrl ? { url: templatesUrl } : undefined;

  // Download template configuration and prompt user to select a template
  // No validation is done until one has been selected
  const templates = url === undefined ? builtInTemplates : await downloadTemplates(host, url);
  const templateName = await promptTemplateSelection(templates, url);

  // Validate minimum compiler version for non built-in templates
  if (url !== undefined && !(await validateTemplate(templates[templateName], url))) {
    return;
  }

  const template = templates[templateName] as InitTemplate;
  if (template.description) {
    // eslint-disable-next-line no-console
    console.log(template.description);
  }
  const { name } = await prompts([
    {
      type: "text",
      name: "name",
      message: `Project name`,
      initial: folderName,
    },
  ]);

  const libraries = await selectLibraries(template);
  const parameters = await promptCustomParameters(template);
  const scaffoldingConfig = makeScaffoldingConfig({
    ...template,
    templateUri: url?.finalUrl ?? ".",
    libraries,
    name,
    directory,
    skipCompilerPackage: template.skipCompilerPackage ?? false,
    folderName,
    parameters,
    normalizeVersion,
    toLowerCase,
    normalizePackageName,
  });

  await scaffoldNewProject(host, scaffoldingConfig);

  // eslint-disable-next-line no-console
  console.log("TypeSpec init completed. You can run `tsp install` now to install dependencies.");

  // eslint-disable-next-line no-console
  console.log("Project created successfully.");
}

async function promptCustomParameters(template: InitTemplate): Promise<Record<string, any>> {
  if (!template.inputs) {
    return {};
  }

  const promptList = [...Object.entries(template.inputs)].map(([name, input]) => {
    return {
      name,
      type: input.type,
      message: input.description,
      initial: input.initialValue,
    };
  });
  return await prompts(promptList);
}

async function isDirectoryEmpty(directory: string) {
  try {
    const files = await readdir(directory);
    return files.length === 0;
  } catch {
    return true;
  }
}

async function confirmDirectoryEmpty(directory: string) {
  if (await isDirectoryEmpty(directory)) {
    return true;
  }

  return confirm(
    `Folder '${directory}' is not empty. Are you sure you want to initialize a new project here?`
  );
}

const builtInTemplates: Record<string, InitTemplate> = {
  empty: {
    title: "Empty project",
    description: "Create an empty project.",
    libraries: [],
    compilerVersion: MANIFEST.version,
  },
  rest: {
    title: "Generic Rest API",
    description: "Create a project representing a generic Rest API",
    compilerVersion: MANIFEST.version,
    libraries: ["@typespec/http", "@typespec/rest", "@typespec/openapi3"],
    config: {
      emit: ["@typespec/openapi3"],
    },
  },
};

async function confirm(message: string): Promise<boolean> {
  const { confirm } = await prompts({
    name: "confirm",
    type: "confirm",
    message,
    initial: true,
  });
  return confirm;
}

async function downloadTemplates(
  host: CompilerHost,
  templatesUrl: TemplatesUrl
): Promise<Record<string, unknown>> {
  let file: SourceFile;
  try {
    file = await readUrlOrPath(host, templatesUrl.url);
    templatesUrl.finalUrl = file.path;
    templatesUrl.file = file;
  } catch (e: any) {
    throw new InitTemplateError([
      createDiagnostic({
        code: "init-template-download-failed",
        target: NoTarget,
        format: { url: templatesUrl.url, message: e.message },
      }),
    ]);
  }

  let json: unknown;
  try {
    json = JSON.parse(file.text);
  } catch (e: any) {
    throw new InitTemplateError([
      createDiagnostic({
        code: "init-template-invalid-json",
        target: NoTarget,
        format: { url: templatesUrl.url, message: e.message },
      }),
    ]);
  }

  return json as Record<string, unknown>;
}

async function promptTemplateSelection(
  templates: Record<string, any>,
  templatesUrl: TemplatesUrl | undefined
): Promise<string> {
  const { templateName } = await prompts({
    type: "select",
    name: "templateName",
    message: "Please select a template",
    choices: Object.entries(templates).map(([id, template]) => {
      return {
        value: id,
        description: template.description,
        title:
          template.title +
          `\tmin compiler ver: ${
            template.compilerVersion ? template.compilerVersion : "-not specified-"
          }`,
      };
    }),
  });

  const template = templates[templateName];
  if (!template) {
    throw new Error(`Unexpected error: Cannot find template ${templateName}`);
  }

  return templateName;
}

type ValidationResult = {
  valid: boolean;
  diagnostics: readonly Diagnostic[];
};

async function validateTemplate(template: any, templatesUrl: TemplatesUrl): Promise<boolean> {
  // After selection, validate the template definition
  const currentCompilerVersion = MANIFEST.version;
  const validationTarget = templatesUrl.file as SourceFile;
  let validationResult: ValidationResult;
  // 1. If current version > compilerVersion, proceed with strict validation
  if (template.compilerVersion && semver.gte(currentCompilerVersion, template.compilerVersion)) {
    validationResult = validateTemplateDefinitions(template, validationTarget, true);

    // 1.1 If strict validation fails, try relaxed validation
    if (!validationResult.valid) {
      validationResult = validateTemplateDefinitions(template, validationTarget, false);
    }
  } else {
    // 2. if version mis-match or none specified, warn and prompt user to continue or not
    const confirmationMessage = template.compilerVersion
      ? `The template you selected is designed for tsp version ${template.compilerVersion}. You are currently using tsp version ${currentCompilerVersion}.`
      : `The template you selected did not specify minimum support compiler version. You are currently using tsp version ${currentCompilerVersion}.`;
    if (
      await confirm(
        `${confirmationMessage} The project created may not be correct. Do you want to continue?`
      )
    ) {
      // 2.1 If user choose to continue, proceed with relaxed validation
      validationResult = validateTemplateDefinitions(template, validationTarget, false);
    } else {
      return false;
    }
  }

  // 3. If even relaxed validation fails, still prompt user to continue or not
  if (!validationResult.valid) {
    logDiagnostics(validationResult.diagnostics);

    return await confirm(
      "Template schema failed. The project created may not be correct. Do you want to continue?"
    );
  }
  return true;
}

function getLibrarySpec(library: string | InitTemplateLibrarySpec): InitTemplateLibrarySpec {
  return typeof library === "string" ? { name: library } : library;
}

async function getLibraryVersion(library: InitTemplateLibrarySpec): Promise<string> {
  // TODO: Resolve 'latest' version from npm, issue #1919
  return library.version ?? "latest";
}

async function selectLibraries(template: InitTemplate): Promise<InitTemplateLibrarySpec[]> {
  if (template.libraries.length === 0) {
    return [];
  }

  const libraryChoices = template.libraries.map((x) => ({
    ...getLibrarySpec(x),
    description: "",
  }));

  const { libraries } = await prompts({
    type: "multiselect",
    name: "libraries",
    message: "Update the libraries?",
    choices: libraryChoices.map((x) => {
      return {
        title: x.name,
        description: x.description,
        value: x,
        selected: true,
      };
    }),
    initial: template.libraries as any,
  });

  return libraries;
}

export async function scaffoldNewProject(host: CompilerHost, config: ScaffoldingConfig) {
  await writePackageJson(host, config);
  await writeConfig(host, config);
  await writeMain(host, config);
  await writeFiles(host, config);
}

async function writePackageJson(host: CompilerHost, config: ScaffoldingConfig) {
  if (isFileSkipGeneration("package.json", config.files ?? [])) {
    return;
  }
  const dependencies: Record<string, string> = {};

  if (!config.skipCompilerPackage) {
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
  if (isFileSkipGeneration(TypeSpecConfigFilename, config.files ?? [])) {
    return;
  }
  const content = config.config ? stringify(config.config) : placeholderConfig;
  return host.writeFile(joinPaths(config.directory, TypeSpecConfigFilename), content);
}

async function writeMain(host: CompilerHost, config: ScaffoldingConfig) {
  if (isFileSkipGeneration("main.tsp", config.files ?? [])) {
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
  if (!config.files) {
    return;
  }
  for (const file of config.files) {
    if (file.skipGeneration !== true) {
      await writeFile(host, config, file);
    }
  }
}

async function writeFile(host: CompilerHost, config: ScaffoldingConfig, file: InitTemplateFile) {
  const baseDir = getDirectoryPath(config.templateUri) + "/";
  const template = await readUrlOrPath(host, resolveRelativeUrlOrPath(baseDir, file.path));
  const content = Mustache.render(template.text, config);
  const destinationFilePath = joinPaths(config.directory, file.destination);
  // create folders in case they don't exist
  await host.mkdirp(getDirectoryPath(destinationFilePath) + "/");
  return host.writeFile(joinPaths(config.directory, file.destination), content);
}

/**
 * Error thrown when init template acquisition fails or template is invalid.
 *
 * Contains diagnostics that can be logged to the user.
 */
export class InitTemplateError extends Error {
  constructor(public diagnostics: readonly Diagnostic[]) {
    super();
  }
}

function validateTemplateDefinitions(
  template: unknown,
  templateName: SourceFile,
  strictValidation: boolean
): ValidationResult {
  const validator = createJSONSchemaValidator(InitTemplateSchema, {
    strict: strictValidation,
  });
  const diagnostics = validator.validate(template, templateName);
  return { valid: diagnostics.length === 0, diagnostics };
}

function isFileSkipGeneration(fileName: string, files: InitTemplateFile[]): boolean {
  for (const file of files) {
    if (file.path === fileName) {
      return file.skipGeneration;
    }
  }
  return false;
}

function logDiagnostics(diagnostics: readonly Diagnostic[]): void {
  diagnostics.forEach((diagnostic) => {
    // eslint-disable-next-line no-console
    console.log(diagnostic.message);
  });
}

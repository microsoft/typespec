import { readdir } from "fs/promises";
import pc from "picocolors";
import prompts from "prompts";
import * as semver from "semver";
import { createDiagnostic } from "../core/messages.js";
import { getBaseFileName, getDirectoryPath } from "../core/path-utils.js";
import { createJSONSchemaValidator } from "../core/schema-validator.js";
import { CompilerHost, Diagnostic, NoTarget, SourceFile } from "../core/types.js";
import { MANIFEST } from "../manifest.js";
import { readUrlOrPath } from "../utils/misc.js";
import { TypeSpecCoreTemplates } from "./core-templates.js";
import { InitTemplate, InitTemplateLibrarySpec, InitTemplateSchema } from "./init-template.js";
import { makeScaffoldingConfig, normalizeLibrary, scaffoldNewProject } from "./scaffold.js";

export interface InitTypeSpecProjectOptions {
  templatesUrl?: string;
  template?: string;
}

export async function initTypeSpecProject(
  host: CompilerHost,
  directory: string,
  options: InitTypeSpecProjectOptions = {},
) {
  if (!(await confirmDirectoryEmpty(directory))) {
    return;
  }

  const folderName = getBaseFileName(directory);

  // Download template configuration and prompt user to select a template
  // No validation is done until one has been selected
  const result =
    options.templatesUrl === undefined
      ? (TypeSpecCoreTemplates as LoadedTemplate)
      : await downloadTemplates(host, options.templatesUrl);
  const templateName = options.template ?? (await promptTemplateSelection(result.templates));

  // Validate minimum compiler version for non built-in templates
  if (
    result !== TypeSpecCoreTemplates &&
    !(await validateTemplate(result.templates[templateName], result))
  ) {
    return;
  }

  const template = result.templates[templateName] as InitTemplate;
  if (template.description) {
    // eslint-disable-next-line no-console
    console.log(template.description);
  }
  const { name, includeGitignore } = await prompts([
    {
      type: "text",
      name: "name",
      message: `Project name`,
      initial: folderName,
    },
    {
      type: "confirm",
      name: "includeGitignore",
      message: "Do you want to generate a .gitignore file?",
      initial: true,
    },
  ]);

  const libraries = await selectLibraries(template);
  const parameters = await promptCustomParameters(template);
  const scaffoldingConfig = makeScaffoldingConfig(template, {
    baseUri: result.baseUri,
    libraries,
    name,
    directory,
    folderName,
    parameters,
    includeGitignore,
  });

  await scaffoldNewProject(host, scaffoldingConfig);

  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.log("TypeSpec init completed. You can run `tsp install` now to install dependencies.");

  // eslint-disable-next-line no-console
  console.log(pc.green("Project created successfully."));
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
    `Folder '${directory}' is not empty. Are you sure you want to initialize a new project here?`,
  );
}

async function confirm(message: string): Promise<boolean> {
  const { confirm } = await prompts({
    name: "confirm",
    type: "confirm",
    message,
    initial: true,
  });
  return confirm;
}

export interface LoadedTemplate {
  readonly baseUri: string;
  readonly templates: Record<string, InitTemplate>;
  readonly file: SourceFile;
}
async function downloadTemplates(host: CompilerHost, url: string): Promise<LoadedTemplate> {
  let file: SourceFile;
  try {
    file = await readUrlOrPath(host, url);
  } catch (e: any) {
    throw new InitTemplateError([
      createDiagnostic({
        code: "init-template-download-failed",
        target: NoTarget,
        format: { url: url, message: e.message },
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
        format: { url: url, message: e.message },
      }),
    ]);
  }

  return { templates: json as any, baseUri: getDirectoryPath(file.path), file };
}

async function promptTemplateSelection(templates: Record<string, any>): Promise<string> {
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

async function validateTemplate(template: any, loaded: LoadedTemplate): Promise<boolean> {
  // After selection, validate the template definition
  const currentCompilerVersion = MANIFEST.version;
  let validationResult: ValidationResult;
  // 1. If current version > compilerVersion, proceed with strict validation
  if (
    template.compilerVersion === undefined ||
    semver.gte(currentCompilerVersion, template.compilerVersion)
  ) {
    validationResult = validateTemplateDefinitions(template, loaded.file, true);

    // 1.1 If strict validation fails, try relaxed validation
    if (!validationResult.valid) {
      validationResult = validateTemplateDefinitions(template, loaded.file, false);
    }
  } else {
    // 2. if version mis-match or none specified, warn and prompt user to continue or not
    const confirmationMessage = `The template you selected is designed for tsp version ${template.compilerVersion}. You are currently using tsp version ${currentCompilerVersion}.`;
    if (
      await confirm(
        `${confirmationMessage} The project created may not be correct. Do you want to continue?`,
      )
    ) {
      // 2.1 If user choose to continue, proceed with relaxed validation
      validationResult = validateTemplateDefinitions(template, loaded.file, false);
    } else {
      return false;
    }
  }

  // 3. If even relaxed validation fails, still prompt user to continue or not
  if (!validationResult.valid) {
    logDiagnostics(validationResult.diagnostics);

    return await confirm(
      "Template schema failed. The project created may not be correct. Do you want to continue?",
    );
  }
  return true;
}

async function selectLibraries(template: InitTemplate): Promise<InitTemplateLibrarySpec[]> {
  if (template.libraries === undefined || template.libraries.length === 0) {
    return [];
  }

  const libraryChoices = template.libraries.map((x) => ({
    ...normalizeLibrary(x),
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
  strictValidation: boolean,
): ValidationResult {
  const validator = createJSONSchemaValidator(InitTemplateSchema, {
    strict: strictValidation,
  });
  const diagnostics = validator.validate(template, templateName);
  return { valid: diagnostics.length === 0, diagnostics };
}

function logDiagnostics(diagnostics: readonly Diagnostic[]): void {
  diagnostics.forEach((diagnostic) => {
    // eslint-disable-next-line no-console
    console.log(diagnostic.message);
  });
}

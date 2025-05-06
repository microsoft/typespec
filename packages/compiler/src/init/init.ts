import { confirm as confirmInquirer, input, select } from "@inquirer/prompts";
import { readdir } from "fs/promises";
import pc from "picocolors";
import * as semver from "semver";
import { CliCompilerHost } from "../core/cli/types.js";
import { createDiagnostic } from "../core/messages.js";
import { getBaseFileName, getDirectoryPath } from "../core/path-utils.js";
import { CompilerHost, Diagnostic, NoTarget, SourceFile } from "../core/types.js";
import { installTypeSpecDependencies } from "../install/install.js";
import { MANIFEST } from "../manifest.js";
import { readUrlOrPath } from "../utils/misc.js";
import { getTypeSpecCoreTemplates } from "./core-templates.js";
import { validateTemplateDefinitions, ValidationResult } from "./init-template-validate.js";
import { EmitterTemplate, InitTemplate } from "./init-template.js";
import { checkbox } from "./prompts.js";
import { isFileSkipGeneration, makeScaffoldingConfig, scaffoldNewProject } from "./scaffold.js";

export interface InitTypeSpecProjectOptions {
  readonly templatesUrl?: string;
  readonly template?: string;
}

export async function initTypeSpecProject(
  host: CliCompilerHost,
  directory: string,
  options: InitTypeSpecProjectOptions = {},
) {
  try {
    await initTypeSpecProjectWorker(host, directory, options);
  } catch (error) {
    if (error instanceof Error && error.name === "ExitPromptError") {
      warning("interrupted, until next time!");
    } else {
      // Rethrow unknown errors
      throw error;
    }
  }
}
export async function initTypeSpecProjectWorker(
  host: CliCompilerHost,
  directory: string,
  options: InitTypeSpecProjectOptions = {},
) {
  whiteline();

  if (!(await confirmDirectoryEmpty(directory))) {
    return;
  }

  const folderName = getBaseFileName(directory);

  // Download template configuration and prompt user to select a template
  // No validation is done until one has been selected
  const typeSpecCoreTemplates = await getTypeSpecCoreTemplates(host);
  const result =
    options.templatesUrl === undefined
      ? (typeSpecCoreTemplates as LoadedTemplate)
      : await downloadTemplates(host, options.templatesUrl);
  const templateName = options.template ?? (await promptTemplateSelection(result.templates));

  // Validate minimum compiler version for non built-in templates
  if (
    result !== typeSpecCoreTemplates &&
    !(await validateTemplate(result.templates[templateName], result))
  ) {
    return;
  }

  const template = result.templates[templateName] as InitTemplate;
  const name = await input({
    message: `Enter a project name:`,
    default: folderName,
  });

  const emitters = await selectEmitters(template);
  const parameters = await promptCustomParameters(template);
  const scaffoldingConfig = makeScaffoldingConfig(template, {
    baseUri: result.baseUri,
    name,
    directory,
    parameters,
    emitters,
  });

  await scaffoldNewProject(host, scaffoldingConfig);
  const projectJsonCreated = !isFileSkipGeneration(
    "package.json",
    scaffoldingConfig.template.files ?? [],
  );

  whiteline();

  if (projectJsonCreated) {
    await host.logSink.trackAction!(
      "Installing dependencies",
      "Dependencies installed",
      async (task) => {
        const diagnostics = await installTypeSpecDependencies(host, {
          directory,
          stdio: "pipe",
          savePackageManager: true,
        });

        if (diagnostics.length > 0) {
          if (diagnostics.some((d) => d.severity === "error")) {
            task.fail();
          } else {
            task.warn();
          }
          logDiagnostics(diagnostics);
        }
      },
    );
  }

  whiteline();
  success("Project initialized!");

  // eslint-disable-next-line no-console
  console.log(`Run ${pc.cyan(`tsp compile .`)} to build the project.`);

  if (Object.values(emitters).some((emitter) => emitter.message !== undefined)) {
    // eslint-disable-next-line no-console
    console.log(pc.yellow("\nPlease review the following messages from emitters:"));

    for (const key of Object.keys(emitters)) {
      if (emitters[key].message) {
        // eslint-disable-next-line no-console
        console.log(`  ${key}: \n\t${emitters[key].message}`);
      }
    }
  }
}

async function promptCustomParameters(template: InitTemplate): Promise<Record<string, any>> {
  if (!template.inputs) {
    return {};
  }

  const results: Record<string, string> = {};
  for (const [name, templateInput] of Object.entries(template.inputs)) {
    if (templateInput.type === "text") {
      results[name] = await input({
        message: templateInput.description,
        default: templateInput.initialValue,
      });
    }
  }

  return results;
}

async function isDirectoryEmpty(directory: string) {
  try {
    const files = await readdir(directory);
    return files.length === 0;
  } catch {
    return true;
  }
}

function warning(message: string) {
  // eslint-disable-next-line no-console
  console.log(pc.yellow(`warning: ${message}`));
}
function success(message: string) {
  // eslint-disable-next-line no-console
  console.log(pc.green(`success: ${message}`));
}
function whiteline() {
  // eslint-disable-next-line no-console
  console.log("");
}

async function confirmDirectoryEmpty(directory: string) {
  if (await isDirectoryEmpty(directory)) {
    return true;
  }

  warning(`Folder ${pc.cyan(directory)} is not empty.`);
  whiteline();
  return confirm(`Initialize a new project here?:`);
}

async function confirm(message: string): Promise<boolean> {
  return await confirmInquirer({
    message,
    default: true,
  });
}

export interface LoadedTemplate {
  readonly baseUri: string;
  readonly templates: Record<string, InitTemplate>;
  readonly file: SourceFile;
}
async function downloadTemplates(host: CompilerHost, url: string): Promise<LoadedTemplate> {
  warning(
    `Downloading or using an untrusted template may contain malicious packages that can compromise your system and data. Proceed with caution and verify the source.`,
  );
  if (!(await confirm("Continue"))) {
    process.exit(1);
  }
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

function getTemplateName(template: InitTemplate) {
  if (isTemplateCompatibleWithTspVersion(template)) {
    return template.title;
  } else {
    return `${template.title} ${pc.red(`Requires tsp version ${template.compilerVersion}`)}`;
  }
}

async function promptTemplateSelection(templates: Record<string, any>): Promise<string> {
  const templateName = await select({
    message: "Select a project template:",
    choices: Object.entries(templates).map(([id, template]) => {
      return {
        value: id,
        description: template.description,
        name: getTemplateName(template),
      };
    }),
    theme: {
      style: {
        description: (description: string) => pc.dim(description),
      },
    },
  });

  if (!templateName) {
    process.exit(1);
  }

  const template = templates[templateName];
  if (!template) {
    throw new Error(`Unexpected error: Cannot find template ${templateName}`);
  }

  return templateName;
}

function isTemplateCompatibleWithTspVersion(template: InitTemplate): boolean {
  const currentCompilerVersion = MANIFEST.version;
  return (
    template.compilerVersion === undefined ||
    semver.gte(currentCompilerVersion, template.compilerVersion)
  );
}

async function validateTemplate(template: any, loaded: LoadedTemplate): Promise<boolean> {
  // After selection, validate the template definition
  const currentCompilerVersion = MANIFEST.version;
  let validationResult: ValidationResult;
  // 1. If current version > compilerVersion, proceed with strict validation
  if (isTemplateCompatibleWithTspVersion(template)) {
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

async function selectEmitters(template: InitTemplate): Promise<Record<string, EmitterTemplate>> {
  if (!template.emitters) {
    return {};
  }

  const emittersList = Object.entries(template.emitters);

  const maxLabelLength = emittersList.reduce(
    (max, [name, emitter]) => Math.max(max, emitter.label?.length ?? name.length),
    0,
  );
  const emitters = await checkbox({
    message: "What emitters do you want to use?:",
    choices: emittersList.map(([name, emitter]) => {
      return {
        value: name,
        name: emitter.label
          ? `${emitter.label.padEnd(maxLabelLength + 3)} ${pc.dim(`[${name}]`)}`
          : name,
        description: emitter.description,
        checked: emitter.selected ?? false,
      };
    }),
    theme: {
      style: {
        renderSelectedChoices: (choices: ReadonlyArray<any>) => {
          if (choices.length === 0) {
            return "None selected.";
          } else {
            return `${choices.map((x) => x.value).join(", ")}`;
          }
        },
      },
    },
  });

  const selectedEmitters = [...Object.entries(template.emitters)].filter(([key, value], index) =>
    emitters.includes(key),
  );

  return Object.fromEntries(selectedEmitters);
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

function logDiagnostics(diagnostics: readonly Diagnostic[]): void {
  diagnostics.forEach((diagnostic) => {
    // eslint-disable-next-line no-console
    console.log(diagnostic.message);
  });
}

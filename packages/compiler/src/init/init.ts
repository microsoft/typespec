import { confirm as confirmInquirer, input, select } from "@inquirer/prompts";
import { readdir } from "fs/promises";
import pc from "picocolors";
import * as semver from "semver";
import { CliCompilerHost } from "../core/cli/types.js";
import { parseCliArgsArgOption } from "../core/cli/utils.js";
import { createDiagnostic } from "../core/messages.js";
import { getBaseFileName } from "../core/path-utils.js";
import { Diagnostic, NoTarget } from "../core/types.js";
import { installTypeSpecDependencies } from "../install/install.js";
import { MANIFEST } from "../manifest.js";
import { validateTemplateDefinitions, ValidationResult } from "./init-template-validate.js";
import { EmitterTemplate, InitTemplate, InitTemplateInput } from "./init-template.js";
import { checkbox } from "./prompts.js";
import { isFileSkipGeneration, makeScaffoldingConfig, scaffoldNewProject } from "./scaffold.js";
import {
  defaultInternalTemplateSource,
  UriTemplateSource,
  type LoadedTemplateIndex,
  type TemplateSource,
} from "./template-source/index.js";

export interface InitTypeSpecProjectOptions {
  readonly templatesUrl?: string;
  readonly template?: string;
  readonly "no-prompt"?: boolean;
  readonly args?: string[];
  readonly "project-name"?: string;
  readonly emitters?: string[];
  /**
   * Provider that the `internal:` scheme resolves to (the built-in templates). Defaults to the
   * compiler's on-disk `templates/` directory; the standalone single-executable injects an in-memory
   * bundle instead.
   */
  readonly internalTemplateSource?: TemplateSource;
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
  const skipPrompts = options["no-prompt"] ?? false;
  whiteline();

  if (!skipPrompts && !(await confirmDirectoryEmpty(directory))) {
    return;
  }

  const folderName = getBaseFileName(directory);

  const isRemote = options.templatesUrl !== undefined;
  // A `templatesUrl` points at a filesystem path or URL; otherwise use the built-in ("internal")
  // templates, either an injected provider (e.g. bundled in the standalone executable) or the
  // compiler's on-disk `templates/` directory.
  const source: TemplateSource =
    options.templatesUrl !== undefined
      ? new UriTemplateSource(host, options.templatesUrl)
      : (options.internalTemplateSource ?? defaultInternalTemplateSource(host));

  if (isRemote) {
    warning(
      `Downloading or using an untrusted template may contain malicious packages that can compromise your system and data. Proceed with caution and verify the source.`,
    );
    if (!skipPrompts && !(await confirm("Continue"))) {
      process.exit(1);
    }
  }

  // No validation is done until a template has been selected.
  const index = await loadTemplateIndex(source, options.templatesUrl);
  if (skipPrompts && !options.template) {
    // A template has to be defined if we're skipping prompts
    throw new Error(
      `A template must be specified when --no-prompt is used. Specify one of the following templates via --template: ${Object.keys(
        index.templates,
      )
        .map((t) => `"${t}"`)
        .join(", ")}`,
    );
  }
  const templateName = options.template ?? (await promptTemplateSelection(index.templates));

  if (!index.templates[templateName]) {
    throw new Error(`Unexpected error: Cannot find template ${templateName}`);
  }

  // Validate minimum compiler version for non built-in templates
  if (!skipPrompts && isRemote && !(await validateTemplate(index.templates[templateName], index))) {
    return;
  }

  const template = index.templates[templateName] as InitTemplate;
  const name = await resolveProjectName(folderName, options);

  const emitters = await selectEmitters(template, options);
  const parameters = await promptCustomParameters(template, options);
  const scaffoldingConfig = makeScaffoldingConfig(template, {
    source,
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

async function resolveProjectName(
  defaultName: string,
  options: InitTypeSpecProjectOptions,
): Promise<string> {
  defaultName = options["project-name"] ?? defaultName;

  if (options["no-prompt"]) return defaultName;
  return input({
    message: `Enter a project name:`,
    default: defaultName,
  });
}

async function promptCustomParameters(
  template: InitTemplate,
  options: InitTypeSpecProjectOptions,
): Promise<Record<string, any>> {
  if (!template.inputs) {
    return {};
  }

  const skipPrompts = options["no-prompt"] ?? false;

  const results: Record<string, string> = {};

  for (const [name, templateInput] of Object.entries(template.inputs)) {
    const value = await resolveCustomParameter(templateInput, name, options);
    if (typeof value === "undefined") {
      throw new Error(
        `Missing value for parameter "${name}".${skipPrompts ? ` Provide it using --args ${name}=value` : ""}`,
      );
    }

    results[name] = value;
  }

  return results;
}

async function resolveCustomParameter(
  templateInput: InitTemplateInput,
  name: string,
  options: InitTypeSpecProjectOptions,
): Promise<string> {
  const suppliedArgs = parseCliArgsArgOption(options.args);
  const defaultValue = suppliedArgs[name] ?? templateInput.initialValue;

  if (options["no-prompt"]) {
    return defaultValue;
  }

  return input({
    message: templateInput.description,
    default: defaultValue,
  });
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

async function loadTemplateIndex(
  source: TemplateSource,
  url: string | undefined,
): Promise<LoadedTemplateIndex> {
  try {
    return await source.loadIndex();
  } catch (e: any) {
    if (url === undefined) {
      throw e;
    }
    const code =
      e instanceof SyntaxError ? "init-template-invalid-json" : "init-template-download-failed";
    throw new InitTemplateError([
      createDiagnostic({
        code,
        target: NoTarget,
        format: { url, message: e.message },
      }),
    ]);
  }
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

  return templateName;
}

function isTemplateCompatibleWithTspVersion(template: InitTemplate): boolean {
  const currentCompilerVersion = MANIFEST.version;
  return (
    template.compilerVersion === undefined ||
    semver.gte(currentCompilerVersion, template.compilerVersion)
  );
}

async function validateTemplate(template: any, index: LoadedTemplateIndex): Promise<boolean> {
  // After selection, validate the template definition
  const currentCompilerVersion = MANIFEST.version;
  let validationResult: ValidationResult;
  // 1. If current version > compilerVersion, proceed with strict validation
  if (isTemplateCompatibleWithTspVersion(template)) {
    validationResult = validateTemplateDefinitions(template, index.indexFile, true);

    // 1.1 If strict validation fails, try relaxed validation
    if (!validationResult.valid) {
      validationResult = validateTemplateDefinitions(template, index.indexFile, false);
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
      validationResult = validateTemplateDefinitions(template, index.indexFile, false);
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

async function selectEmitters(
  template: InitTemplate,
  options: InitTypeSpecProjectOptions,
): Promise<Record<string, EmitterTemplate>> {
  if (!template.emitters) {
    return {};
  }

  const emittersList = Object.entries(template.emitters);
  const suppliedEmitters = options.emitters ?? [];

  let emitters: string[] = [];
  if (options["no-prompt"]) {
    emitters = emittersList
      .filter(([name, emitter]) => emitter.selected || suppliedEmitters.includes(name))
      .map(([name]) => name);
  } else {
    const maxLabelLength = emittersList.reduce(
      (max, [name, emitter]) => Math.max(max, emitter.label?.length ?? name.length),
      0,
    );
    emitters = await checkbox({
      message: "What emitters do you want to use?:",
      choices: emittersList.map(([name, emitter]) => {
        return {
          value: name,
          name: emitter.label
            ? `${emitter.label.padEnd(maxLabelLength + 3)} ${pc.dim(`[${name}]`)}`
            : name,
          description: emitter.description,
          checked: emitter.selected ?? suppliedEmitters.includes(name),
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
  }

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

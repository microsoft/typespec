import { JSONSchemaType } from "ajv";
import { readdir } from "fs/promises";
import Mustache from "mustache";
import { basename, join } from "path";
import prompts from "prompts";
import { logDiagnostics } from "./diagnostics.js";
import { formatCadl } from "./formatter.js";
import { SchemaValidator } from "./schema-validator.js";
import { CompilerHost, SourceFile } from "./types.js";
import { readUrlOrPath, resolveRelativeUrlOrPath } from "./util.js";

interface InitTemplateFile {
  path: string;
  destination: string;
}

interface InitTemplateInput {
  description: string;
  type: "text";
  initialValue: any;
}

interface InitTemplate {
  /**
   * Name of the template
   */
  title: string;

  /**
   * Description for the template.
   */
  description: string;

  /**
   * List of libraries to include
   */
  libraries: string[];

  /**
   * Custom inputs to prompt to the user
   */
  inputs?: Record<string, InitTemplateInput>;

  /**
   * List of files to copy.
   */
  files?: InitTemplateFile[];
}

interface ScaffoldingConfig extends InitTemplate {
  /**
   * Path where this template was laoded from.
   */
  templateUri: string;

  /**
   * Directory where the project should be initialized.
   */
  directory: string;

  /**
   * Name of the project.
   */
  name: string;

  /**
   * List of libraries to include
   */
  libraries: string[];

  /**
   * Custom parameters provided in the tempalates.
   */
  customParameters: Record<string, any>;
}

export async function initCadlProject(
  host: CompilerHost,
  directory: string,
  templatesUrl?: string
) {
  if (!(await confirmDirectoryEmpty(directory))) {
    return;
  }
  const folderName = basename(directory);

  const template = await selectTemplate(host, templatesUrl);
  const { name } = await prompts([
    {
      type: "text",
      name: "name",
      message: `Project name`,
      initial: folderName,
    },
  ]);

  const libraries = await selectLibraries(template);
  const customParameters = await promptCustomParameters(template);
  const scaffoldingConfig: ScaffoldingConfig = {
    ...template,
    templateUri: templatesUrl ?? ".",
    libraries,
    name,
    directory,
    customParameters,
  };
  await scaffoldNewProject(host, scaffoldingConfig);
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
  },
  rest: {
    title: "Generic Rest API",
    description: "Create a project representing a generic Rest API",
    libraries: ["@cadl-lang/rest", "@cadl-lang/openapi"],
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
  templatesUrl: string
): Promise<Record<string, InitTemplate>> {
  const file = await readUrlOrPath(host, templatesUrl);

  const json = JSON.parse(file.text);
  validateTemplateDefinitions(host, json, file);
  return json;
}

async function selectTemplate(
  host: CompilerHost,
  templatesUrl: string | undefined
): Promise<InitTemplate> {
  const templates =
    templatesUrl === undefined ? builtInTemplates : await downloadTemplates(host, templatesUrl);
  return promptTemplateSelection(templates);
}

async function promptTemplateSelection(
  templates: Record<string, InitTemplate>
): Promise<InitTemplate> {
  const { templateName } = await prompts({
    type: "select",
    name: "templateName",
    message: "Please select a template",
    choices: Object.entries(templates).map(([id, template]) => {
      return { value: id, description: template.description, title: template.title };
    }),
  });
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Unexpected error: Cannot find template ${templateName}`);
  }
  return template;
}

async function selectLibraries(template: InitTemplate): Promise<string[]> {
  if (template.libraries.length === 0) {
    return [];
  }

  const libraryChoices = template.libraries.map((x) => ({ name: x, description: "" }));

  const { libraries } = await prompts({
    type: "multiselect",
    name: "libraries",
    message: "Update the libraries?",
    choices: libraryChoices.map((x) => {
      return {
        title: x.name,
        description: x.description,
        value: x.name,
        selected: true,
      };
    }),
    initial: template.libraries as any,
  });

  return libraries;
}

export async function scaffoldNewProject(host: CompilerHost, config: ScaffoldingConfig) {
  await writePackageJson(host, config);
  await writeMain(host, config);
  await writeFiles(host, config);
}

async function writePackageJson(host: CompilerHost, config: ScaffoldingConfig) {
  const dependencies: Record<string, string> = {};

  for (const library of config.libraries) {
    dependencies[library] = "latest";
  }

  const packageJson = {
    name: config.name,
    dependencies,
  };

  return host.writeFile(
    join(config.directory, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
}

async function writeMain(host: CompilerHost, config: ScaffoldingConfig) {
  const dependencies: Record<string, string> = {};

  for (const library of config.libraries) {
    dependencies[library] = "latest";
  }

  const lines = [...config.libraries.map((x) => `import "${x}";`), ""];
  const content = lines.join("\n");

  return host.writeFile(join(config.directory, "main.cadl"), await formatCadl(content));
}

async function writeFiles(host: CompilerHost, config: ScaffoldingConfig) {
  if (!config.files) {
    return;
  }
  for (const file of config.files) {
    await writeFile(host, config, file);
  }
}

async function writeFile(host: CompilerHost, config: ScaffoldingConfig, file: InitTemplateFile) {
  const template = await readUrlOrPath(
    host,
    resolveRelativeUrlOrPath(config.templateUri, file.path)
  );
  const content = Mustache.render(template.text, config.customParameters);
  return host.writeFile(join(config.directory, file.destination), content);
}

function validateTemplateDefinitions(
  host: CompilerHost,
  templates: unknown,
  file: SourceFile
): asserts templates is Record<string, InitTemplate> {
  const validator = new SchemaValidator(InitTemplateDefinitionsSchema);
  const diagnostics = validator.validate(templates, file);
  if (diagnostics.length > 0) {
    logDiagnostics(diagnostics, host.logSink);
    throw new Error("Template contained error.");
  }
}

export const InitTemplateSchema: JSONSchemaType<InitTemplate> = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    libraries: { type: "array", items: { type: "string" } },
    inputs: {
      type: "object",
      nullable: true,
      additionalProperties: {
        type: "object",
        properties: {
          description: { type: "string" },
          type: { type: "string", enum: ["text"] },
          initialValue: {} as any,
        },
        required: ["description", "type"],
      },
      required: [],
    },
    files: {
      type: "array",
      nullable: true,
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          destination: { type: "string" },
        },
        required: ["path", "destination"],
      },
    },
  },
  required: ["title", "description"],
};

export const InitTemplateDefinitionsSchema: JSONSchemaType<Record<string, InitTemplate>> = {
  type: "object",
  additionalProperties: InitTemplateSchema,
  required: [],
};

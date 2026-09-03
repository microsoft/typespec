import { doIO } from "../utils/io.js";
import { parseYaml } from "../yaml/parser.js";
import { createJSONSchemaValidator } from "./schema-validator.js";
import type { Diagnostic, JSONSchemaType, LinterRuleSet, SystemHost } from "./types.js";

/** Prefix used in `extends` to reference a ruleset defined in a yaml file. */
export const linterRuleSetFilePrefix = "file:";

export const LinterRuleSetFileJsonSchema: JSONSchemaType<LinterRuleSet> = {
  type: "object",
  additionalProperties: false,
  required: [],
  properties: {
    extends: {
      type: "array",
      nullable: true,
      items: { type: "string" },
    },
    enable: {
      type: "object",
      required: [],
      nullable: true,
      additionalProperties: {
        oneOf: [{ type: "boolean" }, { type: "object" }],
      },
    },
    disable: {
      type: "object",
      required: [],
      nullable: true,
      additionalProperties: { type: "string" },
    },
  },
} as any; // ajv type system doesn't like the string templates

const ruleSetFileValidator = createJSONSchemaValidator(LinterRuleSetFileJsonSchema);

/**
 * Load a linter ruleset defined in a yaml file.
 * @param host Host used to read the file.
 * @param path Absolute path to the yaml file.
 */
export async function loadLinterRuleSetFile(
  host: SystemHost,
  path: string,
): Promise<[LinterRuleSet | undefined, readonly Diagnostic[]]> {
  const diagnostics: Diagnostic[] = [];
  const reportDiagnostic = (d: Diagnostic) => diagnostics.push(d);
  const file = await doIO(host.readFile, path, reportDiagnostic);
  if (file === undefined) {
    return [undefined, diagnostics];
  }

  const [yamlScript, yamlDiagnostics] = parseYaml(file);
  diagnostics.push(...yamlDiagnostics);
  if (yamlDiagnostics.some((d) => d.severity === "error")) {
    return [undefined, diagnostics];
  }

  // An empty yaml file is a valid, empty, ruleset.
  const data = yamlScript.value ?? {};
  const validationDiagnostics = ruleSetFileValidator.validate(data, yamlScript);
  diagnostics.push(...validationDiagnostics);
  if (validationDiagnostics.some((d) => d.severity === "error")) {
    return [undefined, diagnostics];
  }

  return [data as LinterRuleSet, diagnostics];
}

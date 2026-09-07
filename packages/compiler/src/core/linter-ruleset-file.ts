import { doIO } from "../utils/io.js";
import { parseYaml } from "../yaml/parser.js";
import type { YamlScript } from "../yaml/types.js";
import { createJSONSchemaValidator } from "./schema-validator.js";
import type {
  Diagnostic,
  DiagnosticTarget,
  JSONSchemaType,
  LinterRuleSet,
  SystemHost,
} from "./types.js";
import { NoTarget } from "./types.js";

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

/** A linter ruleset loaded from a yaml file. */
export interface LoadedLinterRuleSetFile {
  readonly ruleSet: LinterRuleSet;
  /** Parsed yaml, used to locate diagnostics reported for entries of this ruleset. */
  readonly script: YamlScript;
}

/**
 * Load a linter ruleset defined in a yaml file.
 * @param host Host used to read the file.
 * @param path Absolute path to the yaml file.
 * @param target Target to report the file loading errors on. Typically the reference that led to this file.
 */
export async function loadLinterRuleSetFile(
  host: SystemHost,
  path: string,
  target: DiagnosticTarget | typeof NoTarget = NoTarget,
): Promise<[LoadedLinterRuleSetFile | undefined, readonly Diagnostic[]]> {
  const diagnostics: Diagnostic[] = [];
  const reportDiagnostic = (d: Diagnostic) => diagnostics.push(d);
  const file = await doIO(host.readFile, path, reportDiagnostic, { diagnosticTarget: target });
  if (file === undefined) {
    return [undefined, diagnostics];
  }

  const [script, yamlDiagnostics] = parseYaml(file);
  diagnostics.push(...yamlDiagnostics);
  if (yamlDiagnostics.some((d) => d.severity === "error")) {
    return [undefined, diagnostics];
  }

  // An empty yaml file is a valid, empty, ruleset.
  const data = script.value ?? {};
  const validationDiagnostics = ruleSetFileValidator.validate(data, script);
  diagnostics.push(...validationDiagnostics);
  if (validationDiagnostics.some((d) => d.severity === "error")) {
    return [undefined, diagnostics];
  }

  return [{ ruleSet: data as LinterRuleSet, script }, diagnostics];
}

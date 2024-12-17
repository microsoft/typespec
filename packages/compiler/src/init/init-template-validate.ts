import { createJSONSchemaValidator } from "../core/schema-validator.js";
import { Diagnostic, NoTarget, SourceFile } from "../index.js";
import { InitTemplateSchema } from "./init-template.js";

export type ValidationResult = {
  valid: boolean;
  diagnostics: readonly Diagnostic[];
};

export function validateTemplateDefinitions(
  template: unknown,
  templateName: SourceFile | typeof NoTarget,
  strictValidation: boolean,
): ValidationResult {
  const validator = createJSONSchemaValidator(InitTemplateSchema, {
    strict: strictValidation,
  });
  const diagnostics = validator.validate(template, templateName);
  return { valid: diagnostics.length === 0, diagnostics };
}

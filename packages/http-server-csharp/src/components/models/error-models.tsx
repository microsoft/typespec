import { type Children } from "@alloy-js/core";
import type { ParameterProps } from "@alloy-js/csharp";
import * as cs from "@alloy-js/csharp";
import { isErrorModel, type Model, type Program } from "@typespec/compiler";
import { getHeaderFieldName, isHeader, isStatusCode } from "@typespec/http";
import {
  getAllProperties,
  getCSharpTypeString,
  getDefaultValueString,
  getErrorStatusCode,
  getLiteralValue,
  isDuplicateExceptionName,
} from "./model-helpers.js";

/** Generates the constructor for an error model. */
export function getErrorConstructor(program: Program, model: Model, className: string): Children {
  const statusCode = getErrorStatusCode(program, model);
  const isChild = model.baseModel && isErrorModel(program, model.baseModel);
  const namePolicy = cs.createCSharpNamePolicy();

  // For child error models, only use own properties (not inherited)
  // For root error models, use all properties including inherited
  const props = isChild ? Array.from(model.properties.values()) : getAllProperties(program, model);

  // Separate properties into required and optional/default
  const sortedProps = props
    .filter((p) => !isStatusCode(program, p))
    .map((prop) => {
      const defaultValue = prop.defaultValue ? getDefaultValueString(prop.defaultValue) : undefined;
      const literalValue = getLiteralValue(prop.type);
      return { prop, defaultValue: defaultValue ?? literalValue };
    })
    .sort((a, b) => {
      const aHasDefault = a.prop.optional || a.defaultValue !== undefined;
      const bHasDefault = b.prop.optional || b.defaultValue !== undefined;
      if (!aHasDefault && bHasDefault) return -1;
      if (aHasDefault && !bHasDefault) return 1;
      return 0;
    });

  const parameters: ParameterProps[] = [];
  const bodyParts: string[] = [];
  const headerParts: string[] = [];
  const valueParts: string[] = [];

  if (statusCode?.requiresConstructorArgument) {
    parameters.push({ name: String(statusCode.value), type: "int" });
  }

  for (const { prop, defaultValue } of sortedProps) {
    let propName = namePolicy.getName(prop.name, "class-property");
    if (propName === className || isDuplicateExceptionName(propName)) {
      propName = propName === "Value" ? "ValueName" : `${propName}Prop`;
    }

    const csharpType = getCSharpTypeString(program, prop.type);
    const defaultStr = defaultValue ? defaultValue : prop.optional ? "default" : undefined;
    parameters.push({ name: prop.name, type: csharpType, default: defaultStr });
    bodyParts.push(`${propName} = ${prop.name};`);

    if (isHeader(program, prop)) {
      const headerName = getHeaderFieldName(program, prop);
      headerParts.push(`{"${headerName}", ${prop.name}}`);
    } else {
      valueParts.push(`${prop.name} = ${prop.name}`);
    }
  }

  const statusCodeStr = statusCode?.value ?? 400;

  // Build base call arguments
  const baseArgs: string[] = [String(statusCodeStr)];
  if (headerParts.length > 0) {
    baseArgs.push(`headers: new() { ${headerParts.join(", ")} }`);
  }
  if (valueParts.length > 0) {
    baseArgs.push(`value: new { ${valueParts.join(", ")} }`);
  }

  const baseConstructorArgs = isChild ? [String(statusCodeStr)] : baseArgs;

  const body = bodyParts.join("\n");

  return (
    <cs.Constructor public parameters={parameters} baseConstructor={baseConstructorArgs}>
      {body}
    </cs.Constructor>
  );
}

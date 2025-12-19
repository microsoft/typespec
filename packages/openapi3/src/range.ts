import {
  getMaxValue,
  getMaxValueForScalar,
  getMinValue,
  getMinValueForScalar,
  type Program,
  serializeValueAsJson,
  type Type,
} from "@typespec/compiler";

export function getMinValueAsJson(program: Program, type: Type): number | undefined {
  const numericValue = getMinValue(program, type);
  if (numericValue !== undefined) return numericValue;

  const scalarValue = getMinValueForScalar(program, type);
  if (scalarValue === undefined) return undefined;
  const result = serializeValueAsJson(program, scalarValue, type);
  return typeof result === "number" ? result : undefined; // json schema/openapi3 can only define min/max for numeric types
}

export function getMaxValueAsJson(program: Program, type: Type): number | undefined {
  const numericValue = getMaxValue(program, type);
  if (numericValue !== undefined) return numericValue;

  const scalarValue = getMaxValueForScalar(program, type);
  if (scalarValue === undefined) return undefined;

  const result = serializeValueAsJson(program, scalarValue, type);
  return typeof result === "number" ? result : undefined; // json schema/openapi3 can only define min/max for numeric types
}

import {
  getMaxValue,
  getMaxValueForScalar,
  getMinValue,
  getMinValueForScalar,
  type Program,
  serializeValueAsJson,
  type Type,
} from "@typespec/compiler";

export function getMinValueAsJson(program: Program, type: Type): unknown {
  const numericValue = getMinValue(program, type);
  if (numericValue !== undefined) return numericValue;

  const scalarValue = getMinValueForScalar(program, type);
  return scalarValue && serializeValueAsJson(program, scalarValue, type);
}

export function getMaxValueAsJson(program: Program, type: Type): unknown {
  const numericValue = getMaxValue(program, type);
  if (numericValue !== undefined) return numericValue;

  const scalarValue = getMaxValueForScalar(program, type);
  return scalarValue && serializeValueAsJson(program, scalarValue, type);
}

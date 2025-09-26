import {
  getMaxValue as coreGetMaxValue,
  getMinValue as coreGetMinValue,
  getMaxValueForScalar,
  getMinValueForScalar,
  type Program,
  serializeValueAsJson,
  type Type,
} from "@typespec/compiler";

export function getMinValue(program: Program, type: Type): unknown {
  const numericValue = coreGetMinValue(program, type);
  if (numericValue) return numericValue;

  const scalarValue = getMinValueForScalar(program, type);
  return scalarValue && serializeValueAsJson(program, scalarValue, type);
}

export function getMaxValue(program: Program, type: Type): unknown {
  const numericValue = coreGetMaxValue(program, type);
  if (numericValue) return numericValue;

  const scalarValue = getMaxValueForScalar(program, type);
  return scalarValue && serializeValueAsJson(program, scalarValue, type);
}

import { Program } from "../compiler/program.js";
import { ModelTypeProperty, NamespaceType, Type } from "../compiler/types.js";

const docsKey = Symbol();
export function doc(program: Program, target: Type, text: string) {
  program.stateMap(docsKey).set(target, text);
}

export function getDoc(program: Program, target: Type): string {
  return program.stateMap(docsKey).get(target);
}

export function inspectType(program: Program, target: Type, text: string) {
  if (text) console.log(text);
  console.dir(target, { depth: 3 });
}

export function inspectTypeName(program: Program, target: Type, text: string) {
  if (text) console.log(text);
  console.log(program.checker!.getTypeName(target));
}

const intrinsicsKey = Symbol();
export function intrinsic(program: Program, target: Type) {
  program.stateSet(intrinsicsKey).add(target);
}

export function isIntrinsic(program: Program, target: Type | undefined) {
  if (!target) {
    return false;
  }
  return program.stateSet(intrinsicsKey).has(target);
}

// Walks the assignmentType chain to find the core intrinsic type, if any
export function getIntrinsicType(program: Program, target: Type | undefined): string | undefined {
  while (target) {
    if (target.kind === "Model") {
      if (isIntrinsic(program, target)) {
        return target.name;
      }

      if (target.baseModels.length === 1) {
        target = target.baseModels[0];
      } else {
        target = undefined;
      }
    } else if (target.kind === "ModelProperty") {
      return getIntrinsicType(program, target.type);
    } else {
      break;
    }
  }

  return undefined;
}

export function isStringType(program: Program, target: Type): boolean {
  const intrinsicType = getIntrinsicType(program, target);
  return intrinsicType !== undefined && intrinsicType === "string";
}

export function isErrorType(type: Type): boolean {
  return type.kind === "Intrinsic" && type.name === "ErrorType";
}

const numericTypesKey = Symbol();
export function numeric(program: Program, target: Type) {
  if (!isIntrinsic(program, target)) {
    program.reportDiagnostic("Cannot apply @numeric decorator to non-intrinsic type.", target);
    return;
  }
  if (target.kind !== "Model") {
    program.reportDiagnostic("Cannot apply @numeric decorator to non-model type.", target);
    return;
  }
  program.stateSet(numericTypesKey).add(target.name);
}

export function isNumericType(program: Program, target: Type): boolean {
  const intrinsicType = getIntrinsicType(program, target);
  return intrinsicType !== undefined && program.stateSet(numericTypesKey).has(intrinsicType);
}

// -- @format decorator ---------------------

const formatValuesKey = Symbol();

export function format(program: Program, target: Type, format: string) {
  if (target.kind !== "Model" && target.kind !== "ModelProperty") {
    program.reportDiagnostic(
      "Cannot apply @format to anything that isn't a Model or ModelProperty",
      target
    );
    return;
  }

  if (getIntrinsicType(program, target) !== "string") {
    program.reportDiagnostic("Cannot apply @format to a non-string type", target);
    return;
  }

  program.stateMap(formatValuesKey).set(target, format);
}

export function getFormat(program: Program, target: Type): string | undefined {
  return program.stateMap(formatValuesKey).get(target);
}

// -- @minLength decorator ---------------------

const minLengthValuesKey = Symbol();

export function minLength(program: Program, target: Type, minLength: number) {
  if (target.kind !== "Model" && target.kind !== "ModelProperty") {
    program.reportDiagnostic(
      "Cannot apply @minLength to anything that isn't a Model or ModelProperty",
      target
    );
    return;
  }

  if (getIntrinsicType(program, target) !== "string") {
    program.reportDiagnostic("Cannot apply @minLength to a non-string type", target);
    return;
  }

  program.stateMap(minLengthValuesKey).set(target, minLength);
}

export function getMinLength(program: Program, target: Type): number | undefined {
  return program.stateMap(minLengthValuesKey).get(target);
}

// -- @maxLength decorator ---------------------

const maxLengthValuesKey = Symbol();

export function maxLength(program: Program, target: Type, maxLength: number) {
  if (target.kind !== "Model" && target.kind !== "ModelProperty") {
    program.reportDiagnostic(
      "Cannot apply @maxLength to anything that isn't a Model or ModelProperty",
      target
    );
    return;
  }

  if (getIntrinsicType(program, target) !== "string") {
    program.reportDiagnostic("Cannot apply @maxLength to a non-string type", target);
    return;
  }
  program.stateMap(maxLengthValuesKey).set(target, maxLength);
}

export function getMaxLength(program: Program, target: Type): number | undefined {
  return program.stateMap(maxLengthValuesKey).get(target);
}

// -- @minValue decorator ---------------------

const minValuesKey = Symbol();

export function minValue(program: Program, target: Type, minValue: number) {
  if (target.kind !== "Model" && target.kind !== "ModelProperty") {
    program.reportDiagnostic(
      "Cannot apply @minValue to anything that isn't a Model or ModelProperty",
      target
    );
  }
  if (!isNumericType(program, target)) {
    program.reportDiagnostic("Cannot apply @minValue to a non-numeric type", target);
    return;
  }
  program.stateMap(minValuesKey).set(target, minValue);
}

export function getMinValue(program: Program, target: Type): number | undefined {
  return program.stateMap(minValuesKey).get(target);
}

// -- @maxValue decorator ---------------------

const maxValuesKey = Symbol();

export function maxValue(program: Program, target: Type, maxValue: number) {
  if (target.kind !== "Model" && target.kind !== "ModelProperty") {
    program.reportDiagnostic(
      "Cannot apply @maxValue to anything that isn't a Model or ModelProperty",
      target
    );
    return;
  }
  if (!isNumericType(program, target)) {
    program.reportDiagnostic("Cannot apply @maxValue to a non-numeric type", target);
    return;
  }
  program.stateMap(maxValuesKey).set(target, maxValue);
}

export function getMaxValue(program: Program, target: Type): number | undefined {
  return program.stateMap(maxValuesKey).get(target);
}

// -- @secret decorator ---------------------

const secretTypesKey = Symbol();

export function secret(program: Program, target: Type) {
  if (target.kind !== "Model") {
    program.reportDiagnostic("Cannot apply @secret to anything that isn't a Model", target);
    return;
  }

  if (getIntrinsicType(program, target) !== "string") {
    program.reportDiagnostic("Cannot apply @secret to a non-string type", target);
    return;
  }
  program.stateMap(secretTypesKey).set(target, true);
}

export function isSecret(program: Program, target: Type): boolean | undefined {
  return program.stateMap(secretTypesKey).get(target);
}

// -- @visibility decorator ---------------------

const visibilitySettingsKey = Symbol();

export function visibility(program: Program, target: Type, ...visibilities: string[]) {
  if (target.kind !== "ModelProperty") {
    program.reportDiagnostic(
      "The @visibility decorator can only be applied to model properties.",
      target
    );
    return;
  }
  program.stateMap(visibilitySettingsKey).set(target, visibilities);
}

export function getVisibility(program: Program, target: Type): string[] | undefined {
  return program.stateMap(visibilitySettingsKey).get(target);
}

export function withVisibility(program: Program, target: Type, ...visibilities: string[]) {
  if (target.kind !== "Model") {
    program.reportDiagnostic(
      "The @withVisibility decorator can only be applied to models.",
      target
    );
    return;
  }

  const filter = (_: any, prop: ModelTypeProperty) => {
    const vis = getVisibility(program, prop);
    return vis !== undefined && visibilities.filter((v) => !vis.includes(v)).length > 0;
  };

  mapFilterOut(target.properties, filter);
}

function mapFilterOut(
  map: Map<string, ModelTypeProperty>,
  pred: (key: string, prop: ModelTypeProperty) => boolean
) {
  for (const [key, prop] of map) {
    if (pred(key, prop)) {
      map.delete(key);
    }
  }
}

// -- @withOptionalProperties decorator ---------------------

export function withOptionalProperties(program: Program, target: Type) {
  if (target.kind !== "Model") {
    program.reportDiagnostic(
      "The @withOptionalProperties decorator can only be applied to models.",
      target
    );
    return;
  }

  // Make all properties of the target type optional
  target.properties.forEach((p) => (p.optional = true));
}

// -- @list decorator ---------------------

const listPropertiesKey = Symbol();

export function list(program: Program, target: Type) {
  if (target.kind !== "Operation" && target.kind !== "ModelProperty") {
    program.reportDiagnostic(
      "The @list decorator can only be applied to operations or model properties.",
      target
    );
    return;
  }
  program.stateSet(listPropertiesKey).add(target);
}

export function isList(program: Program, target: Type): boolean {
  return program.stateSet(listPropertiesKey).has(target);
}

// -- @tag decorator ---------------------
const tagPropertiesKey = Symbol();

// Set a tag on an operation or namespace.  There can be multiple tags on either an
// operation or namespace.
export function tag(program: Program, target: Type, tag: string) {
  if (target.kind !== "Operation" && target.kind !== "Namespace") {
    program.reportDiagnostic(
      "The @tag decorator can only be applied to namespaces or operations.",
      target
    );
    return;
  }
  const tags = program.stateMap(tagPropertiesKey).get(target);
  if (tags) {
    tags.push(tag);
  } else {
    program.stateMap(tagPropertiesKey).set(target, [tag]);
  }
}

// Return the tags set on an operation or namespace
export function getTags(program: Program, target: Type): string[] {
  return program.stateMap(tagPropertiesKey).get(target) || [];
}

// Merge the tags for a operation with the tags that are on the namespace it resides within.
//
// TODO: (JC) We'll need to update this for nested namespaces
export function getAllTags(
  program: Program,
  namespace: NamespaceType,
  target: Type
): string[] | undefined {
  const tags = new Set<string>();

  for (const t of getTags(program, namespace)) {
    tags.add(t);
  }
  for (const t of getTags(program, target)) {
    tags.add(t);
  }
  return tags.size > 0 ? Array.from(tags) : undefined;
}

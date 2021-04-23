import { throwDiagnostic } from "../compiler/diagnostics.js";
import { Program } from "../compiler/program.js";
import { ModelTypeProperty, NamespaceType, Type } from "../compiler/types.js";

const docs = new Map<Type, string>();

export function doc(program: Program, target: Type, text: string) {
  docs.set(target, text);
}

export function getDoc(target: Type) {
  return docs.get(target);
}

export function inspectType(program: Program, target: Type, text: string) {
  if (text) console.log(text);
  console.dir(target, { depth: 3 });
}

export function inspectTypeName(program: Program, target: Type, text: string) {
  if (text) console.log(text);
  console.log(program.checker!.getTypeName(target));
}

const intrinsics = new Set<Type>();
export function intrinsic(program: Program, target: Type) {
  intrinsics.add(target);
}

export function isIntrinsic(target: Type) {
  return intrinsics.has(target);
}

// Walks the assignmentType chain to find the core intrinsic type, if any
export function getIntrinsicType(target: Type | undefined): string | undefined {
  while (target) {
    if (target.kind === "Model") {
      if (isIntrinsic(target)) {
        return target.name;
      }

      target = (target.assignmentType?.kind === "Model" && target.assignmentType) || undefined;
    } else if (target.kind === "ModelProperty") {
      return getIntrinsicType(target.type);
    } else {
      break;
    }
  }

  return undefined;
}

const numericTypes = new Set<string>();

export function numeric(program: Program, target: Type) {
  if (!isIntrinsic(target)) {
    throwDiagnostic("Cannot apply @numeric decorator to non-intrinsic type.", target);
  }
  if (target.kind === "Model") {
    numericTypes.add(target.name);
  } else {
    throwDiagnostic("Cannot apply @numeric decorator to non-model type.", target);
  }
}

export function isNumericType(target: Type): boolean {
  const intrinsicType = getIntrinsicType(target);
  return intrinsicType !== undefined && numericTypes.has(intrinsicType);
}

// -- @format decorator ---------------------

const formatValues = new Map<Type, string>();

export function format(program: Program, target: Type, format: string) {
  if (target.kind === "Model" || target.kind === "ModelProperty") {
    // Is it a model type that ultimately derives from 'string'?
    if (getIntrinsicType(target) === "string") {
      formatValues.set(target, format);
    } else {
      throwDiagnostic("Cannot apply @format to a non-string type", target);
    }
  } else {
    throwDiagnostic("Cannot apply @format to anything that isn't a Model or ModelProperty", target);
  }
}

export function getFormat(target: Type): string | undefined {
  return formatValues.get(target);
}

// -- @minLength decorator ---------------------

const minLengthValues = new Map<Type, number>();

export function minLength(program: Program, target: Type, minLength: number) {
  if (target.kind === "Model" || target.kind === "ModelProperty") {
    // Is it a model type that ultimately derives from 'string'?
    if (getIntrinsicType(target) === "string") {
      minLengthValues.set(target, minLength);
    } else {
      throwDiagnostic("Cannot apply @minLength to a non-string type", target);
    }
  } else {
    throwDiagnostic(
      "Cannot apply @minLength to anything that isn't a Model or ModelProperty",
      target
    );
  }
}

export function getMinLength(target: Type): number | undefined {
  return minLengthValues.get(target);
}

// -- @maxLength decorator ---------------------

const maxLengthValues = new Map<Type, number>();

export function maxLength(program: Program, target: Type, maxLength: number) {
  if (target.kind === "Model" || target.kind === "ModelProperty") {
    // Is it a model type that ultimately derives from 'string'?
    if (getIntrinsicType(target) === "string") {
      maxLengthValues.set(target, maxLength);
    } else {
      throwDiagnostic("Cannot apply @maxLength to a non-string type", target);
    }
  } else {
    throwDiagnostic(
      "Cannot apply @maxLength to anything that isn't a Model or ModelProperty",
      target
    );
  }
}

export function getMaxLength(target: Type): number | undefined {
  return maxLengthValues.get(target);
}

// -- @minValue decorator ---------------------

const minValues = new Map<Type, number>();

export function minValue(program: Program, target: Type, minValue: number) {
  if (target.kind === "Model" || target.kind === "ModelProperty") {
    // Is it ultimately a numeric type?
    if (isNumericType(target)) {
      minValues.set(target, minValue);
    } else {
      throwDiagnostic("Cannot apply @minValue to a non-numeric type", target);
    }
  } else {
    throwDiagnostic(
      "Cannot apply @minValue to anything that isn't a Model or ModelProperty",
      target
    );
  }
}

export function getMinValue(target: Type): number | undefined {
  return minValues.get(target);
}

// -- @maxValue decorator ---------------------

const maxValues = new Map<Type, number>();

export function maxValue(program: Program, target: Type, maxValue: number) {
  if (target.kind === "Model" || target.kind === "ModelProperty") {
    // Is it ultimately a numeric type?
    if (isNumericType(target)) {
      maxValues.set(target, maxValue);
    } else {
      throwDiagnostic("Cannot apply @maxValue to a non-numeric type", target);
    }
  } else {
    throwDiagnostic(
      "Cannot apply @maxValue to anything that isn't a Model or ModelProperty",
      target
    );
  }
}

export function getMaxValue(target: Type): number | undefined {
  return maxValues.get(target);
}

// -- @secret decorator ---------------------

const secretTypes = new Map<Type, boolean>();

export function secret(program: Program, target: Type) {
  if (target.kind === "Model") {
    // Is it a model type that ultimately derives from 'string'?
    if (getIntrinsicType(target) === "string") {
      secretTypes.set(target, true);
    } else {
      throwDiagnostic("Cannot apply @secret to a non-string type", target);
    }
  } else {
    throwDiagnostic("Cannot apply @secret to anything that isn't a Model", target);
  }
}

export function isSecret(target: Type): boolean | undefined {
  return secretTypes.get(target);
}

// -- @visibility decorator ---------------------

const visibilitySettings = new Map<Type, string[]>();

export function visibility(program: Program, target: Type, ...visibilities: string[]) {
  if (target.kind === "ModelProperty") {
    visibilitySettings.set(target, visibilities);
  } else {
    throwDiagnostic("The @visibility decorator can only be applied to model properties.", target);
  }
}

export function getVisibility(target: Type): string[] | undefined {
  return visibilitySettings.get(target);
}

export function withVisibility(program: Program, target: Type, ...visibilities: string[]) {
  if (target.kind !== "Model") {
    throwDiagnostic("The @withVisibility decorator can only be applied to models.", target);
  }

  const filter = (_: any, prop: ModelTypeProperty) => {
    const vis = getVisibility(prop);
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

// -- @list decorator ---------------------

const listProperties = new Set<Type>();

export function list(program: Program, target: Type) {
  if (target.kind === "Operation" || target.kind === "ModelProperty") {
    listProperties.add(target);
  } else {
    throwDiagnostic(
      "The @list decorator can only be applied to interface or model properties.",
      target
    );
  }
}

export function isList(target: Type): boolean {
  return listProperties.has(target);
}

// -- @tag decorator ---------------------
const tagProperties = new Map<Type, string[]>();

// Set a tag on an operation or namespace.  There can be multiple tags on either an
// operation or namespace.
export function tag(program: Program, target: Type, tag: string) {
  if (target.kind === "Operation" || target.kind === "Namespace") {
    const tags = tagProperties.get(target);
    if (tags) {
      tags.push(tag);
    } else {
      tagProperties.set(target, [tag]);
    }
  } else {
    throwDiagnostic("The @tag decorator can only be applied to namespace or operation.", target);
  }
}

// Return the tags set on an operation or namespace
export function getTags(target: Type): string[] {
  return tagProperties.get(target) || [];
}

// Merge the tags for a operation with the tags that are on the namespace it resides within.
//
// TODO: (JC) We'll need to update this for nested namespaces
export function getAllTags(namespace: NamespaceType, target: Type): string[] | undefined {
  const tags = new Set<string>();

  for (const t of getTags(namespace)) {
    tags.add(t);
  }
  for (const t of getTags(target)) {
    tags.add(t);
  }
  return tags.size > 0 ? Array.from(tags) : undefined;
}

import { Program } from "../compiler/program";
import { Type } from "../compiler/types";

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

      target =
        (target.assignmentType?.kind === "Model" && target.assignmentType)
        || undefined;
    } else {
      break;
    }
  }

  return undefined;
}

// -- @format decorator ---------------------

const formatValues = new Map<Type, string>();

export function format(program: Program, target: Type, format: string) {
  if (target.kind === "Model") {
    // Is it a model type that ultimately derives from 'string'?
    if (getIntrinsicType(target) === "string") {
      formatValues.set(target, format);
    } else {
      throw new Error("Cannot apply @format to a non-string type");
    }
  } else {
    throw new Error("Cannot apply @format to anything that isn't a Model");
  }
}

export function getFormat(target: Type): string | undefined {
  return formatValues.get(target);
}

// -- @minLength decorator ---------------------

const minLengthValues = new Map<Type, number>();

export function minLength(program: Program, target: Type, minLength: number) {
  if (target.kind === "Model") {
    // Is it a model type that ultimately derives from 'string'?
    if (getIntrinsicType(target) === "string") {
      minLengthValues.set(target, minLength);
    } else {
      throw new Error("Cannot apply @minLength to a non-string type");
    }
  } else {
    throw new Error("Cannot apply @format to anything that isn't a Model");
  }
}

export function getMinLength(target: Type): number | undefined {
  return minLengthValues.get(target);
}

// -- @maxLength decorator ---------------------

const maxLengthValues = new Map<Type, number>();

export function maxLength(program: Program, target: Type, maxLength: number) {
  if (target.kind === "Model") {
    // Is it a model type that ultimately derives from 'string'?
    if (getIntrinsicType(target) === "string") {
      maxLengthValues.set(target, maxLength);
    } else {
      throw new Error("Cannot apply @maxLength to a non-string type");
    }
  } else {
    throw new Error("Cannot apply @format to anything that isn't a Model");
  }
}

export function getMaxLength(target: Type): number | undefined {
  return maxLengthValues.get(target);
}

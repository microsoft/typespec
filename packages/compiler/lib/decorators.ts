import { validateDecoratorParamType, validateDecoratorTarget } from "../core/decorator-utils.js";
import { createDiagnostic } from "../core/messages.js";
import { Program } from "../core/program.js";
import {
  DecoratorContext,
  InterfaceType,
  ModelType,
  ModelTypeProperty,
  NamespaceType,
  OperationType,
  Type,
} from "../core/types.js";

export const namespace = "Cadl";

function replaceTemplatedStringFromProperties(formatString: string, sourceObject: Type) {
  // Template parameters are not valid source objects, just skip them
  if (sourceObject.kind === "TemplateParameter") {
    return formatString;
  }

  return formatString.replace(/{(\w+)}/g, (_, propName) => {
    return (sourceObject as any)[propName];
  });
}

const docsKey = Symbol();
export function $doc(
  { program }: DecoratorContext,
  target: Type,
  text: string,
  sourceObject: Type
) {
  // TODO: replace with built-in decorator validation https://github.com/Azure/cadl-azure/issues/1022

  if (!validateDecoratorParamType(program, target, text, "string")) {
    return;
  }

  // If an object was passed in, use it to format the documentation string
  if (sourceObject) {
    text = replaceTemplatedStringFromProperties(text, sourceObject);
  }

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
export function $intrinsic({ program }: DecoratorContext, target: Type) {
  program.stateSet(intrinsicsKey).add(target);
}

export function isIntrinsic(program: Program, target: Type | undefined) {
  if (!target) {
    return false;
  }
  return program.stateSet(intrinsicsKey).has(target);
}

// Walks the assignmentType chain to find the core intrinsic type, if any
export function getIntrinsicType(
  program: Program,
  target: Type | undefined
): ModelType | undefined {
  while (target) {
    if (target.kind === "Model") {
      if (isIntrinsic(program, target)) {
        return target;
      }

      target = target.baseModel;
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
  return intrinsicType !== undefined && intrinsicType.name === "string";
}

export function isErrorType(type: Type): boolean {
  return type.kind === "Intrinsic" && type.name === "ErrorType";
}

const numericTypesKey = Symbol();
export function $numeric({ program }: DecoratorContext, target: Type) {
  if (!isIntrinsic(program, target)) {
    program.reportDiagnostic(
      createDiagnostic({
        code: "decorator-wrong-target",
        format: { decorator: "@numeric", to: "non-instrinsic type" },
        target,
      })
    );
    return;
  }
  if (!validateDecoratorTarget(program, target, "@numeric", "Model")) {
    return;
  }
  program.stateSet(numericTypesKey).add(target);
}

export function isNumericType(program: Program, target: Type): boolean {
  const intrinsicType = getIntrinsicType(program, target);
  return intrinsicType !== undefined && program.stateSet(numericTypesKey).has(intrinsicType);
}

// -- @error decorator ----------------------

const errorKey = Symbol();

export function $error({ program }: DecoratorContext, target: Type) {
  if (!validateDecoratorTarget(program, target, "@error", "Model")) {
    return;
  }

  program.stateSet(errorKey).add(target);
}

export function isErrorModel(program: Program, target: Type): boolean {
  return program.stateSet(errorKey).has(target);
}

// -- @format decorator ---------------------

const formatValuesKey = Symbol();

export function $format({ program }: DecoratorContext, target: Type, format: string) {
  if (!validateDecoratorTarget(program, target, "@format", ["Model", "ModelProperty"])) {
    return;
  }

  if (getIntrinsicType(program, target)?.name !== "string") {
    program.reportDiagnostic(
      createDiagnostic({
        code: "decorator-wrong-target",
        format: { decorator: "@format", to: "non-string type" },
        target,
      })
    );
    return;
  }

  program.stateMap(formatValuesKey).set(target, format);
}

export function getFormat(program: Program, target: Type): string | undefined {
  return program.stateMap(formatValuesKey).get(target);
}

// -- @pattern decorator ---------------------

const patternValuesKey = Symbol();

export function $pattern({ program }: DecoratorContext, target: Type, pattern: string) {
  if (!validateDecoratorTarget(program, target, "@pattern", ["Model", "ModelProperty"])) {
    return;
  }

  if (getIntrinsicType(program, target)?.name !== "string") {
    program.reportDiagnostic(
      createDiagnostic({
        code: "decorator-wrong-target",
        format: { decorator: "@pattern", to: "non-string type" },
        target,
      })
    );
    return;
  }

  program.stateMap(patternValuesKey).set(target, pattern);
}

export function getPattern(program: Program, target: Type): string | undefined {
  return program.stateMap(patternValuesKey).get(target);
}

// -- @minLength decorator ---------------------

const minLengthValuesKey = Symbol();

export function $minLength({ program }: DecoratorContext, target: Type, minLength: number) {
  if (!validateDecoratorTarget(program, target, "@minLength", ["Model", "ModelProperty"])) {
    return;
  }

  if (getIntrinsicType(program, target)?.name !== "string") {
    program.reportDiagnostic(
      createDiagnostic({
        code: "decorator-wrong-target",
        format: { decorator: "@minLength", to: "non-string type" },
        target,
      })
    );
    return;
  }

  program.stateMap(minLengthValuesKey).set(target, minLength);
}

export function getMinLength(program: Program, target: Type): number | undefined {
  return program.stateMap(minLengthValuesKey).get(target);
}

// -- @maxLength decorator ---------------------

const maxLengthValuesKey = Symbol();

export function $maxLength({ program }: DecoratorContext, target: Type, maxLength: number) {
  if (!validateDecoratorTarget(program, target, "@maxLength", ["Model", "ModelProperty"])) {
    return;
  }

  if (getIntrinsicType(program, target)?.name !== "string") {
    program.reportDiagnostic(
      createDiagnostic({
        code: "decorator-wrong-target",
        format: { decorator: "@maxLength", to: "non-string type" },
        target,
      })
    );
    return;
  }
  program.stateMap(maxLengthValuesKey).set(target, maxLength);
}

export function getMaxLength(program: Program, target: Type): number | undefined {
  return program.stateMap(maxLengthValuesKey).get(target);
}

// -- @minValue decorator ---------------------

const minValuesKey = Symbol();

export function $minValue({ program }: DecoratorContext, target: Type, minValue: number) {
  if (!validateDecoratorTarget(program, target, "@minValue", ["Model", "ModelProperty"])) {
    return;
  }

  if (!isNumericType(program, target)) {
    program.reportDiagnostic(
      createDiagnostic({
        code: "decorator-wrong-target",
        format: { decorator: "@minValue", to: "non-numeric type" },
        target,
      })
    );
    return;
  }
  program.stateMap(minValuesKey).set(target, minValue);
}

export function getMinValue(program: Program, target: Type): number | undefined {
  return program.stateMap(minValuesKey).get(target);
}

// -- @maxValue decorator ---------------------

const maxValuesKey = Symbol();

export function $maxValue({ program }: DecoratorContext, target: Type, maxValue: number) {
  if (!validateDecoratorTarget(program, target, "@maxValue", ["Model", "ModelProperty"])) {
    return;
  }

  if (!isNumericType(program, target)) {
    program.reportDiagnostic(
      createDiagnostic({
        code: "decorator-wrong-target",
        format: { decorator: "@minValue", to: "non-numeric type" },
        target,
      })
    );
    return;
  }
  program.stateMap(maxValuesKey).set(target, maxValue);
}

export function getMaxValue(program: Program, target: Type): number | undefined {
  return program.stateMap(maxValuesKey).get(target);
}

// -- @secret decorator ---------------------

const secretTypesKey = Symbol();

export function $secret({ program }: DecoratorContext, target: Type) {
  if (!validateDecoratorTarget(program, target, "@secret", "Model")) {
    return;
  }

  if (getIntrinsicType(program, target)?.name !== "string") {
    createDiagnostic({
      code: "decorator-wrong-target",
      format: { decorator: "@secret", to: "non-string type" },
      target,
    });
    return;
  }
  program.stateMap(secretTypesKey).set(target, true);
}

export function isSecret(program: Program, target: Type): boolean | undefined {
  return program.stateMap(secretTypesKey).get(target);
}

// -- @visibility decorator ---------------------

const visibilitySettingsKey = Symbol();

export function $visibility(
  { program }: DecoratorContext,
  target: Type,
  ...visibilities: string[]
) {
  if (!validateDecoratorTarget(program, target, "@visibility", ["ModelProperty"])) {
    return;
  }

  program.stateMap(visibilitySettingsKey).set(target, visibilities);
}

export function getVisibility(program: Program, target: Type): string[] | undefined {
  return program.stateMap(visibilitySettingsKey).get(target);
}

export function $withVisibility(program: Program, target: Type, ...visibilities: string[]) {
  if (!validateDecoratorTarget(program, target, "@withVisibility", "Model")) {
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

export function $withOptionalProperties({ program }: DecoratorContext, target: Type) {
  if (!validateDecoratorTarget(program, target, "@withOptionalProperties", "Model")) {
    return;
  }

  // Make all properties of the target type optional
  target.properties.forEach((p) => (p.optional = true));
}

// -- @withUpdatableProperties decorator ----------------------

export function $withUpdateableProperties({ program }: DecoratorContext, target: Type) {
  if (!validateDecoratorTarget(program, target, "@withUpdateableProperties", "Model")) {
    return;
  }

  // remove all read-only properties from the target type
  mapFilterOut(target.properties, (key, value) => {
    const vis = getVisibility(program, value);
    return vis !== undefined && vis.length > 0 && !vis.includes("update");
  });
}

// -- @withoutDefaultValues decorator ----------------------

export function $withoutDefaultValues({ program }: DecoratorContext, target: Type) {
  if (!validateDecoratorTarget(program, target, "@withoutDefaultValues", "Model")) {
    return;
  }

  // remove all read-only properties from the target type
  target.properties.forEach((p) => delete p.default);
}

// -- @list decorator ---------------------

const listPropertiesKey = Symbol();

export function $list({ program }: DecoratorContext, target: Type, listedType?: Type) {
  if (!validateDecoratorTarget(program, target, "@list", "Operation")) {
    return;
  }

  if (listedType && listedType.kind == "TemplateParameter") {
    // Silently return because this is probably being used in a templated interface
    return;
  }

  if (listedType && listedType.kind !== "Model") {
    program.reportDiagnostic(
      createDiagnostic({
        code: "list-type-not-model",
        target,
      })
    );
    return;
  }

  program.stateMap(listPropertiesKey).set(target, listedType);
}

export function getListOperationType(program: Program, target: Type): ModelType | undefined {
  return program.stateMap(listPropertiesKey).get(target);
}

export function isListOperation(program: Program, target: OperationType): boolean {
  // The type stored for the operation
  return program.stateMap(listPropertiesKey).has(target);
}

// -- @tag decorator ---------------------
const tagPropertiesKey = Symbol();

// Set a tag on an operation or namespace.  There can be multiple tags on either an
// operation or namespace.
export function $tag({ program }: DecoratorContext, target: Type, tag: string) {
  if (!validateDecoratorTarget(program, target, "@tag", ["Operation", "Namespace", "Interface"])) {
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

// Merge the tags for a operation with the tags that are on the namespace or
// interface it resides within.
export function getAllTags(
  program: Program,
  target: NamespaceType | InterfaceType | OperationType
): string[] | undefined {
  const tags = new Set<string>();

  let current: NamespaceType | InterfaceType | OperationType | undefined = target;
  while (current !== undefined) {
    for (const t of getTags(program, current)) {
      tags.add(t);
    }

    // Move up to the parent
    if (current.kind === "Operation") {
      current = current.interface ?? current.namespace;
    } else {
      // Type is a namespace or interface
      current = current.namespace;
    }
  }

  return tags.size > 0 ? Array.from(tags).reverse() : undefined;
}

// -- @friendlyName decorator ---------------------

const friendlyNamesKey = Symbol();

export function $friendlyName(
  { program }: DecoratorContext,
  target: Type,
  friendlyName: string,
  sourceObject: Type | undefined
) {
  // TODO: replace with built-in decorator validation https://github.com/Azure/cadl-azure/issues/1022
  if (!validateDecoratorParamType(program, target, friendlyName, "string")) {
    return;
  }

  if (!validateDecoratorTarget(program, target, "@friendlyName", "Model")) {
    return;
  }

  // If an object was passed in, use it to format the friendly name
  if (sourceObject) {
    friendlyName = replaceTemplatedStringFromProperties(friendlyName, sourceObject);
  }

  program.stateMap(friendlyNamesKey).set(target, friendlyName);
}

export function getFriendlyName(program: Program, target: Type): string {
  return program.stateMap(friendlyNamesKey).get(target);
}

import {
  isIntrinsicType,
  validateDecoratorNotOnType,
  validateDecoratorTarget,
} from "../core/decorator-utils.js";
import { getDeprecationDetails, markDeprecated } from "../core/deprecation.js";
import {
  StdTypeName,
  StringLiteral,
  getDiscriminatedUnion,
  getTypeName,
  ignoreDiagnostics,
  reportDeprecated,
  validateDecoratorUniqueOnNode,
} from "../core/index.js";
import { createDiagnostic, reportDiagnostic } from "../core/messages.js";
import { Program, ProjectedProgram } from "../core/program.js";
import {
  ArrayModelType,
  DecoratorContext,
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelIndexer,
  ModelProperty,
  Namespace,
  Operation,
  Scalar,
  Type,
  Union,
} from "../core/types.js";
export * from "./service.js";

export const namespace = "TypeSpec";

function replaceTemplatedStringFromProperties(formatString: string, sourceObject: Type) {
  // Template parameters are not valid source objects, just skip them
  if (sourceObject.kind === "TemplateParameter") {
    return formatString;
  }

  return formatString.replace(/{(\w+)}/g, (_, propName) => {
    return (sourceObject as any)[propName];
  });
}

function createStateSymbol(name: string) {
  return Symbol.for(`TypeSpec.${name}`);
}

const summaryKey = createStateSymbol("summary");
/**
 * @summary attaches a documentation string. It is typically used to give a short, single-line
 * description, and can be used in combination with or instead of @doc.
 *
 * The first argument to @summary is a string, which may contain template parameters, enclosed in braces,
 * which are replaced with an attribute for the type (commonly "name") passed as the second (optional) argument.
 *
 * @summary can be specified on any language element -- a model, an operation, a namespace, etc.
 */
export function $summary(
  context: DecoratorContext,
  target: Type,
  text: string,
  sourceObject: Type
) {
  if (sourceObject) {
    text = replaceTemplatedStringFromProperties(text, sourceObject);
  }

  context.program.stateMap(summaryKey).set(target, text);
}

export function getSummary(program: Program, type: Type): string | undefined {
  return program.stateMap(summaryKey).get(type);
}

const docsKey = createStateSymbol("docs");
const returnsDocsKey = createStateSymbol("returnsDocs");
const errorsDocsKey = createStateSymbol("errorDocs");
type DocTarget = "self" | "returns" | "errors";

export interface DocData {
  /**
   * Doc value.
   */
  value: string;

  /**
   * How was the doc set.
   * - `@doc` means the `@doc` decorator was used
   * - `comment` means it was set from a `/** comment * /`
   */
  source: "decorator" | "comment";
}
/**
 * @doc attaches a documentation string. Works great with multi-line string literals.
 *
 * The first argument to @doc is a string, which may contain template parameters, enclosed in braces,
 * which are replaced with an attribute for the type (commonly "name") passed as the second (optional) argument.
 *
 * @doc can be specified on any language element -- a model, an operation, a namespace, etc.
 */
export function $doc(context: DecoratorContext, target: Type, text: string, sourceObject?: Type) {
  validateDecoratorUniqueOnNode(context, target, $doc);
  if (sourceObject) {
    text = replaceTemplatedStringFromProperties(text, sourceObject);
  }
  setDocData(context.program, target, "self", { value: text, source: "decorator" });
}

/**
 * @internal to be used to set the `@doc` from doc comment.
 */
export function $docFromComment(
  context: DecoratorContext,
  target: Type,
  key: DocTarget,
  text: string
) {
  setDocData(context.program, target, key, { value: text, source: "comment" });
}

function getDocKey(target: DocTarget): symbol {
  switch (target) {
    case "self":
      return docsKey;
    case "returns":
      return returnsDocsKey;
    case "errors":
      return errorsDocsKey;
  }
}

function setDocData(program: Program, target: Type, key: DocTarget, data: DocData) {
  program.stateMap(getDocKey(key)).set(target, data);
}

/**
 * Get the documentation information for the given type. In most cases you probably just want to use {@link getDoc}
 * @param program Program
 * @param target Type
 * @returns Doc data with source information.
 */
export function getDocDataInternal(
  program: Program,
  target: Type,
  key: DocTarget
): DocData | undefined {
  return program.stateMap(getDocKey(key)).get(target);
}

/**
 * Get the documentation information for the given type. In most cases you probably just want to use {@link getDoc}
 * @param program Program
 * @param target Type
 * @returns Doc data with source information.
 */
export function getDocData(program: Program, target: Type): DocData | undefined {
  return getDocDataInternal(program, target, "self");
}

/**
 * Get the documentation string for the given type.
 * @param program Program
 * @param target Type
 * @returns Documentation value
 */
export function getDoc(program: Program, target: Type): string | undefined {
  return getDocDataInternal(program, target, "self")?.value;
}

export function $returnsDoc(context: DecoratorContext, target: Operation, text: string) {
  validateDecoratorUniqueOnNode(context, target, $doc);
  setDocData(context.program, target, "returns", { value: text, source: "decorator" });
}

/**
 * Get the documentation information for the return success types of an operation. In most cases you probably just want to use {@link getReturnsDoc}
 * @param program Program
 * @param target Type
 * @returns Doc data with source information.
 */
export function getReturnsDocData(program: Program, target: Operation): DocData | undefined {
  return getDocDataInternal(program, target, "returns");
}

/**
 * Get the documentation string for the return success types of an operation.
 * @param program Program
 * @param target Type
 * @returns Documentation value
 */
export function getReturnsDoc(program: Program, target: Operation): string | undefined {
  return getDocDataInternal(program, target, "returns")?.value;
}

export function $errorsDoc(context: DecoratorContext, target: Operation, text: string) {
  validateDecoratorUniqueOnNode(context, target, $doc);
  setDocData(context.program, target, "errors", { value: text, source: "decorator" });
}

/**
 * Get the documentation information for the return errors types of an operation. In most cases you probably just want to use {@link getErrorsDoc}
 * @param program Program
 * @param target Type
 * @returns Doc data with source information.
 */
export function getErrorsDocData(program: Program, target: Operation): DocData | undefined {
  return getDocDataInternal(program, target, "errors");
}

/**
 * Get the documentation string for the return errors types of an operation.
 * @param program Program
 * @param target Type
 * @returns Documentation value
 */
export function getErrorsDoc(program: Program, target: Operation): string | undefined {
  return getDocDataInternal(program, target, "errors")?.value;
}

export function $inspectType(program: Program, target: Type, text: string) {
  // eslint-disable-next-line no-console
  if (text) console.log(text);
  // eslint-disable-next-line no-console
  console.dir(target, { depth: 3 });
}

export function $inspectTypeName(program: Program, target: Type, text: string) {
  // eslint-disable-next-line no-console
  if (text) console.log(text);
  // eslint-disable-next-line no-console
  console.log(getTypeName(target));
}

const indexTypeKey = createStateSymbol("index");
export function $indexer(context: DecoratorContext, target: Type, key: Scalar, value: Type) {
  const indexer: ModelIndexer = { key, value };
  context.program.stateMap(indexTypeKey).set(target, indexer);
}

export function getIndexer(program: Program, target: Type): ModelIndexer | undefined {
  return program.stateMap(indexTypeKey).get(target);
}

export function isStringType(program: Program | ProjectedProgram, target: Type): target is Scalar {
  const coreType = program.checker.getStdType("string");
  const stringType = target.projector ? target.projector.projectType(coreType) : coreType;
  return (
    target.kind === "Scalar" && program.checker.isTypeAssignableTo(target, stringType, target)[0]
  );
}

export function isNumericType(program: Program | ProjectedProgram, target: Type): target is Scalar {
  const coreType = program.checker.getStdType("numeric");
  const numericType = target.projector ? target.projector.projectType(coreType) : coreType;
  return (
    target.kind === "Scalar" && program.checker.isTypeAssignableTo(target, numericType, target)[0]
  );
}

/**
 * Check the given type is matching the given condition or is a union of null and types matching the condition.
 * @param type Type to test
 * @param condition Condition
 * @returns Boolean
 */
function isTypeIn(type: Type, condition: (type: Type) => boolean): boolean {
  if (type.kind === "Union") {
    return [...type.variants.values()].some((v) => condition(v.type));
  }

  return condition(type);
}

function validateTargetingANumeric(
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  decoratorName: string
) {
  const valid = isTypeIn(getPropertyType(target), (x) => isNumericType(context.program, x));
  if (!valid) {
    reportDiagnostic(context.program, {
      code: "decorator-wrong-target",
      format: {
        decorator: decoratorName,
        to: `type it is not a numeric`,
      },
      target: context.decoratorTarget,
    });
  }
  return valid;
}

/**
 * Validate the given target is a string type or a union containing at least a string type.
 */
function validateTargetingAString(
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  decoratorName: string
) {
  const valid = isTypeIn(getPropertyType(target), (x) => isStringType(context.program, x));
  if (!valid) {
    reportDiagnostic(context.program, {
      code: "decorator-wrong-target",
      format: {
        decorator: decoratorName,
        to: `type it is not a string`,
      },
      target: context.decoratorTarget,
    });
  }
  return valid;
}

/**
 * @param type Model type
 */
export function isArrayModelType(program: Program, type: Model): type is ArrayModelType {
  return Boolean(type.indexer && type.indexer.key.name === "integer");
}

/**
 * Check if a model is an array type.
 * @param type Model type
 */
export function isRecordModelType(program: Program, type: Model): type is ArrayModelType {
  return Boolean(type.indexer && type.indexer.key.name === "string");
}

/**
 * Return the type of the property or the model itself.
 */
export function getPropertyType(target: Scalar | ModelProperty): Type {
  if (target.kind === "ModelProperty") {
    return target.type;
  } else {
    return target;
  }
}

// -- @error decorator ----------------------

const errorKey = createStateSymbol("error");

/**
 * `@error` decorator marks a model as an error type.
 *
 * `@error` can only be specified on a model.
 */
export function $error(context: DecoratorContext, entity: Model) {
  validateDecoratorUniqueOnNode(context, entity, $error);
  context.program.stateSet(errorKey).add(entity);
}

export function isErrorModel(program: Program, target: Type): boolean {
  return program.stateSet(errorKey).has(target);
}

// -- @format decorator ---------------------

const formatValuesKey = createStateSymbol("formatValues");

/**
 * `@format` - specify the data format hint for a string type
 *
 * The first argument is a string that identifies the format that the string type expects.  Any string
 * can be entered here, but a TypeSpec emitter must know how to interpret
 *
 * For TypeSpec specs that will be used with an OpenAPI emitter, the OpenAPI specification describes possible
 * valid values for a string type's format:
 *
 * https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#dataTypes
 *
 * `@format` can be specified on a type that extends from `string` or a `string`-typed model property.
 */
export function $format(context: DecoratorContext, target: Scalar | ModelProperty, format: string) {
  validateDecoratorUniqueOnNode(context, target, $format);

  if (!validateTargetingAString(context, target, "@format")) {
    return;
  }
  const targetType = getPropertyType(target);
  if (targetType.kind === "Scalar" && isIntrinsicType(context.program, targetType, "bytes")) {
    reportDeprecated(
      context.program,
      "Using `@format` on a bytes scalar is deprecated. Use `@encode` instead. https://github.com/microsoft/typespec/issues/1873",
      target
    );
  }

  context.program.stateMap(formatValuesKey).set(target, format);
}

export function getFormat(program: Program, target: Type): string | undefined {
  return program.stateMap(formatValuesKey).get(target);
}

// -- @pattern decorator ---------------------

const patternValuesKey = createStateSymbol("patternValues");

export function $pattern(
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  pattern: string
) {
  validateDecoratorUniqueOnNode(context, target, $pattern);

  if (!validateTargetingAString(context, target, "@pattern")) {
    return;
  }

  context.program.stateMap(patternValuesKey).set(target, pattern);
}

export function getPattern(program: Program, target: Type): string | undefined {
  return program.stateMap(patternValuesKey).get(target);
}

// -- @minLength decorator ---------------------

const minLengthValuesKey = createStateSymbol("minLengthValues");

export function $minLength(
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  minLength: number
) {
  validateDecoratorUniqueOnNode(context, target, $minLength);

  if (
    !validateTargetingAString(context, target, "@minLength") ||
    !validateRange(context, minLength, getMaxLength(context.program, target))
  ) {
    return;
  }

  context.program.stateMap(minLengthValuesKey).set(target, minLength);
}

export function getMinLength(program: Program, target: Type): number | undefined {
  return program.stateMap(minLengthValuesKey).get(target);
}

// -- @maxLength decorator ---------------------

const maxLengthValuesKey = createStateSymbol("maxLengthValues");

export function $maxLength(
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  maxLength: number
) {
  validateDecoratorUniqueOnNode(context, target, $maxLength);

  if (
    !validateTargetingAString(context, target, "@maxLength") ||
    !validateRange(context, getMinLength(context.program, target), maxLength)
  ) {
    return;
  }

  context.program.stateMap(maxLengthValuesKey).set(target, maxLength);
}

export function getMaxLength(program: Program, target: Type): number | undefined {
  return program.stateMap(maxLengthValuesKey).get(target);
}

// -- @minItems decorator ---------------------

const minItemsValuesKey = createStateSymbol("minItems");

export function $minItems(
  context: DecoratorContext,
  target: Model | ModelProperty,
  minItems: number
) {
  validateDecoratorUniqueOnNode(context, target, $minItems);

  if (!isArrayModelType(context.program, target.kind === "Model" ? target : (target.type as any))) {
    reportDiagnostic(context.program, {
      code: "decorator-wrong-target",
      format: {
        decorator: "@minItems",
        to: `non Array type`,
      },
      target: context.decoratorTarget,
    });
  }

  if (!validateRange(context, minItems, getMaxItems(context.program, target))) {
    return;
  }

  context.program.stateMap(minItemsValuesKey).set(target, minItems);
}

export function getMinItems(program: Program, target: Type): number | undefined {
  return program.stateMap(minItemsValuesKey).get(target);
}

// -- @maxLength decorator ---------------------

const maxItemsValuesKey = createStateSymbol("maxItems");

export function $maxItems(
  context: DecoratorContext,
  target: Model | ModelProperty,
  maxItems: number
) {
  validateDecoratorUniqueOnNode(context, target, $maxItems);

  if (!isArrayModelType(context.program, target.kind === "Model" ? target : (target.type as any))) {
    reportDiagnostic(context.program, {
      code: "decorator-wrong-target",
      format: {
        decorator: "@maxItems",
        to: `non Array type`,
      },
      target: context.decoratorTarget,
    });
  }
  if (!validateRange(context, getMinItems(context.program, target), maxItems)) {
    return;
  }

  context.program.stateMap(maxItemsValuesKey).set(target, maxItems);
}

export function getMaxItems(program: Program, target: Type): number | undefined {
  return program.stateMap(maxItemsValuesKey).get(target);
}

// -- @minValue decorator ---------------------

const minValuesKey = createStateSymbol("minValues");

export function $minValue(
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  minValue: number
) {
  validateDecoratorUniqueOnNode(context, target, $minValue);
  validateDecoratorNotOnType(context, target, $minValueExclusive, $minValue);
  const { program } = context;

  if (!validateTargetingANumeric(context, target, "@minValue")) {
    return;
  }

  if (
    !validateRange(
      context,
      minValue,
      getMaxValue(context.program, target) ?? getMaxValueExclusive(context.program, target)
    )
  ) {
    return;
  }
  program.stateMap(minValuesKey).set(target, minValue);
}

export function getMinValue(program: Program, target: Type): number | undefined {
  return program.stateMap(minValuesKey).get(target);
}

// -- @maxValue decorator ---------------------

const maxValuesKey = createStateSymbol("maxValues");

export function $maxValue(
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  maxValue: number
) {
  validateDecoratorUniqueOnNode(context, target, $maxValue);
  validateDecoratorNotOnType(context, target, $maxValueExclusive, $maxValue);
  const { program } = context;
  if (!validateTargetingANumeric(context, target, "@maxValue")) {
    return;
  }

  if (
    !validateRange(
      context,
      getMinValue(context.program, target) ?? getMinValueExclusive(context.program, target),
      maxValue
    )
  ) {
    return;
  }
  program.stateMap(maxValuesKey).set(target, maxValue);
}

export function getMaxValue(program: Program, target: Type): number | undefined {
  return program.stateMap(maxValuesKey).get(target);
}

// -- @minValueExclusive decorator ---------------------

const minValueExclusiveKey = createStateSymbol("minValueExclusive");

export function $minValueExclusive(
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  minValueExclusive: number
) {
  validateDecoratorUniqueOnNode(context, target, $minValueExclusive);
  validateDecoratorNotOnType(context, target, $minValue, $minValueExclusive);
  const { program } = context;

  if (!validateTargetingANumeric(context, target, "@minValueExclusive")) {
    return;
  }

  if (
    !validateRange(
      context,
      minValueExclusive,
      getMaxValue(context.program, target) ?? getMaxValueExclusive(context.program, target)
    )
  ) {
    return;
  }
  program.stateMap(minValueExclusiveKey).set(target, minValueExclusive);
}

export function getMinValueExclusive(program: Program, target: Type): number | undefined {
  return program.stateMap(minValueExclusiveKey).get(target);
}

// -- @maxValueExclusive decorator ---------------------

const maxValueExclusiveKey = createStateSymbol("maxValueExclusive");

export function $maxValueExclusive(
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  maxValueExclusive: number
) {
  validateDecoratorUniqueOnNode(context, target, $maxValueExclusive);
  validateDecoratorNotOnType(context, target, $maxValue, $maxValueExclusive);
  const { program } = context;
  if (!validateTargetingANumeric(context, target, "@maxValueExclusive")) {
    return;
  }

  if (
    !validateRange(
      context,
      getMinValue(context.program, target) ?? getMinValueExclusive(context.program, target),
      maxValueExclusive
    )
  ) {
    return;
  }
  program.stateMap(maxValueExclusiveKey).set(target, maxValueExclusive);
}

export function getMaxValueExclusive(program: Program, target: Type): number | undefined {
  return program.stateMap(maxValueExclusiveKey).get(target);
}

// -- @secret decorator ---------------------

const secretTypesKey = createStateSymbol("secretTypes");

/**
 * Mark a string as a secret value that should be treated carefully to avoid exposure
 * @param context Decorator context
 * @param target Decorator target, either a string model or a property with type string.
 */
export function $secret(context: DecoratorContext, target: Scalar | ModelProperty) {
  validateDecoratorUniqueOnNode(context, target, $secret);

  if (!validateTargetingAString(context, target, "@secret")) {
    return;
  }
  context.program.stateMap(secretTypesKey).set(target, true);
}

export function isSecret(program: Program, target: Type): boolean | undefined {
  return program.stateMap(secretTypesKey).get(target);
}

export type DateTimeKnownEncoding = "rfc3339" | "rfc7231" | "unixTimestamp";
export type DurationKnownEncoding = "ISO8601" | "seconds";
export type BytesKnownEncoding = "base64" | "base64url";
export interface EncodeData {
  encoding: DateTimeKnownEncoding | DurationKnownEncoding | string;
  type: Scalar;
}

const encodeKey = createStateSymbol("encode");
export function $encode(
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  encoding: string | EnumMember,
  encodeAs?: Scalar
) {
  validateDecoratorUniqueOnNode(context, target, $encode);

  const encodeData: EncodeData = {
    encoding: typeof encoding === "string" ? encoding : encoding.value?.toString() ?? encoding.name,
    type: encodeAs ?? context.program.checker.getStdType("string"),
  };
  const targetType = getPropertyType(target);
  if (targetType.kind !== "Scalar") {
    return;
  }
  validateEncodeData(context, targetType, encodeData);
  context.program.stateMap(encodeKey).set(target, encodeData);
}

function validateEncodeData(context: DecoratorContext, target: Scalar, encodeData: EncodeData) {
  function check(validTargets: StdTypeName[], validEncodeTypes: StdTypeName[]) {
    const checker = context.program.checker;
    const isTargetValid = validTargets.some((validTarget) => {
      return ignoreDiagnostics(
        checker.isTypeAssignableTo(
          target.projectionBase ?? target,
          checker.getStdType(validTarget),
          target
        )
      );
    });

    if (!isTargetValid) {
      reportDiagnostic(context.program, {
        code: "invalid-encode",
        messageId: "wrongType",
        format: {
          encoding: encodeData.encoding,
          type: getTypeName(target),
          expected: validTargets.join(", "),
        },
        target: context.decoratorTarget,
      });
    }
    const isEncodingTypeValid = validEncodeTypes.some((validEncoding) => {
      return ignoreDiagnostics(
        checker.isTypeAssignableTo(
          encodeData.type.projectionBase ?? encodeData.type,
          checker.getStdType(validEncoding),
          target
        )
      );
    });

    if (!isEncodingTypeValid) {
      const typeName = getTypeName(encodeData.type.projectionBase ?? encodeData.type);
      reportDiagnostic(context.program, {
        code: "invalid-encode",
        messageId: ["unixTimestamp", "seconds"].includes(encodeData.encoding)
          ? "wrongNumericEncodingType"
          : "wrongEncodingType",
        format: {
          encoding: encodeData.encoding,
          type: getTypeName(target),
          expected: validEncodeTypes.join(", "),
          actual: typeName,
        },
        target: context.decoratorTarget,
      });
    }
  }

  switch (encodeData.encoding) {
    case "rfc3339":
      return check(["utcDateTime", "offsetDateTime"], ["string"]);
    case "rfc7231":
      return check(["utcDateTime", "offsetDateTime"], ["string"]);
    case "unixTimestamp":
      return check(["utcDateTime"], ["integer"]);
    case "seconds":
      return check(["duration"], ["numeric"]);
    case "base64":
      return check(["bytes"], ["string"]);
    case "base64url":
      return check(["bytes"], ["string"]);
  }
}

export function getEncode(
  program: Program,
  target: Scalar | ModelProperty
): EncodeData | undefined {
  return program.stateMap(encodeKey).get(target);
}

// -- @visibility decorator ---------------------

const visibilitySettingsKey = createStateSymbol("visibilitySettings");

export function $visibility(
  context: DecoratorContext,
  target: ModelProperty,
  ...visibilities: string[]
) {
  validateDecoratorUniqueOnNode(context, target, $visibility);

  context.program.stateMap(visibilitySettingsKey).set(target, visibilities);
}

export function getVisibility(program: Program, target: Type): string[] | undefined {
  return program.stateMap(visibilitySettingsKey).get(target);
}

function clearVisibilities(program: Program, target: Type) {
  program.stateMap(visibilitySettingsKey).delete(target);
}

export function $withVisibility(
  context: DecoratorContext,
  target: Model,
  ...visibilities: string[]
) {
  filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, visibilities));
  [...target.properties.values()].forEach((p) => clearVisibilities(context.program, p));
}

export function isVisible(
  program: Program,
  property: ModelProperty,
  visibilities: readonly string[]
) {
  const propertyVisibilities = getVisibility(program, property);
  return !propertyVisibilities || propertyVisibilities.some((v) => visibilities.includes(v));
}

function filterModelPropertiesInPlace(model: Model, filter: (prop: ModelProperty) => boolean) {
  for (const [key, prop] of model.properties) {
    if (!filter(prop)) {
      model.properties.delete(key);
    }
  }
}

// -- @withOptionalProperties decorator ---------------------

export function $withOptionalProperties(context: DecoratorContext, target: Model) {
  // Make all properties of the target type optional
  target.properties.forEach((p) => (p.optional = true));
}

// -- @withUpdateableProperties decorator ----------------------

export function $withUpdateableProperties(context: DecoratorContext, target: Type) {
  if (!validateDecoratorTarget(context, target, "@withUpdateableProperties", "Model")) {
    return;
  }

  filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, ["update"]));
}

// -- @withoutOmittedProperties decorator ----------------------

export function $withoutOmittedProperties(
  context: DecoratorContext,
  target: Model,
  omitProperties: StringLiteral | Union
) {
  // Get the property or properties to omit
  const omitNames = new Set<string>();
  if (omitProperties.kind === "String") {
    omitNames.add(omitProperties.value);
  } else {
    for (const variant of omitProperties.variants.values()) {
      if (variant.type.kind === "String") {
        omitNames.add(variant.type.value);
      }
    }
  }

  // Remove all properties to be omitted
  filterModelPropertiesInPlace(target, (prop) => !omitNames.has(prop.name));
}

// -- @withoutDefaultValues decorator ----------------------

export function $withoutDefaultValues(context: DecoratorContext, target: Model) {
  // remove all read-only properties from the target type
  target.properties.forEach((p) => delete p.default);
}

// -- @list decorator ---------------------

const listPropertiesKey = createStateSymbol("listProperties");

/**
 * @deprecated Use the `listsResource` decorator in `@typespec/rest` instead.
 */
export function $list(context: DecoratorContext, target: Operation, listedType?: Type) {
  if (listedType && listedType.kind === "TemplateParameter") {
    // Silently return because this is probably being used in a templated interface
    return;
  }
  if (listedType && listedType.kind !== "Model") {
    reportDiagnostic(context.program, {
      code: "list-type-not-model",
      target: context.getArgumentTarget(0)!,
    });
    return;
  }

  context.program.stateMap(listPropertiesKey).set(target, listedType);
}

/**
 * @deprecated This function is unused and will be removed in a future release.
 */
export function getListOperationType(program: Program, target: Type): Model | undefined {
  return program.stateMap(listPropertiesKey).get(target);
}

/**
 * @deprecated Use `isListOperation` in `@typespec/rest` instead.
 */
export function isListOperation(program: Program, target: Operation): boolean {
  // The type stored for the operation
  return program.stateMap(listPropertiesKey).has(target);
}

// -- @tag decorator ---------------------
const tagPropertiesKey = createStateSymbol("tagProperties");

// Set a tag on an operation, interface, or namespace.  There can be multiple tags on an
// operation, interface, or namespace.
export function $tag(
  context: DecoratorContext,
  target: Operation | Namespace | Interface,
  tag: string
) {
  const tags = context.program.stateMap(tagPropertiesKey).get(target);
  if (tags) {
    tags.push(tag);
  } else {
    context.program.stateMap(tagPropertiesKey).set(target, [tag]);
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
  target: Namespace | Interface | Operation
): string[] | undefined {
  const tags = new Set<string>();

  let current: Namespace | Interface | Operation | undefined = target;
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

const friendlyNamesKey = createStateSymbol("friendlyNames");

export function $friendlyName(
  context: DecoratorContext,
  target: Type,
  friendlyName: string,
  sourceObject: Type | undefined
) {
  // If an object was passed in, use it to format the friendly name
  if (sourceObject) {
    friendlyName = replaceTemplatedStringFromProperties(friendlyName, sourceObject);
  }

  context.program.stateMap(friendlyNamesKey).set(target, friendlyName);
}

export function getFriendlyName(program: Program, target: Type): string {
  return program.stateMap(friendlyNamesKey).get(target);
}

const knownValuesKey = createStateSymbol("knownValues");
/**
 * `@knownValues` marks a string type with an enum that contains all known values
 *
 * The first parameter is a reference to an enum type that describes all possible values that the
 * type accepts.
 *
 * `@knownValues` can only be applied to model types that extend `string`.
 *
 * @param target Decorator target. Must be a string. (model Foo extends string)
 * @param knownValues Must be an enum.
 */
export function $knownValues(
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  knownValues: Enum
) {
  const type = getPropertyType(target);
  if (!isStringType(context.program, type) && !isNumericType(context.program, type)) {
    context.program.reportDiagnostic(
      createDiagnostic({
        code: "decorator-wrong-target",
        format: { decorator: "@knownValues", to: "type, it is  not a string or numeric" },
        target,
      })
    );
    return;
  }

  for (const member of knownValues.members.values()) {
    const propertyType = getPropertyType(target);
    if (!isEnumMemberAssignableToType(context.program, propertyType, member)) {
      reportDiagnostic(context.program, {
        code: "known-values-invalid-enum",
        format: {
          member: member.name,
          type: getTypeName(propertyType),
        },
        target,
      });
      return;
    }
  }
  context.program.stateMap(knownValuesKey).set(target, knownValues);
}

function isEnumMemberAssignableToType(program: Program, typeName: Type, member: EnumMember) {
  const memberType = member.value !== undefined ? typeof member.value : "string";
  switch (memberType) {
    case "string":
      return isStringType(program, typeName);
    case "number":
      return isNumericType(program, typeName);
    default:
      return false;
  }
}

export function getKnownValues(program: Program, target: Scalar | ModelProperty): Enum | undefined {
  return program.stateMap(knownValuesKey).get(target);
}

const keyKey = createStateSymbol("key");

/**
 * `@key` - mark a model property as the key to identify instances of that type
 *
 * The optional first argument accepts an alternate key name which may be used by emitters.
 * Otherwise, the name of the target property will be used.
 *
 * `@key` can only be applied to model properties.
 */
export function $key(context: DecoratorContext, entity: ModelProperty, altName?: string): void {
  // Ensure that the key property is not marked as optional
  if (entity.optional) {
    reportDiagnostic(context.program, {
      code: "no-optional-key",
      format: { propertyName: entity.name },
      target: entity,
    });

    return;
  }

  // Register the key property
  context.program.stateMap(keyKey).set(entity, altName || entity.name);
}

export function isKey(program: Program, property: ModelProperty) {
  return program.stateMap(keyKey).has(property);
}

export function getKeyName(program: Program, property: ModelProperty): string {
  return program.stateMap(keyKey).get(property);
}

export function $withDefaultKeyVisibility(
  context: DecoratorContext,
  entity: Model,
  visibility: string
): void {
  const keyProperties: ModelProperty[] = [];
  entity.properties.forEach((prop: ModelProperty) => {
    // Keep track of any key property without a visibility
    if (isKey(context.program, prop) && !getVisibility(context.program, prop)) {
      keyProperties.push(prop);
    }
  });

  // For each key property without a visibility, clone it and add the specified
  // default visibility value
  keyProperties.forEach((keyProp) => {
    entity.properties.set(
      keyProp.name,
      context.program.checker.cloneType(keyProp, {
        decorators: [
          ...keyProp.decorators,
          {
            decorator: $visibility,
            args: [
              { value: context.program.checker.createLiteralType(visibility), jsValue: visibility },
            ],
          },
        ],
      })
    );
  });
}

/**
 * Mark a type as deprecated
 * @param context DecoratorContext
 * @param target Decorator target
 * @param message Deprecation target.
 *
 * @example
 * ``` @deprecated("Foo is deprecated, use Bar instead.")
 *     model Foo {}
 * ```
 */
export function $deprecated(context: DecoratorContext, target: Type, message: string) {
  markDeprecated(context.program, target, { message });
}

/**
 * Return the deprecated message or undefined if not deprecated
 * @param program Program
 * @param type Type
 */
export function getDeprecated(program: Program, type: Type): string | undefined {
  return getDeprecationDetails(program, type)?.message;
}

const overloadedByKey = createStateSymbol("overloadedByKey");
const overloadsOperationKey = createStateSymbol("overloadsOperation");

/**
 * `@overload` - Indicate that the target overloads (specializes) the overloads type.
 * @param context DecoratorContext
 * @param target The specializing operation declaration
 * @param overloadBase The operation to be overloaded.
 */
export function $overload(context: DecoratorContext, target: Operation, overloadBase: Operation) {
  // Ensure that the overloaded method arguments are a subtype of the original operation.
  const [paramValid, paramDiagnostics] = context.program.checker.isTypeAssignableTo(
    target.parameters,
    overloadBase.parameters,
    target
  );
  if (!paramValid) context.program.reportDiagnostics(paramDiagnostics);

  const [returnTypeValid, returnTypeDiagnostics] = context.program.checker.isTypeAssignableTo(
    target.returnType,
    overloadBase.returnType,
    target
  );
  if (!returnTypeValid) context.program.reportDiagnostics(returnTypeDiagnostics);

  if (!areOperationsInSameContainer(target, overloadBase)) {
    reportDiagnostic(context.program, {
      code: "overload-same-parent",
      target: context.decoratorTarget,
    });
  }
  // Save the information about the overloaded operation
  context.program.stateMap(overloadsOperationKey).set(target, overloadBase);
  const existingOverloads = getOverloads(context.program, overloadBase) || new Array<Operation>();
  context.program.stateMap(overloadedByKey).set(overloadBase, existingOverloads.concat(target));
}

function areOperationsInSameContainer(op1: Operation, op2: Operation): boolean {
  return op1.interface || op2.interface
    ? equalsWithoutProjection(op1.interface, op2.interface)
    : op1.namespace === op2.namespace;
}

// note: because the 'interface' property of Operation types is projected after the
// type is finalized, the target operation or overloadBase may reference an un-projected
// interface at the time of decorator execution during projections.  This normalizes
// the interfaces to their unprojected form before comparison.
function equalsWithoutProjection(
  interface1: Interface | undefined,
  interface2: Interface | undefined
): boolean {
  if (interface1 === undefined || interface2 === undefined) return false;
  return getBaseInterface(interface1) === getBaseInterface(interface2);
}

function getBaseInterface(int1: Interface): Interface {
  return int1.projectionSource === undefined
    ? int1
    : getBaseInterface(int1.projectionSource as Interface);
}

/**
 * Get all operations that are marked as overloads of the given operation
 * @param program Program
 * @param operation Operation
 * @returns An array of operations that overload the given operation.
 */
export function getOverloads(program: Program, operation: Operation): Operation[] | undefined {
  return program.stateMap(overloadedByKey).get(operation);
}

/**
 * If the given operation overloads another operation, return that operation.
 * @param program Program
 * @param operation The operation to check for an overload target.
 * @returns The operation this operation overloads, if any.
 */
export function getOverloadedOperation(
  program: Program,
  operation: Operation
): Operation | undefined {
  return program.stateMap(overloadsOperationKey).get(operation);
}

const projectedNameKey = createStateSymbol("projectedNameKey");

/**
 * `@projectedName` - Indicate that this entity should be renamed according to the given projection.
 * @param context DecoratorContext
 * @param target The that should have a different name.
 * @param projectionName Name of the projection (e.g. "toJson", "toCSharp")
 * @param projectedName Name of the type should have in the scope of the projection specified.
 */
export function $projectedName(
  context: DecoratorContext,
  target: Type,
  projectionName: string,
  projectedName: string
) {
  let map: Map<string, string> = context.program.stateMap(projectedNameKey).get(target);
  if (map === undefined) {
    map = new Map();
    context.program.stateMap(projectedNameKey).set(target, map);
  }
  map.set(projectionName, projectedName);
}

/**
 * @param program Program
 * @param target Target
 * @returns Map of the projected names for the given entity.
 */
export function getProjectedNames(
  program: Program,
  target: Type
): ReadonlyMap<string, string> | undefined {
  return program.stateMap(projectedNameKey).get(target);
}

/**
 * Get the projected name of the given entity for the given projection.
 * @param program Program
 * @param target Target
 * @returns Projected name for the given projection
 */
export function getProjectedName(
  program: Program,
  target: Type,
  projectionName: string
): string | undefined {
  return getProjectedNames(program, target)?.get(projectionName);
}

/**
 * Get the projected name of the given entity for the given projection.
 * @param program Program
 * @param target Target
 * @returns Projected name for the given projection
 */
export function hasProjectedName(program: Program, target: Type, projectionName: string): boolean {
  return getProjectedNames(program, target)?.has(projectionName) ?? false;
}

function validateRange(
  context: DecoratorContext,
  min: number | undefined,
  max: number | undefined
): boolean {
  if (min === undefined || max === undefined) {
    return true;
  }

  if (min > max) {
    reportDiagnostic(context.program, {
      code: "invalid-range",
      format: { start: min.toString(), end: max.toString() },
      target: context.decoratorTarget,
    });
    return false;
  }
  return true;
}

export interface Discriminator {
  propertyName: string;
}

const discriminatorKey = createStateSymbol("discriminator");

export function $discriminator(
  context: DecoratorContext,
  entity: Model | Union,
  propertyName: string
) {
  const discriminator: Discriminator = { propertyName };

  if (entity.kind === "Union") {
    // we can validate discriminator up front for unions. Models are validated in the accessor as we might not have the reference to all derived types at this time.
    const [, diagnostics] = getDiscriminatedUnion(entity, discriminator);
    if (diagnostics.length > 0) {
      context.program.reportDiagnostics(diagnostics);
      return;
    }
  }
  context.program.stateMap(discriminatorKey).set(entity, discriminator);
}

export function getDiscriminator(program: Program, entity: Type): Discriminator | undefined {
  return program.stateMap(discriminatorKey).get(entity);
}

export function getDiscriminatedTypes(program: Program): [Model | Union, Discriminator][] {
  return [...program.stateMap(discriminatorKey).entries()] as any;
}

const parameterVisibilityKey = createStateSymbol("parameterVisibility");

export function $parameterVisibility(
  context: DecoratorContext,
  entity: Operation,
  ...visibilities: string[]
) {
  validateDecoratorUniqueOnNode(context, entity, $parameterVisibility);
  context.program.stateMap(parameterVisibilityKey).set(entity, visibilities);
}

/**
 * Returns the visibilities of the parameters of the given operation, if provided with `@parameterVisibility`.
 *
 * @see {@link $parameterVisibility}
 */
export function getParameterVisibility(program: Program, entity: Operation): string[] | undefined {
  return program.stateMap(parameterVisibilityKey).get(entity);
}

const returnTypeVisibilityKey = createStateSymbol("returnTypeVisibility");

export function $returnTypeVisibility(
  context: DecoratorContext,
  entity: Operation,
  ...visibilities: string[]
) {
  validateDecoratorUniqueOnNode(context, entity, $returnTypeVisibility);
  context.program.stateMap(returnTypeVisibilityKey).set(entity, visibilities);
}

/**
 * Returns the visibilities of the return type of the given operation, if provided with `@returnTypeVisibility`.
 *
 * @see {@link $returnTypeVisibility}
 */
export function getReturnTypeVisibility(program: Program, entity: Operation): string[] | undefined {
  return program.stateMap(returnTypeVisibilityKey).get(entity);
}

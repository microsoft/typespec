import type {
  DiscriminatedDecorator,
  DiscriminatedOptions,
  DiscriminatorDecorator,
  DocDecorator,
  EncodeDecorator,
  ErrorDecorator,
  ErrorsDocDecorator,
  ExampleDecorator,
  ExampleOptions,
  FormatDecorator,
  FriendlyNameDecorator,
  InspectTypeDecorator,
  InspectTypeNameDecorator,
  KeyDecorator,
  MaxItemsDecorator,
  MaxLengthDecorator,
  MaxValueDecorator,
  MaxValueExclusiveDecorator,
  MediaTypeHintDecorator,
  MinItemsDecorator,
  MinLengthDecorator,
  MinValueDecorator,
  MinValueExclusiveDecorator,
  OpExampleDecorator,
  OverloadDecorator,
  PatternDecorator,
  ReturnsDocDecorator,
  SecretDecorator,
  SummaryDecorator,
  TagDecorator,
  WithOptionalPropertiesDecorator,
  WithPickedPropertiesDecorator,
  WithoutDefaultValuesDecorator,
  WithoutOmittedPropertiesDecorator,
} from "../../generated-defs/TypeSpec.js";
import {
  getPropertyType,
  validateDecoratorNotOnType,
  validateDecoratorUniqueOnNode,
} from "../core/decorator-utils.js";
import { getDeprecationDetails } from "../core/deprecation.js";
import { compilerAssert, ignoreDiagnostics } from "../core/diagnostics.js";
import { getDiscriminatedUnion } from "../core/helpers/discriminator-utils.js";
import { getTypeName } from "../core/helpers/type-name-utils.js";
import {
  DocData,
  getDocDataInternal,
  getMaxItemsAsNumeric,
  getMaxLengthAsNumeric,
  getMaxValueAsNumeric,
  getMaxValueExclusiveAsNumeric,
  getMinItemsAsNumeric,
  getMinLengthAsNumeric,
  getMinValueAsNumeric,
  getMinValueExclusiveAsNumeric,
  setDiscriminatedOptions,
  setDiscriminator,
  setDocData,
  setMaxItems,
  setMaxLength,
  setMaxValue,
  setMaxValueExclusive,
  setMinItems,
  setMinLength,
  setMinValue,
  setMinValueExclusive,
} from "../core/intrinsic-type-state.js";
import { reportDiagnostic } from "../core/messages.js";
import { parseMimeType } from "../core/mime-type.js";
import { Numeric } from "../core/numeric.js";
import { Program } from "../core/program.js";
import { isArrayModelType, isValue } from "../core/type-utils.js";
import {
  AugmentDecoratorStatementNode,
  DecoratorContext,
  DecoratorExpressionNode,
  DiagnosticTarget,
  Enum,
  EnumValue,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Node,
  ObjectValue,
  Operation,
  Scalar,
  StdTypeName,
  SyntaxKind,
  Type,
  Union,
  UnionVariant,
  Value,
} from "../core/types.js";
import { Realm } from "../experimental/realm.js";
import { useStateMap, useStateSet } from "../utils/index.js";
import { setKey } from "./key.js";
import { createStateSymbol, filterModelPropertiesInPlace } from "./utils.js";

export { $encodedName, resolveEncodedName } from "./encoded-names.js";
export { serializeValueAsJson } from "./examples.js";
export { getPagingOperation, isList, type PagingOperation, type PagingProperty } from "./paging.js";
export * from "./service.js";
export * from "./visibility.js";
export { ExampleOptions };

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

const [getSummary, setSummary] = useStateMap<Type, string>(createStateSymbol("summary"));
/**
 * @summary attaches a documentation string. It is typically used to give a short, single-line
 * description, and can be used in combination with or instead of @doc.
 *
 * The first argument to @summary is a string, which may contain template parameters, enclosed in braces,
 * which are replaced with an attribute for the type (commonly "name") passed as the second (optional) argument.
 *
 * @summary can be specified on any language element -- a model, an operation, a namespace, etc.
 */
export const $summary: SummaryDecorator = (
  context: DecoratorContext,
  target: Type,
  text: string,
  sourceObject?: Type,
) => {
  if (sourceObject) {
    text = replaceTemplatedStringFromProperties(text, sourceObject);
  }

  setSummary(context.program, target, text);
};

export { getSummary };

/**
 * @doc attaches a documentation string. Works great with multi-line string literals.
 *
 * The first argument to @doc is a string, which may contain template parameters, enclosed in braces,
 * which are replaced with an attribute for the type (commonly "name") passed as the second (optional) argument.
 *
 * @doc can be specified on any language element -- a model, an operation, a namespace, etc.
 */
export const $doc: DocDecorator = (
  context: DecoratorContext,
  target: Type,
  text: string,
  sourceObject?: Type,
) => {
  validateDecoratorUniqueOnNode(context, target, $doc);
  if (sourceObject) {
    text = replaceTemplatedStringFromProperties(text, sourceObject);
  }
  setDocData(context.program, target, "self", { value: text, source: "decorator" });
};

/**
 * Get the documentation string for the given type.
 * @param program Program
 * @param target Type
 * @returns Documentation value
 */
export function getDoc(program: Program, target: Type): string | undefined {
  return getDocDataInternal(program, target, "self")?.value;
}

export const $returnsDoc: ReturnsDocDecorator = (
  context: DecoratorContext,
  target: Operation,
  text: string,
) => {
  validateDecoratorUniqueOnNode(context, target, $doc);
  setDocData(context.program, target, "returns", { value: text, source: "decorator" });
};

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

export const $errorsDoc: ErrorsDocDecorator = (
  context: DecoratorContext,
  target: Operation,
  text: string,
) => {
  validateDecoratorUniqueOnNode(context, target, $doc);
  setDocData(context.program, target, "errors", { value: text, source: "decorator" });
};

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

export const $inspectType: InspectTypeDecorator = (context, target: Type, text: string) => {
  // eslint-disable-next-line no-console
  if (text) console.log(text);
  // eslint-disable-next-line no-console
  console.dir(target, { depth: 3 });
};

export const $inspectTypeName: InspectTypeNameDecorator = (context, target: Type, text: string) => {
  // eslint-disable-next-line no-console
  if (text) console.log(text);
  // eslint-disable-next-line no-console
  console.log(getTypeName(target));
};

export function isStringType(program: Program, target: Type): target is Scalar {
  const stringType = program.checker.getStdType("string");
  return (
    target.kind === "Scalar" && program.checker.isTypeAssignableTo(target, stringType, target)[0]
  );
}

export function isNumericType(program: Program, target: Type): target is Scalar {
  const numericType = program.checker.getStdType("numeric");
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
  decoratorName: string,
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
  decoratorName: string,
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

// -- @error decorator ----------------------

const [getErrorState, setErrorState] = useStateSet<Model>(createStateSymbol("error"));
/**
 * `@error` decorator marks a model as an error type.
 *  Any derived models (using extends) will also be seen as error types.
 */
export const $error: ErrorDecorator = (context: DecoratorContext, entity: Model) => {
  validateDecoratorUniqueOnNode(context, entity, $error);
  setErrorState(context.program, entity);
};

/**
 * Check if the type is an error model or a descendant of an error model.
 */
export function isErrorModel(program: Program, target: Type): boolean {
  if (target.kind !== "Model") {
    return false;
  }
  let current: Model | undefined = target;
  while (current) {
    if (getErrorState(program, current)) {
      return true;
    }
    current = current.baseModel;
  }
  return false;
}

// -- @mediaTypeHint decorator --------------

const [_getMediaTypeHint, setMediaTypeHint] = useStateMap<MediaTypeHintable, string>(
  createStateSymbol("mediaTypeHint"),
);

/**
 * A type that can have a default MIME type.
 */
type MediaTypeHintable = Parameters<MediaTypeHintDecorator>[1];

export const $mediaTypeHint: MediaTypeHintDecorator = (
  context: DecoratorContext,
  target: MediaTypeHintable,
  mediaType: string,
) => {
  validateDecoratorUniqueOnNode(context, target, $mediaTypeHint);

  const mimeTypeObj = parseMimeType(mediaType);

  if (mimeTypeObj === undefined) {
    reportDiagnostic(context.program, {
      code: "invalid-mime-type",
      format: { mimeType: mediaType },
      target: context.getArgumentTarget(0)!,
    });
  } else if (mimeTypeObj.suffix) {
    reportDiagnostic(context.program, {
      code: "no-mime-type-suffix",
      format: { mimeType: mediaType, suffix: mimeTypeObj.suffix },
      target: context.getArgumentTarget(0)!,
    });
  }

  setMediaTypeHint(context.program, target, mediaType);
};

/**
 * Get the default media type hint for the given target type.
 *
 * This value is a hint _ONLY_. Emitters are not required to use it, but may use it to get the default media type
 * associated with a TypeSpec type.
 *
 * @param program - the Program containing the target
 * @param target - the target to get the MIME type for
 * @returns the default media type hint for the target, if any
 */
export function getMediaTypeHint(program: Program, target: Type): string | undefined {
  switch (target.kind) {
    case "Scalar":
      // This special-casing is necessary because we cannot apply a decorator with a `valueof string` argument to
      // `string` itself. It creates a circular dependency in the checker where initializing the decorator value depends
      // on `string` already being initialized, which it isn't if we're still checking its decorators. This simple
      // special-casing allows us to avoid that circularity or having to special-case the initialization of string
      // itself.

      const isTypeSpecString =
        target.name === "string" &&
        target.namespace?.name === "TypeSpec" &&
        target.namespace.namespace === program.getGlobalNamespaceType();

      if (isTypeSpecString) return "text/plain";
    // Intentional fallthrough
    // eslint-disable-next-line no-fallthrough
    case "Union":
    case "Enum":
    case "Model": {
      // Assert this satisfies clause to make sure we've handled everything that is MimeTypeable
      void 0 as unknown as MediaTypeHintable["kind"] satisfies typeof target.kind;

      const hint = _getMediaTypeHint(program, target);

      if (!hint) {
        // Look up the hierarchy for a MIME type hint if we don't have one on this type.
        const ancestor =
          target.kind === "Model"
            ? target.baseModel
            : target.kind === "Scalar"
              ? target.baseScalar
              : undefined;

        if (ancestor) {
          return getMediaTypeHint(program, ancestor);
        }
      }

      return hint;
    }
    default:
      return undefined;
  }
}

// -- @format decorator ---------------------

const [getFormat, setFormat] = useStateMap<Type, string>(createStateSymbol("format"));

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
export const $format: FormatDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  format: string,
) => {
  validateDecoratorUniqueOnNode(context, target, $format);

  if (!validateTargetingAString(context, target, "@format")) {
    return;
  }
  setFormat(context.program, target, format);
};

export { getFormat };

// -- @pattern decorator ---------------------
const [getPatternData, setPatternData] = useStateMap<Type, PatternData>(
  createStateSymbol("patternValues"),
);

export interface PatternData {
  readonly pattern: string;
  readonly validationMessage?: string;
}

export const $pattern: PatternDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  pattern: string,
  validationMessage?: string,
) => {
  validateDecoratorUniqueOnNode(context, target, $pattern);

  if (!validateTargetingAString(context, target, "@pattern")) {
    return;
  }

  try {
    new RegExp(pattern);
  } catch (e) {
    reportDiagnostic(context.program, {
      code: "invalid-pattern-regex",
      target: target,
    });
  }
  const patternData: PatternData = {
    pattern,
    validationMessage,
  };

  setPatternData(context.program, target, patternData);
};

/**
 * Gets the pattern regular expression associated with a given type, if one has been set.
 *
 * @see getPatternData
 *
 * @param program - the Program containing the target Type
 * @param target - the type to get the pattern for
 * @returns the pattern string, if one was set
 */
export function getPattern(program: Program, target: Type): string | undefined {
  return getPatternData(program, target)?.pattern;
}

export {
  /**
   * Gets the associated pattern data, including the pattern regular expression and optional validation message, if any
   * has been set.
   *
   * @param program - the Program containing the target Type
   * @param target - the type to get the pattern data for
   * @returns the pattern data, if any was set
   */
  getPatternData,
};

// -- @minLength decorator ---------------------

export const $minLength: MinLengthDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  minLength: Numeric,
) => {
  validateDecoratorUniqueOnNode(context, target, $minLength);

  if (
    !validateTargetingAString(context, target, "@minLength") ||
    !validateRange(context, minLength, getMaxLengthAsNumeric(context.program, target))
  ) {
    return;
  }
  setMinLength(context.program, target, minLength);
};

// -- @maxLength decorator ---------------------

export const $maxLength: MaxLengthDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  maxLength: Numeric,
) => {
  validateDecoratorUniqueOnNode(context, target, $maxLength);

  if (
    !validateTargetingAString(context, target, "@maxLength") ||
    !validateRange(context, getMinLengthAsNumeric(context.program, target), maxLength)
  ) {
    return;
  }

  setMaxLength(context.program, target, maxLength);
};

// -- @minItems decorator ---------------------

export const $minItems: MinItemsDecorator = (
  context: DecoratorContext,
  target: Type,
  minItems: Numeric,
) => {
  validateDecoratorUniqueOnNode(context, target, $minItems);

  if (!isArrayModelType(context.program, target.kind === "Model" ? target : (target as any).type)) {
    reportDiagnostic(context.program, {
      code: "decorator-wrong-target",
      format: {
        decorator: "@minItems",
        to: `non Array type`,
      },
      target: context.decoratorTarget,
    });
  }

  if (!validateRange(context, minItems, getMaxItemsAsNumeric(context.program, target))) {
    return;
  }

  setMinItems(context.program, target, minItems);
};

// -- @maxLength decorator ---------------------

export const $maxItems: MaxItemsDecorator = (
  context: DecoratorContext,
  target: Type,
  maxItems: Numeric,
) => {
  validateDecoratorUniqueOnNode(context, target, $maxItems);

  if (!isArrayModelType(context.program, target.kind === "Model" ? target : (target as any).type)) {
    reportDiagnostic(context.program, {
      code: "decorator-wrong-target",
      format: {
        decorator: "@maxItems",
        to: `non Array type`,
      },
      target: context.decoratorTarget,
    });
  }
  if (!validateRange(context, getMinItemsAsNumeric(context.program, target), maxItems)) {
    return;
  }

  setMaxItems(context.program, target, maxItems);
};

// -- @minValue decorator ---------------------

export const $minValue: MinValueDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  minValue: Numeric,
) => {
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
      getMaxValueAsNumeric(context.program, target) ??
        getMaxValueExclusiveAsNumeric(context.program, target),
    )
  ) {
    return;
  }
  setMinValue(program, target, minValue);
};

// -- @maxValue decorator ---------------------

export const $maxValue: MaxValueDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  maxValue: Numeric,
) => {
  validateDecoratorUniqueOnNode(context, target, $maxValue);
  validateDecoratorNotOnType(context, target, $maxValueExclusive, $maxValue);
  const { program } = context;
  if (!validateTargetingANumeric(context, target, "@maxValue")) {
    return;
  }

  if (
    !validateRange(
      context,
      getMinValueAsNumeric(context.program, target) ??
        getMinValueExclusiveAsNumeric(context.program, target),
      maxValue,
    )
  ) {
    return;
  }
  setMaxValue(program, target, maxValue);
};

// -- @minValueExclusive decorator ---------------------

export const $minValueExclusive: MinValueExclusiveDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  minValueExclusive: Numeric,
) => {
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
      getMaxValueAsNumeric(context.program, target) ??
        getMaxValueExclusiveAsNumeric(context.program, target),
    )
  ) {
    return;
  }
  setMinValueExclusive(program, target, minValueExclusive);
};

// -- @maxValueExclusive decorator ---------------------

export const $maxValueExclusive: MaxValueExclusiveDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  maxValueExclusive: Numeric,
) => {
  validateDecoratorUniqueOnNode(context, target, $maxValueExclusive);
  validateDecoratorNotOnType(context, target, $maxValue, $maxValueExclusive);
  const { program } = context;
  if (!validateTargetingANumeric(context, target, "@maxValueExclusive")) {
    return;
  }

  if (
    !validateRange(
      context,
      getMinValueAsNumeric(context.program, target) ??
        getMinValueExclusiveAsNumeric(context.program, target),
      maxValueExclusive,
    )
  ) {
    return;
  }
  setMaxValueExclusive(program, target, maxValueExclusive);
};
// -- @secret decorator ---------------------

const [isSecret, markSecret] = useStateSet(createStateSymbol("secretTypes"));

/**
 * Mark a string as a secret value that should be treated carefully to avoid exposure
 * @param context Decorator context
 * @param target Decorator target, either a string model or a property with type string.
 */
export const $secret: SecretDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
) => {
  validateDecoratorUniqueOnNode(context, target, $secret);

  if (!validateTargetingAString(context, target, "@secret")) {
    return;
  }
  markSecret(context.program, target);
};

export { isSecret };

export type DateTimeKnownEncoding = "rfc3339" | "rfc7231" | "unixTimestamp";
export type DurationKnownEncoding = "ISO8601" | "seconds";
export type BytesKnownEncoding = "base64" | "base64url";

export interface EncodeData {
  /**
   * Known encoding key.
   * Can be undefined when `@encode(string)` is used on a numeric type. In that case it just means using the base10 decimal representation of the number.
   */
  encoding?: DateTimeKnownEncoding | DurationKnownEncoding | BytesKnownEncoding | string;
  type: Scalar;
}

const [getEncode, setEncodeData] = useStateMap<Scalar | ModelProperty, EncodeData>(
  createStateSymbol("encode"),
);
export const $encode: EncodeDecorator = (
  context: DecoratorContext,
  target: Scalar | ModelProperty,
  encoding: string | EnumValue | Scalar,
  encodeAs?: Scalar,
) => {
  validateDecoratorUniqueOnNode(context, target, $encode);

  const encodeData = computeEncoding(context.program, encoding, encodeAs);
  if (encodeData === undefined) {
    return;
  }
  const targetType = getPropertyType(target);
  validateEncodeData(context, targetType, encodeData);
  setEncodeData(context.program, target, encodeData);
};

function computeEncoding(
  program: Program,
  encodingOrEncodeAs: string | EnumValue | Scalar,
  encodeAs: Scalar | undefined,
): EncodeData | undefined {
  const strType = program.checker.getStdType("string");
  const resolvedEncodeAs = encodeAs ?? strType;
  if (typeof encodingOrEncodeAs === "string") {
    return { encoding: encodingOrEncodeAs, type: resolvedEncodeAs };
  } else if (isValue(encodingOrEncodeAs)) {
    const member = encodingOrEncodeAs.value;
    if (member.value && typeof member.value === "string") {
      return { encoding: member.value, type: resolvedEncodeAs };
    } else {
      return { encoding: getTypeName(member), type: resolvedEncodeAs };
    }
  } else {
    const originalType = encodingOrEncodeAs;
    if (originalType !== strType) {
      reportDiagnostic(program, {
        code: "invalid-encode",
        messageId: "firstArg",
        target: encodingOrEncodeAs,
      });
      return undefined;
    }

    return { type: encodingOrEncodeAs };
  }
}

function validateEncodeData(context: DecoratorContext, target: Type, encodeData: EncodeData) {
  function check(validTargets: StdTypeName[], validEncodeTypes: StdTypeName[]) {
    const checker = context.program.checker;
    const isTargetValid = isTypeIn(target, (type) =>
      validTargets.some((validTarget) => {
        return ignoreDiagnostics(
          checker.isTypeAssignableTo(type, checker.getStdType(validTarget), target),
        );
      }),
    );

    if (!isTargetValid) {
      reportDiagnostic(context.program, {
        code: "invalid-encode",
        messageId: "wrongType",
        format: {
          encoding: encodeData.encoding ?? "string",
          type: getTypeName(target),
          expected: validTargets.join(", "),
        },
        target: context.decoratorTarget,
      });
    }
    const isEncodingTypeValid = validEncodeTypes.some((validEncoding) => {
      return ignoreDiagnostics(
        checker.isTypeAssignableTo(encodeData.type, checker.getStdType(validEncoding), target),
      );
    });

    if (!isEncodingTypeValid) {
      const typeName = getTypeName(encodeData.type);
      reportDiagnostic(context.program, {
        code: "invalid-encode",
        messageId: ["unixTimestamp", "seconds"].includes(encodeData.encoding ?? "string")
          ? "wrongNumericEncodingType"
          : "wrongEncodingType",
        format: {
          encoding: encodeData.encoding!,
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
    case undefined:
      return check(["numeric"], ["string"]);
  }
}

export { getEncode };

// -- @withOptionalProperties decorator ---------------------

export const $withOptionalProperties: WithOptionalPropertiesDecorator = (
  context: DecoratorContext,
  target: Model,
) => {
  // Make all properties of the target type optional
  target.properties.forEach((p) => (p.optional = true));
};

// -- @withoutOmittedProperties decorator ----------------------

export const $withoutOmittedProperties: WithoutOmittedPropertiesDecorator = (
  context: DecoratorContext,
  target: Model,
  omitProperties: Type,
) => {
  // Get the property or properties to omit
  const omitNames = new Set<string>();
  if (omitProperties.kind === "String") {
    omitNames.add(omitProperties.value);
  } else if (omitProperties.kind === "Union") {
    for (const variant of omitProperties.variants.values()) {
      if (variant.type.kind === "String") {
        omitNames.add(variant.type.value);
      }
    }
  }

  // Remove all properties to be omitted
  filterModelPropertiesInPlace(target, (prop) => !omitNames.has(prop.name));
};

// -- @withPickedProperties decorator ----------------------

export const $withPickedProperties: WithPickedPropertiesDecorator = (
  context: DecoratorContext,
  target: Model,
  pickedProperties: Type,
) => {
  // Get the property or properties to pick
  const pickedNames = new Set<string>();
  if (pickedProperties.kind === "String") {
    pickedNames.add(pickedProperties.value);
  } else if (pickedProperties.kind === "Union") {
    for (const variant of pickedProperties.variants.values()) {
      if (variant.type.kind === "String") {
        pickedNames.add(variant.type.value);
      }
    }
  }

  // Remove all properties not picked
  filterModelPropertiesInPlace(target, (prop) => pickedNames.has(prop.name));
};

// -- @withoutDefaultValues decorator ----------------------

export const $withoutDefaultValues: WithoutDefaultValuesDecorator = (
  context: DecoratorContext,
  target: Model,
) => {
  // remove all read-only properties from the target type
  target.properties.forEach((p) => {
    delete p.defaultValue;
  });
};

// -- @tag decorator ---------------------

const [getTagsState, setTags] = useStateMap<Type, string[]>(createStateSymbol("tagProperties"));

// Set a tag on an operation, interface, or namespace.  There can be multiple tags on an
// operation, interface, or namespace.
export const $tag: TagDecorator = (
  context: DecoratorContext,
  target: Operation | Namespace | Interface,
  tag: string,
) => {
  const tags = getTagsState(context.program, target);
  if (tags) {
    tags.push(tag);
  } else {
    setTags(context.program, target, [tag]);
  }
};

// Return the tags set on an operation or namespace
export function getTags(program: Program, target: Type): string[] {
  return getTagsState(program, target) || [];
}

// Merge the tags for a operation with the tags that are on the namespace or
// interface it resides within.
export function getAllTags(
  program: Program,
  target: Namespace | Interface | Operation,
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

const [getFriendlyName, setFriendlyName] = useStateMap<Type, string>(
  createStateSymbol("friendlyNames"),
);
export const $friendlyName: FriendlyNameDecorator = (
  context: DecoratorContext,
  target: Type,
  friendlyName: string,
  sourceObject: Type | undefined,
) => {
  // workaround for current lack of functionality in compiler
  // https://github.com/microsoft/typespec/issues/2717
  if (target.kind === "Model" || target.kind === "Operation") {
    if ((context.decoratorTarget as Node).kind === SyntaxKind.AugmentDecoratorStatement) {
      if (
        ignoreDiagnostics(
          context.program.checker.resolveTypeReference(
            (context.decoratorTarget as AugmentDecoratorStatementNode).targetType,
          ),
        )?.node !== target.node
      ) {
        return;
      }
    }
    if ((context.decoratorTarget as Node).kind === SyntaxKind.DecoratorExpression) {
      if ((context.decoratorTarget as DecoratorExpressionNode).parent !== target.node) {
        return;
      }
    }
  }

  // If an object was passed in, use it to format the friendly name
  if (sourceObject) {
    friendlyName = replaceTemplatedStringFromProperties(friendlyName, sourceObject);
  }

  setFriendlyName(context.program, target, friendlyName);
};

export { getFriendlyName };

/**
 * `@key` - mark a model property as the key to identify instances of that type
 *
 * The optional first argument accepts an alternate key name which may be used by emitters.
 * Otherwise, the name of the target property will be used.
 *
 * `@key` can only be applied to model properties.
 */
export const $key: KeyDecorator = (
  context: DecoratorContext,
  entity: ModelProperty,
  altName?: string,
) => {
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
  setKey(context.program, entity, altName || entity.name);
};

export { getKeyName, isKey } from "./key.js";

/**
 * Return the deprecated message or undefined if not deprecated
 * @param program Program
 * @param type Type
 */
export function getDeprecated(program: Program, type: Type): string | undefined {
  return getDeprecationDetails(program, type)?.message;
}

const [getOverloads, setOverloads] = useStateMap<Operation, Operation[]>(
  createStateSymbol("overloadedByKey"),
);
const [getOverloadedOperation, setOverloadBase] = useStateMap<Operation, Operation>(
  createStateSymbol("overloadsOperation"),
);

/**
 * `@overload` - Indicate that the target overloads (specializes) the overloads type.
 * @param context DecoratorContext
 * @param target The specializing operation declaration
 * @param overloadBase The operation to be overloaded.
 */
export const $overload: OverloadDecorator = (
  context: DecoratorContext,
  target: Operation,
  overloadBase: Operation,
) => {
  // Ensure that the overloaded method arguments are a subtype of the original operation.
  const [paramValid, paramDiagnostics] = context.program.checker.isTypeAssignableTo(
    target.parameters,
    overloadBase.parameters,
    target,
  );
  if (!paramValid) context.program.reportDiagnostics(paramDiagnostics);

  const [returnTypeValid, returnTypeDiagnostics] = context.program.checker.isTypeAssignableTo(
    target.returnType,
    overloadBase.returnType,
    target,
  );
  if (!returnTypeValid) context.program.reportDiagnostics(returnTypeDiagnostics);

  if (!areOperationsInSameContainer(target, overloadBase)) {
    reportDiagnostic(context.program, {
      code: "overload-same-parent",
      target: context.decoratorTarget,
    });
  }
  // Save the information about the overloaded operation

  setOverloadBase(context.program, target, overloadBase);
  const existingOverloads = getOverloads(context.program, overloadBase) || new Array<Operation>();
  setOverloads(context.program, overloadBase, existingOverloads.concat(target));
};

function areOperationsInSameContainer(op1: Operation, op2: Operation): boolean {
  return op1.interface || op2.interface
    ? op1.interface === op2.interface
    : op1.namespace === op2.namespace;
}

export {
  /**
   * If the given operation overloads another operation, return that operation.
   * @param program Program
   * @param operation The operation to check for an overload target.
   * @returns The operation this operation overloads, if any.
   */
  getOverloadedOperation,

  /**
   * Get all operations that are marked as overloads of the given operation
   * @param program Program
   * @param operation Operation
   * @returns An array of operations that overload the given operation.
   */
  getOverloads,
};

function validateRange(
  context: DecoratorContext,
  min: Numeric | undefined,
  max: Numeric | undefined,
): boolean {
  if (min === undefined || max === undefined) {
    return true;
  }
  if (min.gt(max)) {
    reportDiagnostic(context.program, {
      code: "invalid-range",
      format: { start: min.toString(), end: max.toString() },
      target: context.decoratorTarget,
    });
    return false;
  }
  return true;
}

export const discriminatedDecorator: DiscriminatedDecorator = (
  context: DecoratorContext,
  entity: Union,
  options: DiscriminatedOptions = {},
) => {
  setDiscriminatedOptions(context.program, entity, {
    envelope: "object",
    discriminatorPropertyName: "kind",
    envelopePropertyName: "value",
    ...options,
  });

  const [_, diagnostics] = getDiscriminatedUnion(context.program, entity);
  context.program.reportDiagnostics(diagnostics);
};

export const $discriminator: DiscriminatorDecorator = (
  context: DecoratorContext,
  entity: Model,
  propertyName: string,
) => {
  setDiscriminator(context.program, entity, { propertyName });
};

export interface Example extends ExampleOptions {
  readonly value: Value;
}
export interface OpExample extends ExampleOptions {
  readonly parameters?: Value;
  readonly returnType?: Value;
}

const [getExamplesState, setExamples] = useStateMap<
  Model | Scalar | Enum | Union | ModelProperty | UnionVariant,
  Example[]
>(createStateSymbol("examples"));
export const $example: ExampleDecorator = (
  context: DecoratorContext,
  target: Model | Scalar | Enum | Union | ModelProperty | UnionVariant,
  _example: unknown,
  options?: ExampleOptions,
) => {
  const decorator = target.decorators.find(
    (d) => d.decorator === $example && d.node === context.decoratorTarget,
  );
  compilerAssert(decorator, `Couldn't find @example decorator`, context.decoratorTarget);
  const rawExample = decorator.args[0].value as Value;
  // skip validation in cloned types
  if (Realm.realmForType.get(target) === undefined) {
    if (
      !checkExampleValid(
        context.program,
        rawExample,
        target.kind === "ModelProperty" ? target.type : target,
        context.getArgumentTarget(0)!,
      )
    ) {
      return;
    }
  }

  let list = getExamplesState(context.program, target);
  if (list === undefined) {
    list = [];
    setExamples(context.program, target, list);
  }
  list.push({ value: rawExample, ...options });
};

export function getExamples(
  program: Program,
  target: Model | Scalar | Enum | Union | ModelProperty,
): readonly Example[] {
  return getExamplesState(program, target) ?? [];
}

const [getOpExamplesState, setOpExamples] = useStateMap<Operation, OpExample[]>(
  createStateSymbol("opExamples"),
);
export const $opExample: OpExampleDecorator = (
  context: DecoratorContext,
  target: Operation,
  _example: unknown,
  options?: unknown, // TODO: change `options?: ExampleOptions` when tspd supports it
) => {
  const decorator = target.decorators.find(
    (d) => d.decorator === $opExample && d.node === context.decoratorTarget,
  );
  compilerAssert(decorator, `Couldn't find @opExample decorator`, context.decoratorTarget);
  const rawExampleConfig = decorator.args[0].value as ObjectValue;
  const parameters = rawExampleConfig.properties.get("parameters")?.value;
  const returnType = rawExampleConfig.properties.get("returnType")?.value;

  // skip validation in cloned types
  if (Realm.realmForType.get(target) === undefined) {
    if (
      parameters &&
      !checkExampleValid(
        context.program,
        parameters,
        target.parameters,
        context.getArgumentTarget(0)!,
      )
    ) {
      return;
    }
    if (
      returnType &&
      !checkExampleValid(
        context.program,
        returnType,
        target.returnType,
        context.getArgumentTarget(0)!,
      )
    ) {
      return;
    }
  }

  let list = getOpExamplesState(context.program, target);
  if (list === undefined) {
    list = [];
    setOpExamples(context.program, target, list);
  }
  list.push({ parameters, returnType, ...(options as any) });
};

function checkExampleValid(
  program: Program,
  value: Value,
  target: Type,
  diagnosticTarget: DiagnosticTarget,
): boolean {
  const exactType = program.checker.getValueExactType(value);
  const [assignable, diagnostics] = program.checker.isTypeAssignableTo(
    exactType ?? value.type,
    target,
    diagnosticTarget,
  );
  if (!assignable) {
    program.reportDiagnostics(diagnostics);
  }
  return assignable;
}

export function getOpExamples(program: Program, target: Operation): OpExample[] {
  return getOpExamplesState(program, target) ?? [];
}

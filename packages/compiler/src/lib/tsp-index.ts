import { TypeSpecDecorators } from "../../generated-defs/TypeSpec.js";
import {
  $deprecated,
  $discriminator,
  $doc,
  $encode,
  $encodedName,
  $error,
  $errorsDoc,
  $example,
  $format,
  $friendlyName,
  $inspectType,
  $inspectTypeName,
  $key,
  $knownValues,
  $list,
  $maxItems,
  $maxLength,
  $maxValue,
  $maxValueExclusive,
  $minItems,
  $minLength,
  $minValue,
  $minValueExclusive,
  $opExample,
  $overload,
  $pattern,
  $projectedName,
  $returnsDoc,
  $secret,
  $service,
  $summary,
  $tag,
  $withOptionalProperties,
  $withPickedProperties,
  $withoutDefaultValues,
  $withoutOmittedProperties,
} from "./decorators.js";
import {
  $invisible,
  $parameterVisibility,
  $returnTypeVisibility,
  $visibility,
  $withDefaultKeyVisibility,
  $withUpdateableProperties,
  $withVisibility,
} from "./visibility.js";

/** @internal */
export const $decorators = {
  TypeSpec: {
    encode: $encode,
    doc: $doc,
    withOptionalProperties: $withOptionalProperties,
    withUpdateableProperties: $withUpdateableProperties,
    withoutOmittedProperties: $withoutOmittedProperties,
    withPickedProperties: $withPickedProperties,
    withoutDefaultValues: $withoutDefaultValues,
    summary: $summary,
    returnsDoc: $returnsDoc,
    errorsDoc: $errorsDoc,
    deprecated: $deprecated,
    service: $service,
    error: $error,
    format: $format,
    pattern: $pattern,
    minLength: $minLength,
    maxLength: $maxLength,
    minItems: $minItems,
    maxItems: $maxItems,
    minValue: $minValue,
    maxValue: $maxValue,
    minValueExclusive: $minValueExclusive,
    maxValueExclusive: $maxValueExclusive,
    secret: $secret,
    // eslint-disable-next-line deprecation/deprecation
    list: $list,
    tag: $tag,
    friendlyName: $friendlyName,
    knownValues: $knownValues,
    key: $key,
    overload: $overload,
    projectedName: $projectedName,
    encodedName: $encodedName,
    discriminator: $discriminator,
    example: $example,
    opExample: $opExample,
    inspectType: $inspectType,
    inspectTypeName: $inspectTypeName,
    visibility: $visibility,
    invisible: $invisible,
    withVisibility: $withVisibility,
    withDefaultKeyVisibility: $withDefaultKeyVisibility,
    parameterVisibility: $parameterVisibility,
    returnTypeVisibility: $returnTypeVisibility,
  } satisfies TypeSpecDecorators,
};

// Projection function exports
export const namespace = "TypeSpec";
export { getProjectedName, hasProjectedName } from "./decorators.js";

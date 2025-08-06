import { TypeSpecDecorators } from "../../generated-defs/TypeSpec.js";
import { Program } from "../core/program.js";
import { Type, TypeMapper } from "../core/types.js";
import { $ } from "../typekit/index.js";
import {
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
  $maxItems,
  $maxLength,
  $maxValue,
  $maxValueExclusive,
  $mediaTypeHint,
  $minItems,
  $minLength,
  $minValue,
  $minValueExclusive,
  $opExample,
  $overload,
  $pattern,
  $returnsDoc,
  $secret,
  $service,
  $summary,
  $tag,
  $withOptionalProperties,
  $withPickedProperties,
  $withoutDefaultValues,
  $withoutOmittedProperties,
  discriminatedDecorator,
} from "./decorators.js";
import {
  continuationTokenDecorator,
  firstLinkDecorator,
  lastLinkDecorator,
  listDecorator,
  nextLinkDecorator,
  offsetDecorator,
  pageIndexDecorator,
  pageItemsDecorator,
  pageSizeDecorator,
  prevLinkDecorator,
} from "./paging.js";
import {
  $defaultVisibility,
  $invisible,
  $parameterVisibility,
  $removeVisibility,
  $returnTypeVisibility,
  $visibility,
  $withDefaultKeyVisibility,
  $withLifecycleUpdate,
  $withUpdateableProperties,
  $withVisibility,
  $withVisibilityFilter,
} from "./visibility.js";

/** @internal */
export const $decorators = {
  TypeSpec: {
    encode: $encode,
    mediaTypeHint: $mediaTypeHint,
    doc: $doc,
    withOptionalProperties: $withOptionalProperties,
    withUpdateableProperties: $withUpdateableProperties,
    withoutOmittedProperties: $withoutOmittedProperties,
    withPickedProperties: $withPickedProperties,
    withoutDefaultValues: $withoutDefaultValues,
    summary: $summary,
    returnsDoc: $returnsDoc,
    errorsDoc: $errorsDoc,
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
    tag: $tag,
    friendlyName: $friendlyName,
    key: $key,
    overload: $overload,
    encodedName: $encodedName,
    discriminated: discriminatedDecorator,
    discriminator: $discriminator,
    example: $example,
    opExample: $opExample,
    inspectType: $inspectType,
    inspectTypeName: $inspectTypeName,
    visibility: $visibility,
    removeVisibility: $removeVisibility,
    invisible: $invisible,
    defaultVisibility: $defaultVisibility,
    withVisibility: $withVisibility,
    withVisibilityFilter: $withVisibilityFilter,
    withLifecycleUpdate: $withLifecycleUpdate,
    withDefaultKeyVisibility: $withDefaultKeyVisibility,
    parameterVisibility: $parameterVisibility,
    returnTypeVisibility: $returnTypeVisibility,

    list: listDecorator,
    offset: offsetDecorator,
    pageIndex: pageIndexDecorator,
    pageSize: pageSizeDecorator,
    pageItems: pageItemsDecorator,
    continuationToken: continuationTokenDecorator,
    nextLink: nextLinkDecorator,
    prevLink: prevLinkDecorator,
    firstLink: firstLinkDecorator,
    lastLink: lastLinkDecorator,
  } satisfies TypeSpecDecorators,
};

let COUNTER = 0;

export const $templates = {
  TypeSpec: {
    Example(program: Program, mapper: TypeMapper): Type {
      const argEntity = mapper.args[0];

      if (argEntity.entityKind === "Value") {
        throw new Error("Example template must be used with a type argument.");
      }

      const argType = argEntity.entityKind === "Indeterminate" ? argEntity.type : argEntity;
      return $(program).array.create(
        $(program).tuple.create([$(program).literal.create(COUNTER++), argType]),
      );
    },
  },
};

export const namespace = "TypeSpec";

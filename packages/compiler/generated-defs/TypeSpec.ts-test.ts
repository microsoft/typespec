/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import {
  $deprecated,
  $discriminator,
  $doc,
  $encode,
  $encodedName,
  $error,
  $errorsDoc,
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
  $overload,
  $parameterVisibility,
  $pattern,
  $projectedName,
  $returnTypeVisibility,
  $returnsDoc,
  $secret,
  $service,
  $summary,
  $tag,
  $visibility,
  $withDefaultKeyVisibility,
  $withOptionalProperties,
  $withPickedProperties,
  $withUpdateableProperties,
  $withVisibility,
  $withoutDefaultValues,
  $withoutOmittedProperties,
} from "../src/index.js";
import type {
  DeprecatedDecorator,
  DiscriminatorDecorator,
  DocDecorator,
  EncodeDecorator,
  EncodedNameDecorator,
  ErrorDecorator,
  ErrorsDocDecorator,
  FormatDecorator,
  FriendlyNameDecorator,
  InspectTypeDecorator,
  InspectTypeNameDecorator,
  KeyDecorator,
  KnownValuesDecorator,
  ListDecorator,
  MaxItemsDecorator,
  MaxLengthDecorator,
  MaxValueDecorator,
  MaxValueExclusiveDecorator,
  MinItemsDecorator,
  MinLengthDecorator,
  MinValueDecorator,
  MinValueExclusiveDecorator,
  OverloadDecorator,
  ParameterVisibilityDecorator,
  PatternDecorator,
  ProjectedNameDecorator,
  ReturnTypeVisibilityDecorator,
  ReturnsDocDecorator,
  SecretDecorator,
  ServiceDecorator,
  SummaryDecorator,
  TagDecorator,
  VisibilityDecorator,
  WithDefaultKeyVisibilityDecorator,
  WithOptionalPropertiesDecorator,
  WithPickedPropertiesDecorator,
  WithUpdateablePropertiesDecorator,
  WithVisibilityDecorator,
  WithoutDefaultValuesDecorator,
  WithoutOmittedPropertiesDecorator,
} from "./TypeSpec.js";

type Decorators = {
  $encode: EncodeDecorator;
  $doc: DocDecorator;
  $withOptionalProperties: WithOptionalPropertiesDecorator;
  $withUpdateableProperties: WithUpdateablePropertiesDecorator;
  $withoutOmittedProperties: WithoutOmittedPropertiesDecorator;
  $withPickedProperties: WithPickedPropertiesDecorator;
  $withoutDefaultValues: WithoutDefaultValuesDecorator;
  $withDefaultKeyVisibility: WithDefaultKeyVisibilityDecorator;
  $summary: SummaryDecorator;
  $returnsDoc: ReturnsDocDecorator;
  $errorsDoc: ErrorsDocDecorator;
  $deprecated: DeprecatedDecorator;
  $service: ServiceDecorator;
  $error: ErrorDecorator;
  $format: FormatDecorator;
  $pattern: PatternDecorator;
  $minLength: MinLengthDecorator;
  $maxLength: MaxLengthDecorator;
  $minItems: MinItemsDecorator;
  $maxItems: MaxItemsDecorator;
  $minValue: MinValueDecorator;
  $maxValue: MaxValueDecorator;
  $minValueExclusive: MinValueExclusiveDecorator;
  $maxValueExclusive: MaxValueExclusiveDecorator;
  $secret: SecretDecorator;
  $list: ListDecorator;
  $tag: TagDecorator;
  $friendlyName: FriendlyNameDecorator;
  $knownValues: KnownValuesDecorator;
  $key: KeyDecorator;
  $overload: OverloadDecorator;
  $projectedName: ProjectedNameDecorator;
  $encodedName: EncodedNameDecorator;
  $discriminator: DiscriminatorDecorator;
  $visibility: VisibilityDecorator;
  $withVisibility: WithVisibilityDecorator;
  $inspectType: InspectTypeDecorator;
  $inspectTypeName: InspectTypeNameDecorator;
  $parameterVisibility: ParameterVisibilityDecorator;
  $returnTypeVisibility: ReturnTypeVisibilityDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $encode,
  $doc,
  $withOptionalProperties,
  $withUpdateableProperties,
  $withoutOmittedProperties,
  $withPickedProperties,
  $withoutDefaultValues,
  $withDefaultKeyVisibility,
  $summary,
  $returnsDoc,
  $errorsDoc,
  $deprecated,
  $service,
  $error,
  $format,
  $pattern,
  $minLength,
  $maxLength,
  $minItems,
  $maxItems,
  $minValue,
  $maxValue,
  $minValueExclusive,
  $maxValueExclusive,
  $secret,
  $list,
  $tag,
  $friendlyName,
  $knownValues,
  $key,
  $overload,
  $projectedName,
  $encodedName,
  $discriminator,
  $visibility,
  $withVisibility,
  $inspectType,
  $inspectTypeName,
  $parameterVisibility,
  $returnTypeVisibility,
};

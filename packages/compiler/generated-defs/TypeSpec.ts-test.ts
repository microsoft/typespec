/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import {
  $encode,
  $doc,
  $withOptionalProperties,
  $withUpdateableProperties,
  $withoutOmittedProperties,
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
} from "../src/index.js";
import {
  EncodeDecorator,
  DocDecorator,
  WithOptionalPropertiesDecorator,
  WithUpdateablePropertiesDecorator,
  WithoutOmittedPropertiesDecorator,
  WithoutDefaultValuesDecorator,
  WithDefaultKeyVisibilityDecorator,
  SummaryDecorator,
  ReturnsDocDecorator,
  ErrorsDocDecorator,
  DeprecatedDecorator,
  ServiceDecorator,
  ErrorDecorator,
  FormatDecorator,
  PatternDecorator,
  MinLengthDecorator,
  MaxLengthDecorator,
  MinItemsDecorator,
  MaxItemsDecorator,
  MinValueDecorator,
  MaxValueDecorator,
  MinValueExclusiveDecorator,
  MaxValueExclusiveDecorator,
  SecretDecorator,
  ListDecorator,
  TagDecorator,
  FriendlyNameDecorator,
  KnownValuesDecorator,
  KeyDecorator,
  OverloadDecorator,
  ProjectedNameDecorator,
  EncodedNameDecorator,
  DiscriminatorDecorator,
  VisibilityDecorator,
  WithVisibilityDecorator,
  InspectTypeDecorator,
  InspectTypeNameDecorator,
  ParameterVisibilityDecorator,
  ReturnTypeVisibilityDecorator,
} from "./TypeSpec.js";

type Decorators = {
  $encode: EncodeDecorator;
  $doc: DocDecorator;
  $withOptionalProperties: WithOptionalPropertiesDecorator;
  $withUpdateableProperties: WithUpdateablePropertiesDecorator;
  $withoutOmittedProperties: WithoutOmittedPropertiesDecorator;
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

import { code, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Attribute } from "@alloy-js/csharp";
import { Serialization } from "@alloy-js/csharp/global/System/Text/Json";
import { isErrorModel, type Enum, type Model, type ModelProperty } from "@typespec/compiler";
import type {
  Experimental_OverrideDeclarationComponent,
  Experimental_OverrideDeclareProps,
} from "@typespec/emitter-framework";
import { useTsp } from "@typespec/emitter-framework";
import { isCSharpValueType, type PropertyProps } from "@typespec/emitter-framework/csharp";
import { getUniqueItems } from "@typespec/json-schema";
import { useEmitterOptions } from "../../context/emitter-options-context.js";
import { getPropertyAttributes } from "../../utils/attributes.jsx";
import { TypeExpression } from "../type-expression/type-expression.jsx";
import {
  getDefaultValueString,
  getEnumDefaultInitializer,
  getLiteralValue,
  getModelEmitName,
  getScalarForLiteral,
  getUnionVariantInitializer,
  hasNonIntegerValues,
  hasPropertyInChain,
  isDuplicateExceptionName,
} from "./model-helpers.js";

/**
 * Renders a property the way the pre-Alloy emitter did, rather than the way the framework
 * would by default:
 *
 * - no `required` keyword
 * - `[JsonPropertyName]` only when the C# name differs from the wire name
 * - no nullable `?` suffix on reference types (they are already nullable under
 *   `#nullable enable`)
 * - `new` rather than `override`/`virtual` for discriminator properties
 * - literal-typed properties become get-only properties with an initializer
 *
 * It is registered as a `ModelProperty` declaration override so that every property the
 * framework emits — including the ones it renders from inside `ClassDeclaration` — picks it
 * up. The framework's own rendering is still reached through `props.Declaration`, so the
 * doc comments, name policy and nullable-union unwrapping are not reimplemented here.
 */
export const ServerPropertyOverride: Experimental_OverrideDeclarationComponent<
  ModelProperty,
  PropertyProps
> = (props: Experimental_OverrideDeclareProps<ModelProperty, PropertyProps>): Children => {
  const { $ } = useTsp();
  const { collectionType } = useEmitterOptions();
  const namePolicy = cs.useCSharpNamePolicy();

  const property = props.type;
  const propType = property.type;
  const declaringModel: Model | undefined = property.model;
  const isErrorProp = declaringModel ? isErrorModel($.program, declaringModel) : false;
  const attrs = getPropertyAttributes($, property);

  // Error models derive from `HttpServiceException`, so a property whose C# name collides
  // with the class name or with an inherited exception member has to be renamed.
  let propName = property.name;
  if (isErrorProp && declaringModel) {
    const errorClassName = namePolicy.getName(getModelEmitName($.program, declaringModel), "class");
    const csharpPropName = namePolicy.getName(propName, "class-property");
    if (csharpPropName === errorClassName || isDuplicateExceptionName(csharpPropName)) {
      propName = csharpPropName === "Value" ? "ValueName" : `${csharpPropName}Prop`;
    }
  }

  // Only carry the wire name when the C# name policy actually changed it.
  const csharpName = namePolicy.getName(propName, "class-property");
  if (csharpName !== property.name) {
    attrs.unshift(
      <Attribute name={Serialization.JsonPropertyNameAttribute} args={[`"${property.name}"`]} />,
    );
  }

  // Discriminator properties redeclare a base property; the old emitter used `new`.
  const isOverride = declaringModel?.baseModel
    ? hasPropertyInChain(declaringModel.baseModel, property.name)
    : false;

  // e.g. `kind: PetType.Dog` — the property is pinned to a single enum member.
  const unionVariantInit = getUnionVariantInitializer(propType, namePolicy);
  // e.g. `variety: WolfBreed = WolfBreed.dire`
  const enumDefaultInit = getEnumDefaultInitializer(property, namePolicy);

  // Error model properties are populated by the generated constructor instead.
  const literalInfo = isErrorProp
    ? undefined
    : (unionVariantInit ?? getLiteralValue(propType, collectionType));
  const defaultValue = isErrorProp
    ? undefined
    : (enumDefaultInit ??
      (property.defaultValue ? getDefaultValueString(property.defaultValue) : undefined));

  const initializer = literalInfo ?? defaultValue;
  const isLiteralOnly = literalInfo !== undefined && defaultValue === undefined;

  // C# enums are integral, so an enum with fractional values has to widen to `double`.
  const isFloatEnum = $.enum.is(propType) && hasNonIntegerValues(propType as Enum);

  // A literal-typed property is declared as its scalar base; a union variant keeps its enum.
  const resolveToScalar = (isLiteralOnly && !unionVariantInit) || isErrorProp;
  const resolvedType = resolveToScalar ? getScalarForLiteral(propType) : propType;
  const needsNullable = property.optional && (isFloatEnum || isCSharpValueType($, resolvedType));

  const isUniqueItems = getUniqueItems($.program, property);
  const isArrayType = propType.kind === "Model" && $.array.is(propType);

  let csharpType: Children;
  if (isFloatEnum) {
    csharpType = code`double`;
  } else if (isUniqueItems && isArrayType && propType.indexer?.value) {
    csharpType = (
      <>
        ISet&lt;
        <TypeExpression type={propType.indexer.value} />
        &gt;
      </>
    );
  } else {
    csharpType = <TypeExpression type={resolvedType} />;
  }

  return (
    <props.Declaration
      {...props.declarationProps}
      name={propName}
      csharpType={csharpType}
      public
      new={isOverride}
      override={false}
      virtual={false}
      required={false}
      nullable={needsNullable}
      attributes={attrs.length > 0 ? attrs : undefined}
      get
      set={!isLiteralOnly}
      initializer={initializer}
    />
  );
};

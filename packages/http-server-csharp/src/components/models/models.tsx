import { code, For, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Attribute } from "@alloy-js/csharp";
import {
  isErrorModel,
  isVoidType,
  type Model,
  type ModelProperty,
  type Namespace as TspNamespace,
} from "@typespec/compiler";
import { useTsp } from "@typespec/emitter-framework";
import { isStatusCode } from "@typespec/http";
import { getUniqueItems } from "@typespec/json-schema";
import { useEmitterOptions } from "../../context/emitter-options-context.js";
import { getPropertyAttributes } from "../../utils/attributes.jsx";
import { JsonSerialization } from "../../utils/csharp-libs.jsx";
import { getDocComments } from "../../utils/doc-comments.jsx";
import { getSubNamespaceParts } from "../../utils/namespace-utils.js";
import { CSharpFile } from "../csharp-file.jsx";
import { efRefkey, TypeExpression } from "../type-expression/type-expression.jsx";
import { getErrorConstructor } from "./error-models.jsx";
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
  isValueType,
  modelNeedsJsonNodes,
} from "./model-helpers.js";

// Re-export public API used by other modules
export { getAnonymousModelName } from "./anonymous-models.js";

const modelUsings = [
  "System",
  "System.Collections.Generic",
  "System.Text.Json",
  "TypeSpec.Helpers.JsonConverters",
  "TypeSpec.Helpers",
];

export interface ModelsProps {
  /** Pre-resolved models to emit. */
  models: Model[];
  /** The service namespace for sub-namespace wrapping. */
  serviceNamespace: TspNamespace | undefined;
}

/**
 * Iterates pre-resolved models and emits C# class declarations.
 * Each model is emitted in its own source file under the models directory.
 */
export function Models(props: ModelsProps): Children {
  const { $ } = useTsp();

  return (
    <For each={props.models}>
      {(model) => {
        const needsJsonNodes = modelNeedsJsonNodes($, model);
        const usings = needsJsonNodes ? [...modelUsings, "System.Text.Json.Nodes"] : modelUsings;
        const modelName = getModelEmitName($.program, model);
        const subNsParts = getSubNamespaceParts(model.namespace, props.serviceNamespace);

        const modelContent = <ServerClassDeclaration type={model} emitName={modelName} />;

        // Wrap in sub-namespace if the model is in a sub-namespace of the service
        const wrappedContent = subNsParts.reduceRight<Children>(
          (content, nsPart) => <cs.Namespace name={nsPart}>{content}</cs.Namespace>,
          modelContent,
        );

        return (
          <CSharpFile path={`${modelName}.cs`} using={usings}>
            {wrappedContent}
          </CSharpFile>
        );
      }}
    </For>
  );
}

interface ServerClassDeclarationProps {
  type: Model;
  emitName?: string;
}

/**
 * Server-specific class declaration that matches the old emitter output:
 * - No `required` keyword
 * - No `[JsonPropertyName]` attributes
 * - No nullable `?` suffix on reference types (string, byte[], etc.)
 */
function ServerClassDeclaration(props: ServerClassDeclarationProps): Children {
  const { $ } = useTsp();
  const namePolicy = cs.useCSharpNamePolicy();
  const className = namePolicy.getName(props.emitName ?? props.type.name, "class");
  const refkeys = efRefkey(props.type);

  const isError = isErrorModel($.program, props.type);

  const properties = Array.from(props.type.properties.entries()).filter(
    ([_, p]) => !isVoidType(p.type),
  );

  // Determine base type
  let baseType: Children | undefined;
  if (props.type.baseModel) {
    baseType = <TypeExpression type={props.type.baseModel} />;
  } else if (isError) {
    baseType = "HttpServiceException";
  }

  // Generate constructor for error models
  const errorConstructor = isError
    ? getErrorConstructor($.program, props.type, className)
    : undefined;

  // For error models with base model, check if base is also an error (child constructor)
  const hasChildConstructor =
    isError && props.type.derivedModels && props.type.derivedModels.length > 0;

  return (
    <cs.ClassDeclaration
      name={className}
      refkey={refkeys}
      public
      partial
      baseType={baseType}
      doc={getDocComments($, props.type)}
    >
      {errorConstructor}
      {errorConstructor && <hbr />}
      {hasChildConstructor && (
        <cs.Constructor
          public
          parameters={[
            { name: "statusCode", type: "int" },
            { name: "value", type: "object?", default: "null" },
            { name: "headers", type: "Dictionary<string, string>?", default: "default" },
          ]}
          baseConstructor={["statusCode", "value", "headers"]}
        />
      )}
      {hasChildConstructor && <hbr />}
      <For each={properties} doubleHardline>
        {([_, property]) => {
          // Skip statusCode properties for error models
          if (isError && isStatusCode($.program, property)) return undefined;
          return (
            <ServerProperty
              type={property}
              errorClassName={isError ? className : undefined}
              baseModel={props.type.baseModel}
            />
          );
        }}
      </For>
    </cs.ClassDeclaration>
  );
}

interface ServerPropertyProps {
  type: ModelProperty;
  errorClassName?: string;
  baseModel?: Model;
}

/**
 * Server-specific property that matches old emitter output.
 * No `required`, no `[JsonPropertyName]`, no nullable `?` for reference types.
 */
function ServerProperty(props: ServerPropertyProps): Children {
  const { $ } = useTsp();
  const namePolicy = cs.useCSharpNamePolicy();
  const propType = props.type.type;
  const attrs = getPropertyAttributes($.program, props.type);

  // Determine property name, handling error model conflicts
  let propName = props.type.name;
  if (props.errorClassName) {
    const csharpPropName = namePolicy.getName(propName, "class-property");
    if (csharpPropName === props.errorClassName || isDuplicateExceptionName(csharpPropName)) {
      propName = csharpPropName === "Value" ? "ValueName" : `${csharpPropName}Prop`;
    }
  }

  // Add JsonPropertyName if the C# name differs from the original TypeSpec name
  const csharpName = namePolicy.getName(propName, "class-property");
  if (csharpName !== props.type.name) {
    attrs.unshift(
      <Attribute
        name={JsonSerialization.JsonPropertyNameAttribute}
        args={[`"${props.type.name}"`]}
      />,
    );
  }

  // Check if this property overrides a base model property (discriminator pattern)
  const isOverride = props.baseModel ? hasPropertyInChain(props.baseModel, props.type.name) : false;

  // Check for union variant type (e.g., kind: PetType.Dog) — used as enum member initializer
  const unionVariantInit = getUnionVariantInitializer(propType, namePolicy);

  // Check for enum default value (e.g., variety: WolfBreed = WolfBreed.dire)
  const enumDefaultInit = getEnumDefaultInitializer(props.type, namePolicy);

  // For error models, properties get values from constructor, not as literals
  const isErrorProp = !!props.errorClassName;

  // Check for literal values (the type itself is a literal)
  const { collectionType } = useEmitterOptions();
  const literalInfo = isErrorProp
    ? undefined
    : (unionVariantInit ?? getLiteralValue(propType, collectionType));
  // Check for default values
  const defaultValue = isErrorProp
    ? undefined
    : (enumDefaultInit ??
      (props.type.defaultValue ? getDefaultValueString(props.type.defaultValue) : undefined));

  const initializer = literalInfo ?? defaultValue;
  const isLiteralOnly = literalInfo !== undefined && defaultValue === undefined;

  // Check if the property type is a non-integer enum (C# enums can only be integers)
  const isFloatEnum =
    $.enum.is(propType) && hasNonIntegerValues(propType as import("@typespec/compiler").Enum);

  // For error model properties with literal types, use the scalar base type
  // But not for union variant types — those should resolve to the enum type
  const resolveToScalar = (isLiteralOnly && !unionVariantInit) || isErrorProp;
  const resolvedType = resolveToScalar ? getScalarForLiteral(propType) : propType;
  const needsNullable = props.type.optional && (isFloatEnum || isValueType($, resolvedType));

  // Check if this is a @uniqueItems array → ISet<T>
  const isUniqueItems = getUniqueItems($.program, props.type);
  const isArrayType = propType.kind === "Model" && $.array.is(propType);

  let typeExpr: Children;
  if (isFloatEnum) {
    typeExpr = code`double`;
  } else if (isUniqueItems && isArrayType && propType.indexer?.value) {
    typeExpr = (
      <>
        ISet&lt;
        <TypeExpression type={propType.indexer.value} />
        &gt;
      </>
    );
  } else {
    typeExpr = <TypeExpression type={resolveToScalar ? getScalarForLiteral(propType) : propType} />;
  }

  return (
    <cs.Property
      name={propName}
      type={typeExpr}
      public
      new={isOverride}
      nullable={needsNullable}
      doc={getDocComments($, props.type)}
      attributes={attrs.length > 0 ? attrs : undefined}
      get
      set={!isLiteralOnly}
      initializer={initializer}
    />
  );
}

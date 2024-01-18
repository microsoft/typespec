import {
  BooleanLiteral,
  DiscriminatedUnion,
  EmitContext,
  Enum,
  IntrinsicScalarName,
  Model,
  ModelProperty,
  NumericLiteral,
  Program,
  Scalar,
  StringLiteral,
  Type,
  TypeNameOptions,
  Union,
  compilerAssert,
  getDeprecated,
  getDiscriminatedUnion,
  getDiscriminator,
  getDoc,
  getEncode,
  getFormat,
  getKnownValues,
  getMaxItems,
  getMaxLength,
  getMaxValue,
  getMaxValueExclusive,
  getMinItems,
  getMinLength,
  getMinValue,
  getMinValueExclusive,
  getNamespaceFullName,
  getPattern,
  getSummary,
  getTypeName,
  ignoreDiagnostics,
  isArrayModelType,
  isNeverType,
  isNullType,
  isSecret,
  isTemplateDeclaration,
  resolveEncodedName,
  stringTemplateToString,
} from "@typespec/compiler";
import {
  ArrayBuilder,
  AssetEmitter,
  DefaultCircularReferenceHandler,
  EmitEntity,
  EmitterInit,
  EmitterOutput,
  ObjectBuilder,
  Placeholder,
  Scope,
  SourceFileScope,
  createAssetEmitter,
} from "@typespec/compiler/experimental/emitter-framework-v2";
import { MetadataInfo, Visibility, getVisibilitySuffix } from "@typespec/http";
import {
  checkDuplicateTypeName,
  getExtensions,
  getExternalDocs,
  getOpenAPITypeName,
  isReadonlyProperty,
  shouldInline,
} from "@typespec/openapi";
import { getOneOf, getRef } from "./decorators.js";
import { OpenAPI3EmitterOptions, createDiagnostic, reportDiagnostic } from "./lib.js";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { OpenAPI3Discriminator, OpenAPI3Schema, OpenAPI3SchemaProperty } from "./types.js";
import { VisibilityUsageTracker } from "./visibility-usage.js";

export interface OpenAPI3SchemaEmitterContext {
  visibility?: Visibility;
  contentType?: string;
  scope?: Scope<any>;
}

type OpenAPI3EmitterHooks = EmitterInit<any, OpenAPI3SchemaEmitterContext>;

export function createOpenAPI3SchemaEmitter(
  program: Program,
  emitContext: EmitContext<OpenAPI3EmitterOptions>,
  metadataInfo: MetadataInfo,
  visibilityUsage: VisibilityUsageTracker,
  serviceNamespaceName: string,
  resolvedOptions: ResolvedOpenAPI3EmitterOptions
): AssetEmitter<any, OpenAPI3SchemaEmitterContext, any> {
  function getVisibilityContext(context: OpenAPI3SchemaEmitterContext): Visibility {
    return context.visibility ?? Visibility.Read;
  }

  function getContentType(context: OpenAPI3SchemaEmitterContext): string {
    return context.contentType ?? "application/json";
  }

  const modelDeclaration: OpenAPI3EmitterHooks["modelDeclaration"] = ({
    type: model,
    emitter,
    context,
  }): EmitterOutput<object> => {
    const visibility = getVisibilityContext(context);
    const schema: ObjectBuilder<any> = new ObjectBuilder({
      type: "object",
      required: requiredModelProperties(model, visibility),
      properties: emitter.emitModelProperties(model),
    });

    if (model.indexer) {
      schema.set("additionalProperties", emitter.emitTypeReference(model.indexer.value));
    }

    const derivedModels = model.derivedModels.filter(includeDerivedModel);
    // getSchemaOrRef on all children to push them into components.schemas
    for (const child of derivedModels) {
      emitter.emitTypeReference(child);
    }

    const discriminator = getDiscriminator(program, model);
    if (discriminator) {
      const [union] = getDiscriminatedUnion(model, discriminator);

      const openApiDiscriminator: OpenAPI3Discriminator = { ...discriminator };
      if (union.variants.size > 0) {
        openApiDiscriminator.mapping = getDiscriminatorMapping(union, emitter);
      }

      schema.discriminator = openApiDiscriminator;
    }

    applyExternalDocs(model, schema);

    if (model.baseModel) {
      schema.set("allOf", B.array([emitter.emitTypeReference(model.baseModel)]));
    }

    const baseName = getOpenAPITypeName(program, model, typeNameOptions());
    const isMultipart = getContentType(context).startsWith("multipart/");
    const name = isMultipart ? baseName + "MultiPart" : baseName;
    return createDeclaration(model, name, applyConstraints(model, schema), emitter, context);
  };

  function requiredModelProperties(model: Model, visibility: Visibility): string[] | undefined {
    const requiredProps = [];

    for (const prop of model.properties.values()) {
      if (isNeverType(prop.type)) {
        // If the property has a type of 'never', don't include it in the schema
        continue;
      }
      if (!metadataInfo.isPayloadProperty(prop, visibility)) {
        continue;
      }

      if (!metadataInfo.isOptional(prop, visibility)) {
        requiredProps.push(prop.name);
      }
    }

    return requiredProps.length > 0 ? requiredProps : undefined;
  }

  function applyExternalDocs(typespecType: Type, target: Record<string, unknown>) {
    const externalDocs = getExternalDocs(program, typespecType);
    if (externalDocs) {
      target.externalDocs = externalDocs;
    }
  }

  function typeNameOptions(): TypeNameOptions {
    return {
      // shorten type names by removing TypeSpec and service namespace
      namespaceFilter(ns) {
        const name = getNamespaceFullName(ns);
        return name !== serviceNamespaceName;
      },
    };
  }

  const modelLiteral: OpenAPI3EmitterHooks["modelLiteral"] = ({
    type: model,
    emitter,
    context,
  }): EmitterOutput<object> => {
    const schema = new ObjectBuilder({
      type: "object",
      properties: emitter.emitModelProperties(model),
      required: requiredModelProperties(model, getVisibilityContext(context)),
    });

    if (model.indexer) {
      schema.set("additionalProperties", emitter.emitTypeReference(model.indexer.value));
    }

    return schema;
  };

  const modelInstantiation: OpenAPI3EmitterHooks["modelInstantiation"] = ({
    type,
    name,
    emitter,
    context,
  }): EmitterOutput<Record<string, any>> => {
    name = name ?? getOpenAPITypeName(program, type, typeNameOptions());
    if (!name) {
      return modelLiteral({ type, emitter, context });
    }

    return modelDeclaration({ type, name, emitter, context });
  };

  const arrayDeclaration: OpenAPI3EmitterHooks["arrayDeclaration"] = ({
    type: array,
    name,
    elementType,
    emitter,
    context,
  }): EmitterOutput<object> => {
    const schema = new ObjectBuilder({
      type: "array",
      items: emitter.emitTypeReference(elementType, {
        referenceContext: { visibility: getVisibilityContext(context) | Visibility.Item },
      }),
    });

    return createDeclaration(array, name, applyConstraints(array, schema), emitter, context);
  };

  const arrayLiteral: OpenAPI3EmitterHooks["arrayLiteral"] = ({
    type: array,
    elementType,
    emitter,
    context,
  }): EmitterOutput<object> => {
    return inlineType(
      array,
      new ObjectBuilder({
        type: "array",
        items: emitter.emitTypeReference(elementType, {
          referenceContext: { visibility: getVisibilityContext(context) | Visibility.Item },
        }),
      })
    );
  };

  const modelProperties: OpenAPI3EmitterHooks["modelProperties"] = ({
    type: model,
    emitter,
    context,
  }): EmitterOutput<Record<string, OpenAPI3SchemaProperty>> => {
    const props = new ObjectBuilder();
    const visibility = context.visibility!;
    const contentType = getContentType(context);

    for (const prop of model.properties.values()) {
      if (isNeverType(prop.type)) {
        // If the property has a type of 'never', don't include it in the schema
        continue;
      }
      if (!metadataInfo.isPayloadProperty(prop, visibility)) {
        continue;
      }
      const result = emitter.emitModelProperty(prop);
      const encodedName = resolveEncodedName(program, prop, contentType);
      props.set(encodedName, result);
    }

    const discriminator = getDiscriminator(program, model);
    if (discriminator && !(discriminator.propertyName in props)) {
      props.set(discriminator.propertyName, {
        type: "string",
        description: `Discriminator property for ${model.name}.`,
      });
    }

    if (Object.keys(props).length === 0) {
      return emitter.result.none();
    }

    return props;
  };

  function isBytesKeptRaw(type: Type) {
    return (
      type.kind === "Scalar" && type.name === "bytes" && getEncode(program, type) === undefined
    );
  }

  const modelPropertyLiteral: OpenAPI3EmitterHooks["modelPropertyLiteral"] = ({
    type: prop,
    emitter,
    context,
  }): EmitterOutput<object> => {
    const isMultipart = getContentType(context).startsWith("multipart/");
    if (isMultipart) {
      if (isBytesKeptRaw(prop.type) && getEncode(program, prop) === undefined) {
        return { type: "string", format: "binary" };
      }
      if (
        prop.type.kind === "Model" &&
        isArrayModelType(program, prop.type) &&
        isBytesKeptRaw(prop.type.indexer.value)
      ) {
        return { type: "array", items: { type: "string", format: "binary" } };
      }
    }

    const refSchema = emitter.emitTypeReference(prop.type, {
      referenceContext: isMultipart ? { contentType: "application/json" } : {},
    });
    if (refSchema.kind !== "code") {
      throw new Error("Unexpected non-code result from emit reference");
    }

    const isRef = refSchema.value instanceof Placeholder || "$ref" in refSchema.value;

    const schema = applyEncoding(prop, refSchema.value as any);
    // Apply decorators on the property to the type's schema
    const additionalProps: Partial<OpenAPI3Schema> = applyConstraints(prop, {});
    if (prop.default) {
      additionalProps.default = getDefaultValue(prop.type, prop.default);
    }

    if (isReadonlyProperty(program, prop)) {
      additionalProps.readOnly = true;
    }

    // Attach any additional OpenAPI extensions
    attachExtensions(program, prop, additionalProps);

    if (schema && isRef) {
      if (Object.keys(additionalProps).length === 0) {
        return schema;
      } else {
        return {
          allOf: [schema],
          ...additionalProps,
        };
      }
    } else {
      if (getOneOf(program, prop) && schema.anyOf) {
        schema.oneOf = schema.anyOf;
        delete schema.anyOf;
      }

      const merged = new ObjectBuilder(schema);
      for (const [key, value] of Object.entries(additionalProps)) {
        merged.set(key, value);
      }
      return merged;
    }
  };

  const booleanLiteral: OpenAPI3EmitterHooks["booleanLiteral"] = ({
    type,
  }): EmitterOutput<object> => {
    return { type: "boolean", enum: [type.value] };
  };

  const stringLiteral: OpenAPI3EmitterHooks["stringLiteral"] = ({
    type,
  }): EmitterOutput<object> => {
    return { type: "string", enum: [type.value] };
  };

  const stringTemplate: OpenAPI3EmitterHooks["stringTemplate"] = ({
    type,
    emitter,
  }): EmitterOutput<object> => {
    const [value, diagnostics] = stringTemplateToString(type);
    if (diagnostics.length > 0) {
      emitter
        .getProgram()
        .reportDiagnostics(diagnostics.map((x) => ({ ...x, severity: "warning" })));
      return { type: "string" };
    }
    return { type: "string", enum: [value] };
  };

  const numericLiteral: OpenAPI3EmitterHooks["numericLiteral"] = ({
    type,
  }): EmitterOutput<object> => {
    return { type: "number", enum: [type.value] };
  };

  const enumDeclaration: OpenAPI3EmitterHooks["enumDeclaration"] = ({
    type,
    emitter,
    context,
  }): EmitterOutput<object> => {
    const baseName = getOpenAPITypeName(program, type, typeNameOptions());
    return createDeclaration(type, baseName, new ObjectBuilder(enumSchema(type)), emitter, context);
  };

  function enumSchema(en: Enum): OpenAPI3Schema {
    if (en.members.size === 0) {
      reportDiagnostic(program, { code: "empty-enum", target: en });
      return {};
    }

    const enumTypes = new Set<string>();
    const enumValues = new Set<string | number>();
    for (const member of en.members.values()) {
      enumTypes.add(typeof member.value === "number" ? "number" : "string");
      enumValues.add(member.value ?? member.name);
    }

    if (enumTypes.size > 1) {
      reportDiagnostic(program, { code: "enum-unique-type", target: en });
    }

    const schema: OpenAPI3Schema = { type: enumTypes.values().next().value, enum: [...enumValues] };

    return applyConstraints(en, schema);
  }

  const enumMemberReference: OpenAPI3EmitterHooks["enumMember"] = ({
    type,
  }): EmitterOutput<Record<string, any>> => {
    // would like to dispatch to the same `literal` codepaths but enum members aren't literal types
    switch (typeof type.value) {
      case "undefined":
        return { type: "string", enum: [type.name] };
      case "string":
        return { type: "string", enum: [type.value] };
      case "number":
        return { type: "number", enum: [type.value] };
    }
  };
  const enumMember: OpenAPI3EmitterHooks["enumMember"] = enumMemberReference;

  const unionDeclaration: OpenAPI3EmitterHooks["unionDeclaration"] = ({
    type: union,
    name,
    emitter,
    context,
  }): EmitterOutput<object> => {
    const schema = unionSchema(union, emitter);
    return createDeclaration(union, name, schema, emitter, context);
  };

  function unionSchema(union: Union, emitter: AssetEmitter<any, any, any>) {
    if (union.variants.size === 0) {
      reportDiagnostic(program, { code: "empty-union", target: union });
      return {};
    }
    const variants = Array.from(union.variants.values());
    const literalVariantEnumByType: Record<string, any> = {};
    const ofType = getOneOf(program, union) ? "oneOf" : "anyOf";
    const schemaMembers: { schema: any; type: Type | null }[] = [];
    let nullable = false;
    const discriminator = getDiscriminator(program, union);

    for (const variant of variants) {
      if (isNullType(variant.type)) {
        nullable = true;
        continue;
      }

      if (isLiteralType(variant.type)) {
        if (!literalVariantEnumByType[variant.type.kind]) {
          const enumSchema = emitter.emitTypeReference(variant.type);
          compilerAssert(
            enumSchema.kind === "code",
            "Unexpected enum schema. Should be kind: code"
          );
          literalVariantEnumByType[variant.type.kind] = enumSchema.value;
          schemaMembers.push({ schema: enumSchema.value, type: null });
        } else {
          literalVariantEnumByType[variant.type.kind].enum.push(variant.type.value);
        }
      } else {
        const enumSchema = emitter.emitTypeReference(variant.type);
        compilerAssert(enumSchema.kind === "code", "Unexpected enum schema. Should be kind: code");
        schemaMembers.push({ schema: enumSchema.value, type: variant.type });
      }
    }

    if (schemaMembers.length === 0) {
      if (nullable) {
        // This union is equivalent to just `null` but OA3 has no way to specify
        // null as a value, so we throw an error.
        reportDiagnostic(program, { code: "union-null", target: union });
        return {};
      } else {
        // completely empty union can maybe only happen with bugs?
        compilerAssert(false, "Attempting to emit an empty union");
      }
    }

    if (schemaMembers.length === 1) {
      // we can just return the single schema member after applying nullable
      let schema = schemaMembers[0].schema;
      const type = schemaMembers[0].type;

      if (nullable) {
        if (schema instanceof Placeholder || "$ref" in schema) {
          // but we can't make a ref "nullable", so wrap in an allOf (for models)
          // or oneOf (for all other types)
          if (type && type.kind === "Model") {
            return B.object({ type: "object", allOf: B.array([schema]), nullable: true });
          } else {
            return B.object({ oneOf: B.array([schema]), nullable: true });
          }
        } else {
          schema = { ...schema, nullable: true };
        }
      }

      return schema;
    }

    const schema: any = {
      [ofType]: schemaMembers.map((m) => m.schema),
    };

    if (nullable) {
      schema.nullable = true;
    }

    if (discriminator) {
      // the decorator validates that all the variants will be a model type
      // with the discriminator field present.
      schema.discriminator = { ...discriminator };
      // Diagnostic already reported in compiler for unions
      const discriminatedUnion = ignoreDiagnostics(getDiscriminatedUnion(union, discriminator));
      if (discriminatedUnion.variants.size > 0) {
        schema.discriminator.mapping = getDiscriminatorMapping(discriminatedUnion, emitter);
      }
    }

    return applyConstraints(union, schema);
  }

  function getDiscriminatorMapping(
    union: DiscriminatedUnion,
    emitter: AssetEmitter<any, any, any>
  ) {
    const mapping: Record<string, string> | undefined = {};
    for (const [key, model] of union.variants.entries()) {
      const ref = emitter.emitTypeReference(model);
      compilerAssert(ref.kind === "code", "Unexpected ref schema. Should be kind: code");
      mapping[key] = (ref.value as any).$ref;
    }
    return mapping;
  }

  const unionLiteral: OpenAPI3EmitterHooks["unionLiteral"] = ({
    type,
    emitter,
  }): EmitterOutput<object> => {
    return unionSchema(type, emitter);
  };

  const unionVariants: OpenAPI3EmitterHooks["unionVariants"] = ({
    type: union,
    emitter,
  }): EmitterOutput<object> => {
    const variants = new ArrayBuilder();
    for (const variant of union.variants.values()) {
      variants.push(emitter.emitType(variant));
    }
    return variants;
  };

  const unionVariant: OpenAPI3EmitterHooks["unionVariant"] = ({
    type: variant,
    emitter,
  }): EmitterOutput<object> => {
    return emitter.emitTypeReference(variant.type);
  };

  const modelPropertyReference = modelPropertyLiteral;

  function attachExtensions(program: Program, type: Type, emitObject: OpenAPI3Schema) {
    // Attach any OpenAPI extensions
    const extensions = getExtensions(program, type);
    if (extensions) {
      for (const key of extensions.keys()) {
        emitObject[key] = extensions.get(key);
      }
    }
  }

  function getDefaultValue(type: Type, defaultType: Type): any {
    switch (defaultType.kind) {
      case "String":
        return defaultType.value;
      case "Number":
        return defaultType.value;
      case "Boolean":
        return defaultType.value;
      case "Tuple":
        compilerAssert(
          type.kind === "Tuple" || (type.kind === "Model" && isArrayModelType(program, type)),
          "setting tuple default to non-tuple value"
        );

        if (type.kind === "Tuple") {
          return defaultType.values.map((defaultTupleValue, index) =>
            getDefaultValue(type.values[index], defaultTupleValue)
          );
        } else {
          return defaultType.values.map((defaultTuplevalue) =>
            getDefaultValue(type.indexer!.value, defaultTuplevalue)
          );
        }

      case "Intrinsic":
        return isNullType(defaultType)
          ? null
          : reportDiagnostic(program, {
              code: "invalid-default",
              format: { type: defaultType.kind },
              target: defaultType,
            });
      case "EnumMember":
        return defaultType.value ?? defaultType.name;
      default:
        reportDiagnostic(program, {
          code: "invalid-default",
          format: { type: defaultType.kind },
          target: defaultType,
        });
    }
  }

  const reference: OpenAPI3EmitterHooks["reference"] = ({
    target,
    pathUp,
    pathDown,
  }): object | EmitEntity<Record<string, unknown>> => {
    if (target.value instanceof Placeholder) {
      // I don't think this is possible, confirm.
      throw new Error("Can't form reference to declaration that hasn't been created yet");
    }

    // these will be undefined when creating a self-reference
    const currentSfScope = pathUp[pathUp.length - 1] as SourceFileScope<object> | undefined;
    const targetSfScope = pathDown[0] as SourceFileScope<object> | undefined;

    if (targetSfScope && currentSfScope && !targetSfScope.sourceFile.meta.shouldEmit) {
      currentSfScope.sourceFile.meta.bundledRefs.push(target);
    }

    return { $ref: `#/components/schemas/${target.name}` };
  };

  const circularReference: OpenAPI3EmitterHooks["circularReference"] = (
    props
  ): object | EmitEntity<Record<string, unknown>> => {
    const { cycle } = props;
    if (!cycle.containsDeclaration) {
      reportDiagnostic(program, {
        code: "inline-cycle",
        format: {
          type: cycle.toString(),
        },
        target: cycle.first.type,
      });
      return {};
    }
    return DefaultCircularReferenceHandler(props);
  };

  const scalarDeclaration: OpenAPI3EmitterHooks["scalarDeclaration"] = ({
    type: scalar,
    emitter,
    context,
  }): EmitterOutput<OpenAPI3Schema> => {
    const isStd = isStdType(scalar);
    const schema = getSchemaForScalar(scalar);
    const baseName = getOpenAPITypeName(program, scalar, typeNameOptions());

    // Don't create a declaration for std types
    return isStd
      ? schema
      : createDeclaration(scalar, baseName, new ObjectBuilder(schema), emitter, context);
  };

  const scalarInstantiation: OpenAPI3EmitterHooks["scalarInstantiation"] = ({
    type: scalar,
  }): EmitterOutput<OpenAPI3Schema> => {
    return getSchemaForScalar(scalar);
  };

  const tupleLiteral: OpenAPI3EmitterHooks["tupleLiteral"] = ({
    type,
  }): EmitterOutput<OpenAPI3Schema> => {
    return { type: "array", items: {} };
  };

  function getSchemaForScalar(scalar: Scalar): OpenAPI3Schema {
    let result: OpenAPI3Schema = {};
    const isStd = isStdType(scalar);
    if (isStd) {
      result = getSchemaForStdScalars(scalar);
    } else if (scalar.baseScalar) {
      result = getSchemaForScalar(scalar.baseScalar);
    }
    const withDecorators = applyEncoding(scalar, applyConstraints(scalar, result));
    if (isStd) {
      // Standard types are going to be inlined in the spec and we don't want the description of the scalar to show up
      delete withDecorators.description;
    }
    return withDecorators;
  }

  function getSchemaForStdScalars(scalar: Scalar & { name: IntrinsicScalarName }): OpenAPI3Schema {
    switch (scalar.name) {
      case "bytes":
        return { type: "string", format: "byte" };
      case "numeric":
        return { type: "number" };
      case "integer":
        return { type: "integer" };
      case "int8":
        return { type: "integer", format: "int8" };
      case "int16":
        return { type: "integer", format: "int16" };
      case "int32":
        return { type: "integer", format: "int32" };
      case "int64":
        return { type: "integer", format: "int64" };
      case "safeint":
        return { type: "integer", format: "int64" };
      case "uint8":
        return { type: "integer", format: "uint8" };
      case "uint16":
        return { type: "integer", format: "uint16" };
      case "uint32":
        return { type: "integer", format: "uint32" };
      case "uint64":
        return { type: "integer", format: "uint64" };
      case "float":
        return { type: "number" };
      case "float64":
        return { type: "number", format: "double" };
      case "float32":
        return { type: "number", format: "float" };
      case "decimal":
        return { type: "number", format: "decimal" };
      case "decimal128":
        return { type: "number", format: "decimal128" };
      case "string":
        return { type: "string" };
      case "boolean":
        return { type: "boolean" };
      case "plainDate":
        return { type: "string", format: "date" };
      case "utcDateTime":
      case "offsetDateTime":
        return { type: "string", format: "date-time" };
      case "plainTime":
        return { type: "string", format: "time" };
      case "duration":
        return { type: "string", format: "duration" };
      case "url":
        return { type: "string", format: "uri" };
      default:
        const _assertNever: never = scalar.name;
        return {};
    }
  }

  function applyConstraints(
    type: Scalar | Model | ModelProperty | Union | Enum,
    original: OpenAPI3Schema
  ): ObjectBuilder<OpenAPI3Schema> {
    const schema = new ObjectBuilder(original);

    const applyConstraint = (fn: (p: Program, t: Type) => any, key: keyof OpenAPI3Schema) => {
      const value = fn(program, type);
      if (value !== undefined) {
        schema[key] = value;
      }
    };

    applyConstraint(getMinLength, "minLength");
    applyConstraint(getMaxLength, "maxLength");
    applyConstraint(getMinValue, "minimum");
    applyConstraint(getMaxValue, "maximum");
    applyConstraint(getPattern, "pattern");
    applyConstraint(getMinItems, "minItems");
    applyConstraint(getMaxItems, "maxItems");

    const minValueExclusive = getMinValueExclusive(program, type);
    if (minValueExclusive !== undefined) {
      schema.minimum = minValueExclusive;
      schema.exclusiveMinimum = true;
    }

    const maxValueExclusive = getMaxValueExclusive(program, type);
    if (maxValueExclusive !== undefined) {
      schema.maximum = maxValueExclusive;
      schema.exclusiveMaximum = true;
    }

    if (isSecret(program, type)) {
      schema.format = "password";
    }

    // the stdlib applies a format of "url" but json schema wants "uri",
    // so ignore this format if it's the built-in type.
    if (!isStdType(type) || type.name !== "url") {
      applyConstraint(getFormat, "format");
    }

    applyConstraint(getDoc, "description");
    applyConstraint(getSummary, "title");
    applyConstraint(
      (p: Program, t: Type) => (getDeprecated(p, t) !== undefined ? true : undefined),
      "deprecated"
    );

    attachExtensions(program, type, schema);

    const values = getKnownValues(program, type as any);
    if (values) {
      return new ObjectBuilder({
        oneOf: [schema, enumSchema(values)],
      });
    }

    return new ObjectBuilder(schema);
  }

  function inlineType(type: Type, schema: ObjectBuilder<any>) {
    if (resolvedOptions.includeXTypeSpecName !== "never") {
      schema.set("x-typespec-name", getTypeName(type, typeNameOptions()));
    }
    return schema;
  }

  function createDeclaration(
    type: Type,
    name: string,
    schema: ObjectBuilder<any>,
    emitter: AssetEmitter<any, OpenAPI3SchemaEmitterContext>,
    context: OpenAPI3SchemaEmitterContext
  ) {
    const refUrl = getRef(program, type);
    if (refUrl) {
      return {
        $ref: refUrl,
      };
    }

    if (shouldInline(program, type)) {
      return inlineType(type, schema);
    }

    const title = getSummary(program, type);
    if (title) {
      schema.set("title", title);
    }

    const usage = visibilityUsage.getUsage(type);
    const shouldAddSuffix = usage !== undefined && usage.size > 1;
    const visibility = getVisibilityContext(context);
    const fullName =
      name + (shouldAddSuffix ? getVisibilitySuffix(visibility, Visibility.Read) : "");

    const decl = emitter.result.declaration(fullName, schema);

    checkDuplicateTypeName(
      program,
      type,
      fullName,
      Object.fromEntries(decl.scope.declarations.map((x) => [x.name, true]))
    );
    return decl;
  }

  function isStdType(type: Type): type is Scalar & { name: IntrinsicScalarName } {
    return program.checker.isStdType(type);
  }

  function applyEncoding(
    typespecType: Scalar | ModelProperty,
    target: OpenAPI3Schema | Placeholder<OpenAPI3Schema>
  ): OpenAPI3Schema {
    const encodeData = getEncode(program, typespecType);
    if (encodeData) {
      const newTarget = new ObjectBuilder(target);
      const newType = getSchemaForStdScalars(encodeData.type as any);

      newTarget.type = newType.type;
      // If the target already has a format it takes priority. (e.g. int32)
      newTarget.format = mergeFormatAndEncoding(
        newTarget.format,
        encodeData.encoding,
        newType.format
      );
      return newTarget;
    }
    return new ObjectBuilder(target);
  }
  function mergeFormatAndEncoding(
    format: string | undefined,
    encoding: string,
    encodeAsFormat: string | undefined
  ): string {
    switch (format) {
      case undefined:
        return encodeAsFormat ?? encoding;
      case "date-time":
        switch (encoding) {
          case "rfc3339":
            return "date-time";
          case "unixTimestamp":
            return "unixtime";
          case "rfc7231":
            return "http-date";
          default:
            return encoding;
        }
      case "duration":
        switch (encoding) {
          case "ISO8601":
            return "duration";
          default:
            return encodeAsFormat ?? encoding;
        }
      default:
        return encodeAsFormat ?? encoding;
    }
  }

  const intrinsic: OpenAPI3EmitterHooks["intrinsic"] = ({
    name,
  }): EmitterOutput<OpenAPI3Schema> => {
    switch (name) {
      case "unknown":
        return {};
    }

    throw new Error("Unknown intrinsic type " + name);
  };

  return createAssetEmitter(
    program,
    {
      onUnhandledType: ({ type, diagnosticTarget, emitter }) => {
        return [
          {},
          [
            createDiagnostic({
              code: "invalid-schema",
              format: { type: type.kind },
              target: diagnosticTarget,
            }),
          ],
        ];
      },
      modelDeclaration,
      modelLiteral,
      modelProperties,
      modelInstantiation,
      modelPropertyLiteral,
      modelPropertyReference,
      arrayDeclaration,
      arrayLiteral,
      unionDeclaration,
      unionVariant,
      unionVariants,
      enumDeclaration,
      enumMember,
      enumMemberReference,
      scalarDeclaration,
      scalarInstantiation,
      intrinsic,
      reference,
      circularReference,
      tupleLiteral,
      booleanLiteral,
      stringLiteral,
      stringTemplate,
      numericLiteral,
      unionLiteral,
      reduceContext: ({ type, context, emitter, method }) => {
        if (
          !(
            method === "modelDeclaration" ||
            method === "modelLiteral" ||
            method === "scalarDeclaration" ||
            method === "enumDeclaration" ||
            method === "unionDeclaration"
          )
        ) {
          return context;
        }

        const visibility = getVisibilityContext(context);

        const patch: Record<string, any> = {};
        if (visibility !== Visibility.Read && !metadataInfo.isTransformed(type, visibility)) {
          patch.visibility = Visibility.Read;
        }
        const contentType = getContentType(context);

        if (contentType === "application/json") {
          patch.contentType = undefined;
        }

        return patch;
      },
      programContext: ({ program, emitter }): OpenAPI3SchemaEmitterContext => {
        const sourceFile = emitter.createSourceFile("openapi");
        return { scope: sourceFile.globalScope };
      },
    },
    emitContext
  );
}

function isLiteralType(type: Type): type is StringLiteral | NumericLiteral | BooleanLiteral {
  return type.kind === "Boolean" || type.kind === "String" || type.kind === "Number";
}

function includeDerivedModel(model: Model): boolean {
  return (
    !isTemplateDeclaration(model) &&
    (model.templateMapper?.args === undefined ||
      model.templateMapper.args?.length === 0 ||
      model.derivedModels.length > 0)
  );
}

const B = {
  array: <T>(items: T[]): ArrayBuilder<T> => {
    const builder = new ArrayBuilder<T>();
    for (const item of items) {
      builder.push(item);
    }
    return builder;
  },
  object: <T extends Record<string, unknown>>(obj: T): ObjectBuilder<T[string]> => {
    const builder = new ObjectBuilder<T[string]>();
    for (const [key, value] of Object.entries(obj)) {
      builder.set(key, value as any);
    }
    return builder;
  },
} as const;

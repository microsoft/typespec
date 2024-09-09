import {
  BooleanLiteral,
  DiscriminatedUnion,
  Enum,
  EnumMember,
  IntrinsicScalarName,
  IntrinsicType,
  Model,
  ModelProperty,
  NumericLiteral,
  Program,
  Scalar,
  StringLiteral,
  StringTemplate,
  Tuple,
  Type,
  TypeNameOptions,
  Union,
  UnionVariant,
  Value,
  compilerAssert,
  explainStringTemplateNotSerializable,
  getDeprecated,
  getDiscriminatedUnion,
  getDiscriminator,
  getDoc,
  getEncode,
  getExamples,
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
  serializeValueAsJson,
} from "@typespec/compiler";
import {
  ArrayBuilder,
  AssetEmitter,
  Context,
  Declaration,
  EmitEntity,
  EmitterOutput,
  ObjectBuilder,
  Placeholder,
  ReferenceCycle,
  Scope,
  SourceFileScope,
  TypeEmitter,
} from "@typespec/compiler/emitter-framework";
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
import { applyEncoding } from "./encoding.js";
import { OpenAPI3EmitterOptions, reportDiagnostic } from "./lib.js";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { getSchemaForStdScalars } from "./std-scalar-schemas.js";
import { OpenAPI3Discriminator, OpenAPI3Schema, OpenAPI3SchemaProperty } from "./types.js";
import { VisibilityUsageTracker } from "./visibility-usage.js";

/**
 * OpenAPI3 schema emitter. Deals with emitting content of `components/schemas` section.
 */
export class OpenAPI3SchemaEmitter extends TypeEmitter<
  Record<string, any>,
  OpenAPI3EmitterOptions
> {
  #metadataInfo: MetadataInfo;
  #visibilityUsage: VisibilityUsageTracker;
  #options: ResolvedOpenAPI3EmitterOptions;
  constructor(
    emitter: AssetEmitter<Record<string, any>, OpenAPI3EmitterOptions>,
    metadataInfo: MetadataInfo,
    visibilityUsage: VisibilityUsageTracker,
    options: ResolvedOpenAPI3EmitterOptions
  ) {
    super(emitter);
    this.#metadataInfo = metadataInfo;
    this.#visibilityUsage = visibilityUsage;
    this.#options = options;
  }

  modelDeclarationReferenceContext(model: Model, name: string): Context {
    return this.reduceContext(model);
  }

  modelLiteralReferenceContext(model: Model): Context {
    return this.reduceContext(model);
  }

  scalarDeclarationReferenceContext(scalar: Scalar, name: string): Context {
    return this.reduceContext(scalar);
  }

  enumDeclarationReferenceContext(en: Enum, name: string): Context {
    return this.reduceContext(en);
  }

  unionDeclarationReferenceContext(union: Union): Context {
    return this.reduceContext(union);
  }

  reduceContext(type: Type): Context {
    const visibility = this.#getVisibilityContext();
    const patch: Record<string, any> = {};
    if (visibility !== Visibility.Read && !this.#metadataInfo.isTransformed(type, visibility)) {
      patch.visibility = Visibility.Read;
    }
    const contentType = this.#getContentType();

    if (contentType === "application/json") {
      patch.contentType = undefined;
    }

    return patch;
  }

  modelDeclaration(model: Model, _: string): EmitterOutput<object> {
    const program = this.emitter.getProgram();
    const visibility = this.#getVisibilityContext();
    const schema: ObjectBuilder<any> = new ObjectBuilder({
      type: "object",
      required: this.#requiredModelProperties(model, visibility),
      properties: this.emitter.emitModelProperties(model),
    });

    if (model.indexer) {
      schema.set("additionalProperties", this.emitter.emitTypeReference(model.indexer.value));
    }

    const derivedModels = model.derivedModels.filter(includeDerivedModel);
    // getSchemaOrRef on all children to push them into components.schemas
    for (const child of derivedModels) {
      this.emitter.emitTypeReference(child);
    }

    const discriminator = getDiscriminator(program, model);
    if (discriminator) {
      const [union] = getDiscriminatedUnion(model, discriminator);

      const openApiDiscriminator: OpenAPI3Discriminator = { ...discriminator };
      if (union.variants.size > 0) {
        openApiDiscriminator.mapping = this.#getDiscriminatorMapping(union);
      }

      schema.discriminator = openApiDiscriminator;
    }

    this.#applyExternalDocs(model, schema);

    if (model.baseModel) {
      schema.set("allOf", B.array([this.emitter.emitTypeReference(model.baseModel)]));
    }

    const baseName = getOpenAPITypeName(program, model, this.#typeNameOptions());
    const isMultipart = this.#getContentType().startsWith("multipart/");
    const name = isMultipart ? baseName + "MultiPart" : baseName;
    return this.#createDeclaration(model, name, this.#applyConstraints(model, schema));
  }

  #applyExternalDocs(typespecType: Type, target: Record<string, unknown>) {
    const externalDocs = getExternalDocs(this.emitter.getProgram(), typespecType);
    if (externalDocs) {
      target.externalDocs = externalDocs;
    }
  }

  #typeNameOptions(): TypeNameOptions {
    const serviceNamespaceName = this.emitter.getContext().serviceNamespaceName;
    return {
      // shorten type names by removing TypeSpec and service namespace
      namespaceFilter(ns) {
        const name = getNamespaceFullName(ns);
        return name !== serviceNamespaceName;
      },
    };
  }

  #getVisibilityContext(): Visibility {
    return this.emitter.getContext().visibility ?? Visibility.Read;
  }

  #ignoreMetadataAnnotations(): boolean {
    return this.emitter.getContext().ignoreMetadataAnnotations;
  }

  #getContentType(): string {
    return this.emitter.getContext().contentType ?? "application/json";
  }

  modelLiteral(model: Model): EmitterOutput<object> {
    const schema = new ObjectBuilder({
      type: "object",
      properties: this.emitter.emitModelProperties(model),
      required: this.#requiredModelProperties(model, this.#getVisibilityContext()),
    });

    if (model.indexer) {
      schema.set("additionalProperties", this.emitter.emitTypeReference(model.indexer.value));
    }

    return schema;
  }

  modelInstantiation(model: Model, name: string | undefined): EmitterOutput<Record<string, any>> {
    name = name ?? getOpenAPITypeName(this.emitter.getProgram(), model, this.#typeNameOptions());
    if (!name) {
      return this.modelLiteral(model);
    }

    return this.modelDeclaration(model, name);
  }

  arrayDeclaration(array: Model, name: string, elementType: Type): EmitterOutput<object> {
    const schema = new ObjectBuilder({
      type: "array",
      items: this.emitter.emitTypeReference(elementType),
    });

    return this.#createDeclaration(array, name, this.#applyConstraints(array, schema));
  }

  arrayDeclarationReferenceContext(array: Model, name: string, elementType: Type): Context {
    return {
      visibility: this.#getVisibilityContext() | Visibility.Item,
    };
  }

  arrayLiteral(array: Model, elementType: Type): EmitterOutput<object> {
    return this.#inlineType(
      array,
      new ObjectBuilder({
        type: "array",
        items: this.emitter.emitTypeReference(elementType),
      })
    );
  }

  arrayLiteralReferenceContext(array: Model, elementType: Type): Context {
    return {
      visibility: this.#getVisibilityContext() | Visibility.Item,
    };
  }

  #requiredModelProperties(model: Model, visibility: Visibility): string[] | undefined {
    const requiredProps = [];

    for (const prop of model.properties.values()) {
      if (isNeverType(prop.type)) {
        // If the property has a type of 'never', don't include it in the schema
        continue;
      }

      if (
        !this.#metadataInfo.isPayloadProperty(prop, visibility, this.#ignoreMetadataAnnotations())
      ) {
        continue;
      }

      if (!this.#metadataInfo.isOptional(prop, visibility)) {
        const encodedName = resolveEncodedName(
          this.emitter.getProgram(),
          prop,
          this.#getContentType()
        );

        requiredProps.push(encodedName);
      }
    }

    return requiredProps.length > 0 ? requiredProps : undefined;
  }

  modelProperties(model: Model): EmitterOutput<Record<string, OpenAPI3SchemaProperty>> {
    const program = this.emitter.getProgram();
    const props = new ObjectBuilder();
    const visibility = this.emitter.getContext().visibility;
    const contentType = this.#getContentType();

    for (const prop of model.properties.values()) {
      if (isNeverType(prop.type)) {
        // If the property has a type of 'never', don't include it in the schema
        continue;
      }
      if (
        !this.#metadataInfo.isPayloadProperty(prop, visibility, this.#ignoreMetadataAnnotations())
      ) {
        continue;
      }
      const result = this.emitter.emitModelProperty(prop);
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
      return this.emitter.result.none();
    }

    return props;
  }

  modelPropertyLiteral(prop: ModelProperty): EmitterOutput<object> {
    const program = this.emitter.getProgram();
    const isMultipart = this.#getContentType().startsWith("multipart/");
    if (isMultipart) {
      if (isBytesKeptRaw(program, prop.type) && getEncode(program, prop) === undefined) {
        return { type: "string", format: "binary" };
      }
      if (
        prop.type.kind === "Model" &&
        isArrayModelType(program, prop.type) &&
        isBytesKeptRaw(program, prop.type.indexer.value)
      ) {
        return { type: "array", items: { type: "string", format: "binary" } };
      }
    }

    const refSchema = this.emitter.emitTypeReference(prop.type, {
      referenceContext:
        isMultipart &&
        (prop.type.kind !== "Union" ||
          ![...prop.type.variants.values()].some((x) => isBytesKeptRaw(program, x.type)))
          ? { contentType: "application/json" }
          : {},
    });

    if (refSchema.kind !== "code") {
      reportDiagnostic(program, {
        code: "invalid-model-property",
        format: {
          type: prop.type.kind,
        },
        target: prop,
      });
      return {};
    }

    const isRef = refSchema.value instanceof Placeholder || "$ref" in refSchema.value;

    const schema = this.#applyEncoding(prop, refSchema.value as any);

    // Apply decorators on the property to the type's schema
    const additionalProps: Partial<OpenAPI3Schema> = this.#applyConstraints(prop, {});
    if (prop.defaultValue) {
      additionalProps.default = getDefaultValue(program, prop.defaultValue);
    }

    if (isReadonlyProperty(program, prop)) {
      additionalProps.readOnly = true;
    }

    // Attach any additional OpenAPI extensions
    this.#attachExtensions(program, prop, additionalProps);

    if (schema && isRef && !(prop.type.kind === "Model" && isArrayModelType(program, prop.type))) {
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
  }

  booleanLiteral(boolean: BooleanLiteral): EmitterOutput<object> {
    return { type: "boolean", enum: [boolean.value] };
  }

  stringLiteral(string: StringLiteral): EmitterOutput<object> {
    return { type: "string", enum: [string.value] };
  }

  stringTemplate(string: StringTemplate): EmitterOutput<object> {
    if (string.stringValue !== undefined) {
      return { type: "string", enum: [string.stringValue] };
    }
    const diagnostics = explainStringTemplateNotSerializable(string);
    this.emitter
      .getProgram()
      .reportDiagnostics(diagnostics.map((x) => ({ ...x, severity: "warning" })));
    return { type: "string" };
  }

  numericLiteral(number: NumericLiteral): EmitterOutput<object> {
    return { type: "number", enum: [number.value] };
  }

  enumDeclaration(en: Enum, name: string): EmitterOutput<object> {
    const baseName = getOpenAPITypeName(this.emitter.getProgram(), en, this.#typeNameOptions());
    return this.#createDeclaration(en, baseName, new ObjectBuilder(this.#enumSchema(en)));
  }

  #enumSchema(en: Enum): OpenAPI3Schema {
    const program = this.emitter.getProgram();
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

    return this.#applyConstraints(en, schema);
  }

  enumMember(member: EnumMember): EmitterOutput<Record<string, any>> {
    return this.enumMemberReference(member);
  }

  enumMemberReference(member: EnumMember): EmitterOutput<Record<string, any>> {
    // would like to dispatch to the same `literal` codepaths but enum members aren't literal types
    switch (typeof member.value) {
      case "undefined":
        return { type: "string", enum: [member.name] };
      case "string":
        return { type: "string", enum: [member.value] };
      case "number":
        return { type: "number", enum: [member.value] };
    }
  }

  unionDeclaration(union: Union, name: string): EmitterOutput<object> {
    const schema = this.#unionSchema(union);
    const baseName = getOpenAPITypeName(this.emitter.getProgram(), union, this.#typeNameOptions());
    return this.#createDeclaration(union, baseName, schema);
  }

  #unionSchema(union: Union): ObjectBuilder<OpenAPI3Schema> {
    const program = this.emitter.getProgram();
    if (union.variants.size === 0) {
      reportDiagnostic(program, { code: "empty-union", target: union });
      return new ObjectBuilder({});
    }
    const variants = Array.from(union.variants.values());
    const literalVariantEnumByType: Record<string, any[]> = {};
    const ofType = getOneOf(program, union) ? "oneOf" : "anyOf";
    const schemaMembers: { schema: any; type: Type | null }[] = [];
    let nullable = false;
    const discriminator = getDiscriminator(program, union);
    const isMultipart = this.#getContentType().startsWith("multipart/");

    for (const variant of variants) {
      if (isNullType(variant.type)) {
        nullable = true;
        continue;
      }

      if (isMultipart && isBytesKeptRaw(program, variant.type)) {
        schemaMembers.push({ schema: { type: "string", format: "binary" }, type: variant.type });
        continue;
      }

      if (isLiteralType(variant.type)) {
        if (!literalVariantEnumByType[variant.type.kind]) {
          const enumValue: any[] = [variant.type.value];
          literalVariantEnumByType[variant.type.kind] = enumValue;
          schemaMembers.push({
            schema: { type: literalType(variant.type), enum: enumValue },
            type: null,
          });
        } else {
          literalVariantEnumByType[variant.type.kind].push(variant.type.value);
        }
      } else {
        const enumSchema = this.emitter.emitTypeReference(variant.type, {
          referenceContext: isMultipart ? { contentType: "application/json" } : {},
        });
        compilerAssert(enumSchema.kind === "code", "Unexpected enum schema. Should be kind: code");
        schemaMembers.push({ schema: enumSchema.value, type: variant.type });
      }
    }

    const wrapWithObjectBuilder = (
      schemaMember: { schema: any; type: Type | null },
      { mergeUnionWideConstraints }: { mergeUnionWideConstraints: boolean }
    ): ObjectBuilder<OpenAPI3Schema> => {
      // we can just return the single schema member after applying nullable
      const schema = schemaMember.schema;
      const type = schemaMember.type;
      const additionalProps: Partial<OpenAPI3Schema> = mergeUnionWideConstraints
        ? this.#applyConstraints(union, {})
        : {};

      if (mergeUnionWideConstraints && nullable) {
        additionalProps.nullable = true;
      }

      if (Object.keys(additionalProps).length === 0) {
        return new ObjectBuilder(schema);
      } else {
        if (
          (schema instanceof Placeholder || "$ref" in schema) &&
          !(type && shouldInline(program, type))
        ) {
          if (type && type.kind === "Model") {
            return new ObjectBuilder({
              type: "object",
              allOf: B.array([schema]),
              ...additionalProps,
            });
          } else {
            return new ObjectBuilder({ oneOf: B.array([schema]), ...additionalProps });
          }
        } else {
          const merged = new ObjectBuilder<OpenAPI3Schema>(schema);
          for (const [key, value] of Object.entries(additionalProps)) {
            merged.set(key, value);
          }
          return merged;
        }
      }
    };

    if (schemaMembers.length === 0) {
      if (nullable) {
        // This union is equivalent to just `null` but OA3 has no way to specify
        // null as a value, so we throw an error.
        reportDiagnostic(program, { code: "union-null", target: union });
        return new ObjectBuilder({});
      } else {
        // completely empty union can maybe only happen with bugs?
        compilerAssert(false, "Attempting to emit an empty union");
      }
    }

    if (schemaMembers.length === 1) {
      return wrapWithObjectBuilder(schemaMembers[0], { mergeUnionWideConstraints: true });
    }

    const schema: OpenAPI3Schema = {
      [ofType]: schemaMembers.map((m) =>
        wrapWithObjectBuilder(m, { mergeUnionWideConstraints: false })
      ),
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
        schema.discriminator.mapping = this.#getDiscriminatorMapping(discriminatedUnion);
      }
    }

    return this.#applyConstraints(union, schema);
  }

  #getDiscriminatorMapping(union: DiscriminatedUnion) {
    const mapping: Record<string, string> | undefined = {};
    for (const [key, model] of union.variants.entries()) {
      const ref = this.emitter.emitTypeReference(model);
      compilerAssert(ref.kind === "code", "Unexpected ref schema. Should be kind: code");
      mapping[key] = (ref.value as any).$ref;
    }
    return mapping;
  }

  unionLiteral(union: Union): EmitterOutput<object> {
    return this.#unionSchema(union);
  }

  unionVariants(union: Union): EmitterOutput<object> {
    const variants = new ArrayBuilder();
    for (const variant of union.variants.values()) {
      variants.push(this.emitter.emitType(variant));
    }
    return variants;
  }

  unionVariant(variant: UnionVariant): EmitterOutput<object> {
    return this.emitter.emitTypeReference(variant.type);
  }

  modelPropertyReference(prop: ModelProperty): EmitterOutput<object> {
    return this.modelPropertyLiteral(prop);
  }

  #attachExtensions(program: Program, type: Type, emitObject: OpenAPI3Schema) {
    // Attach any OpenAPI extensions
    const extensions = getExtensions(program, type);
    if (extensions) {
      for (const key of extensions.keys()) {
        emitObject[key] = extensions.get(key);
      }
    }
  }

  reference(
    targetDeclaration: Declaration<Record<string, unknown>>,
    pathUp: Scope<Record<string, unknown>>[],
    pathDown: Scope<Record<string, unknown>>[],
    commonScope: Scope<Record<string, unknown>> | null
  ): object | EmitEntity<Record<string, unknown>> {
    if (targetDeclaration.value instanceof Placeholder) {
      // I don't think this is possible, confirm.
      throw new Error("Can't form reference to declaration that hasn't been created yet");
    }

    // these will be undefined when creating a self-reference
    const currentSfScope = pathUp[pathUp.length - 1] as SourceFileScope<object> | undefined;
    const targetSfScope = pathDown[0] as SourceFileScope<object> | undefined;

    if (targetSfScope && currentSfScope && !targetSfScope.sourceFile.meta.shouldEmit) {
      currentSfScope.sourceFile.meta.bundledRefs.push(targetDeclaration);
    }

    return { $ref: `#/components/schemas/${targetDeclaration.name}` };
  }

  circularReference(
    target: EmitEntity<Record<string, any>>,
    scope: Scope<Record<string, any>> | undefined,
    cycle: ReferenceCycle
  ): Record<string, any> | EmitEntity<Record<string, any>> {
    if (!cycle.containsDeclaration) {
      reportDiagnostic(this.emitter.getProgram(), {
        code: "inline-cycle",
        format: {
          type: cycle.toString(),
        },
        target: cycle.first.type,
      });
      return {};
    }
    return super.circularReference(target, scope, cycle);
  }

  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<OpenAPI3Schema> {
    const isStd = this.#isStdType(scalar);
    const schema = this.#getSchemaForScalar(scalar);
    const baseName = getOpenAPITypeName(this.emitter.getProgram(), scalar, this.#typeNameOptions());

    // Don't create a declaration for std types
    return isStd ? schema : this.#createDeclaration(scalar, baseName, new ObjectBuilder(schema));
  }

  scalarInstantiation(
    scalar: Scalar,
    name: string | undefined
  ): EmitterOutput<Record<string, any>> {
    return this.#getSchemaForScalar(scalar);
  }

  tupleLiteral(tuple: Tuple): EmitterOutput<Record<string, any>> {
    return { type: "array", items: {} };
  }
  #getSchemaForScalar(scalar: Scalar): OpenAPI3Schema {
    let result: OpenAPI3Schema = {};
    const isStd = this.#isStdType(scalar);
    if (isStd) {
      result = this.#getSchemaForStdScalars(scalar);
    } else if (scalar.baseScalar) {
      result = this.#getSchemaForScalar(scalar.baseScalar);
    }
    const withDecorators = this.#applyEncoding(scalar, this.#applyConstraints(scalar, result));
    if (isStd) {
      // Standard types are going to be inlined in the spec and we don't want the description of the scalar to show up
      delete withDecorators.description;
    }
    return withDecorators;
  }

  #getSchemaForStdScalars(scalar: Scalar & { name: IntrinsicScalarName }): OpenAPI3Schema {
    return getSchemaForStdScalars(scalar, this.#options);
  }

  #applySchemaExamples(
    type: Model | Scalar | Union | Enum | ModelProperty,
    target: ObjectBuilder<unknown>
  ) {
    const program = this.emitter.getProgram();
    const examples = getExamples(program, type);
    if (examples.length > 0) {
      target.set("example", serializeValueAsJson(program, examples[0].value, type));
    }
  }

  #applyConstraints(
    type: Scalar | Model | ModelProperty | Union | Enum,
    original: OpenAPI3Schema
  ): ObjectBuilder<OpenAPI3Schema> {
    const schema = new ObjectBuilder(original);
    const program = this.emitter.getProgram();
    const applyConstraint = (fn: (p: Program, t: Type) => any, key: keyof OpenAPI3Schema) => {
      const value = fn(program, type);
      if (value !== undefined) {
        schema[key] = value;
      }
    };

    this.#applySchemaExamples(type, schema);
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
    if (!this.#isStdType(type) || type.name !== "url") {
      applyConstraint(getFormat, "format");
    }

    applyConstraint(getDoc, "description");
    applyConstraint(getSummary, "title");
    applyConstraint(
      (p: Program, t: Type) => (getDeprecated(p, t) !== undefined ? true : undefined),
      "deprecated"
    );

    this.#attachExtensions(program, type, schema);

    const values = getKnownValues(program, type as any);
    if (values) {
      return new ObjectBuilder({
        oneOf: [schema, this.#enumSchema(values)],
      });
    }

    return new ObjectBuilder<OpenAPI3Schema>(schema);
  }

  #inlineType(type: Type, schema: ObjectBuilder<any>) {
    if (this.#options.includeXTypeSpecName !== "never") {
      schema.set("x-typespec-name", getTypeName(type, this.#typeNameOptions()));
    }
    return schema;
  }

  #createDeclaration(type: Type, name: string, schema: ObjectBuilder<any>) {
    const refUrl = getRef(this.emitter.getProgram(), type);
    if (refUrl) {
      return {
        $ref: refUrl,
      };
    }

    if (shouldInline(this.emitter.getProgram(), type)) {
      return this.#inlineType(type, schema);
    }

    const title = getSummary(this.emitter.getProgram(), type);
    if (title) {
      schema.set("title", title);
    }

    const usage = this.#visibilityUsage.getUsage(type);

    const shouldAddSuffix = usage !== undefined && usage.size > 1;
    const visibility = this.#getVisibilityContext();
    const fullName =
      name + (shouldAddSuffix ? getVisibilitySuffix(visibility, Visibility.Read) : "");

    const decl = this.emitter.result.declaration(fullName, schema);

    checkDuplicateTypeName(
      this.emitter.getProgram(),
      type,
      fullName,
      Object.fromEntries(decl.scope.declarations.map((x) => [x.name, true]))
    );
    return decl;
  }

  #isStdType(type: Type): type is Scalar & { name: IntrinsicScalarName } {
    return this.emitter.getProgram().checker.isStdType(type);
  }

  #applyEncoding(
    typespecType: Scalar | ModelProperty,
    target: OpenAPI3Schema | Placeholder<OpenAPI3Schema>
  ): OpenAPI3Schema {
    return applyEncoding(this.emitter.getProgram(), typespecType, target as any, this.#options);
  }
  #mergeFormatAndEncoding(
    format: string | undefined,
    encoding: string | undefined,
    encodeAsFormat: string | undefined
  ): string | undefined {
    switch (format) {
      case undefined:
        return encodeAsFormat ?? encoding ?? format;
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

  intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<object> {
    switch (name) {
      case "unknown":
        return {};
      case "null":
        return { nullable: true };
    }

    reportDiagnostic(this.emitter.getProgram(), {
      code: "invalid-schema",
      format: { type: name },
      target: intrinsic,
    });
    return {};
  }

  programContext(program: Program): Context {
    const sourceFile = this.emitter.createSourceFile("openapi");
    return { scope: sourceFile.globalScope };
  }
}

function isLiteralType(type: Type): type is StringLiteral | NumericLiteral | BooleanLiteral {
  return type.kind === "Boolean" || type.kind === "String" || type.kind === "Number";
}

function literalType(type: StringLiteral | NumericLiteral | BooleanLiteral) {
  switch (type.kind) {
    case "String":
      return "string";
    case "Number":
      return "number";
    case "Boolean":
      return "boolean";
  }
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

export function getDefaultValue(program: Program, defaultType: Value): any {
  switch (defaultType.valueKind) {
    case "StringValue":
      return defaultType.value;
    case "NumericValue":
      return defaultType.value.asNumber() ?? undefined;
    case "BooleanValue":
      return defaultType.value;
    case "ArrayValue":
      return defaultType.values.map((x) => getDefaultValue(program, x));
    case "NullValue":
      return null;
    case "EnumValue":
      return defaultType.value.value ?? defaultType.value.name;
    default:
      reportDiagnostic(program, {
        code: "invalid-default",
        format: { type: defaultType.valueKind },
        target: defaultType,
      });
  }
}

export function isBytesKeptRaw(program: Program, type: Type) {
  return type.kind === "Scalar" && type.name === "bytes" && getEncode(program, type) === undefined;
}

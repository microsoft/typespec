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
} from "@typespec/asset-emitter";
import {
  BooleanLiteral,
  DiscriminatedUnion,
  Enum,
  EnumMember,
  IntrinsicScalarName,
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
  compilerAssert,
  explainStringTemplateNotSerializable,
  getDeprecated,
  getDiscriminatedUnionFromInheritance,
  getDiscriminator,
  getDoc,
  getFormat,
  getMaxItems,
  getMaxLength,
  getMaxValue,
  getMinItems,
  getMinLength,
  getMinValue,
  getNamespaceFullName,
  getPattern,
  getSummary,
  getTypeName,
  ignoreDiagnostics,
  isArrayModelType,
  isNeverType,
  isSecret,
  resolveEncodedName,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { MetadataInfo, Visibility, getVisibilitySuffix } from "@typespec/http";
import {
  checkDuplicateTypeName,
  getExternalDocs,
  getOpenAPITypeName,
  isReadonlyProperty,
  shouldInline,
} from "@typespec/openapi";
import { attachExtensions } from "./attach-extensions.js";
import { getOneOf, getRef } from "./decorators.js";
import { JsonSchemaModule } from "./json-schema.js";
import { OpenAPI3EmitterOptions, reportDiagnostic } from "./lib.js";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { getSchemaForStdScalars } from "./std-scalar-schemas.js";
import {
  CommonOpenAPI3Schema,
  OpenAPI3Schema,
  OpenAPI3SchemaProperty,
  OpenAPISchema3_1,
} from "./types.js";
import {
  ensureValidComponentFixedFieldKey,
  getDefaultValue,
  includeDerivedModel,
  isStdType,
} from "./util.js";
import { VisibilityUsageTracker } from "./visibility-usage.js";
import { XmlModule } from "./xml-module.js";

/**
 * Base OpenAPI3 schema emitter. Deals with emitting content of `components/schemas` section.
 */
export class OpenAPI3SchemaEmitterBase<
  Schema extends OpenAPI3Schema | OpenAPISchema3_1,
> extends TypeEmitter<Record<string, any>, OpenAPI3EmitterOptions> {
  protected _metadataInfo: MetadataInfo;
  protected _visibilityUsage: VisibilityUsageTracker;
  protected _options: ResolvedOpenAPI3EmitterOptions;
  protected _jsonSchemaModule: JsonSchemaModule | undefined;
  protected _xmlModule: XmlModule | undefined;

  constructor(
    emitter: AssetEmitter<Record<string, any>, OpenAPI3EmitterOptions>,
    metadataInfo: MetadataInfo,
    visibilityUsage: VisibilityUsageTracker,
    options: ResolvedOpenAPI3EmitterOptions,
    optionalDependencies: { jsonSchemaModule?: JsonSchemaModule; xmlModule?: XmlModule },
  ) {
    super(emitter);
    this._metadataInfo = metadataInfo;
    this._visibilityUsage = visibilityUsage;
    this._options = options;
    this._jsonSchemaModule = optionalDependencies.jsonSchemaModule;
    this._xmlModule = optionalDependencies.xmlModule;
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
    if (visibility !== Visibility.Read && !this._metadataInfo.isTransformed(type, visibility)) {
      patch.visibility = Visibility.Read;
    }
    const contentType = this.getContentType();

    if (contentType === "application/json") {
      patch.contentType = undefined;
    }

    return patch;
  }

  applyDiscriminator(type: Model, schema: Schema): void {
    const program = this.emitter.getProgram();
    const discriminator = getDiscriminator(program, type);
    if (discriminator) {
      // the decorator validates that all the variants will be a model type
      // with the discriminator field present.
      schema.discriminator = { ...discriminator };
      const discriminatedUnion = ignoreDiagnostics(
        getDiscriminatedUnionFromInheritance(type, discriminator),
      );
      if (discriminatedUnion.variants.size > 0) {
        schema.discriminator.mapping = this.getDiscriminatorMapping(discriminatedUnion.variants);
      }
    }
  }

  shouldSealSchema(model: Model): boolean {
    // when an indexer is not present, we might be able to seal it
    if (!model.indexer) {
      const derivedModels = model.derivedModels.filter(includeDerivedModel);
      return !!this._options.sealObjectSchemas && !derivedModels.length;
    }

    return isNeverType(model.indexer.value);
  }

  applyModelIndexer(schema: ObjectBuilder<any>, model: Model): void {
    const shouldSeal = this.shouldSealSchema(model);
    if (!shouldSeal && !model.indexer) return;

    // if the schema is 'sealed' the model extends another model,
    // then we need to redefine any baseModel properties
    if (shouldSeal) {
      const props = new ObjectBuilder(schema.properties ?? {});
      let baseModel = model.baseModel;
      while (baseModel) {
        const result = this.emitter.emitModelProperties(baseModel);
        baseModel = baseModel.baseModel;
        if (result.kind !== "code" || !(result.value instanceof ObjectBuilder)) continue;
        const baseProperties = result.value;
        for (const key of Object.keys(baseProperties)) {
          if (key in props) continue;
          // Here we are saying that this property will always validate as true for this schema.
          // This is because the `allOf` subSchema will contain the more specific validation
          // for this property.
          props.set(key, {});
        }
      }
      if (Object.keys(props).length > 0) {
        schema.set("properties", props);
      }
    }

    const additionalPropertiesSchema = shouldSeal
      ? { not: {} }
      : this.emitter.emitTypeReference(model.indexer!.value);
    schema.set("additionalProperties", additionalPropertiesSchema);
  }

  modelDeclaration(model: Model, _: string): EmitterOutput<object> {
    const program = this.emitter.getProgram();
    const visibility = this.#getVisibilityContext();
    const schema: ObjectBuilder<any> = new ObjectBuilder({
      type: "object",
      required: this.#requiredModelProperties(model, visibility),
      properties: this.emitter.emitModelProperties(model),
    });

    this.applyModelIndexer(schema, model);

    const derivedModels = model.derivedModels.filter(includeDerivedModel);
    // getSchemaOrRef on all children to push them into components.schemas
    for (const child of derivedModels) {
      this.emitter.emitTypeReference(child);
    }

    this.applyDiscriminator(model, schema as any);
    this.#applyExternalDocs(model, schema);

    if (model.baseModel) {
      schema.set("allOf", Builders.array([this.emitter.emitTypeReference(model.baseModel)]));
    }

    const baseName = getOpenAPITypeName(program, model, this.#typeNameOptions());
    const isMultipart = this.getContentType().startsWith("multipart/");
    const name = isMultipart ? baseName + "MultiPart" : baseName;

    return this.#createDeclaration(model, name, this.applyConstraints(model, schema as any));
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

  getContentType(): string {
    return this.emitter.getContext().contentType ?? "application/json";
  }

  modelLiteral(model: Model): EmitterOutput<object> {
    const schema = new ObjectBuilder({
      type: "object",
      properties: this.emitter.emitModelProperties(model),
      required: this.#requiredModelProperties(model, this.#getVisibilityContext()),
    });

    this.applyModelIndexer(schema, model);

    return schema;
  }

  modelInstantiation(model: Model, name: string | undefined): EmitterOutput<Record<string, any>> {
    name = name ?? getOpenAPITypeName(this.emitter.getProgram(), model, this.#typeNameOptions());
    if (!name) {
      return this.modelLiteral(model);
    }

    return this.modelDeclaration(model, name);
  }

  unionInstantiation(union: Union, name: string): EmitterOutput<Record<string, any>> {
    if (!name) {
      return this.unionLiteral(union);
    }

    return this.unionDeclaration(union, name);
  }

  arrayDeclaration(array: Model, name: string, elementType: Type): EmitterOutput<object> {
    const schema = new ObjectBuilder({
      type: "array",
      items: this.emitter.emitTypeReference(elementType),
    });

    return this.#createDeclaration(array, name, this.applyConstraints(array, schema as any));
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
      }),
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
        !this._metadataInfo.isPayloadProperty(prop, visibility, this.#ignoreMetadataAnnotations())
      ) {
        continue;
      }

      if (!this._metadataInfo.isOptional(prop, visibility)) {
        const encodedName = resolveEncodedName(
          this.emitter.getProgram(),
          prop,
          this.getContentType(),
        );

        requiredProps.push(encodedName);
      }
    }

    const discriminator = getDiscriminator(this.emitter.getProgram(), model);
    if (discriminator) {
      if (!requiredProps.includes(discriminator.propertyName)) {
        requiredProps.push(discriminator.propertyName);
      }
    }

    return requiredProps.length > 0 ? requiredProps : undefined;
  }

  modelProperties(model: Model): EmitterOutput<Record<string, OpenAPI3SchemaProperty>> {
    const program = this.emitter.getProgram();
    const props = new ObjectBuilder();
    const visibility = this.emitter.getContext().visibility;
    const contentType = this.getContentType();

    for (const prop of model.properties.values()) {
      if (isNeverType(prop.type)) {
        // If the property has a type of 'never', don't include it in the schema
        continue;
      }
      if (
        !this._metadataInfo.isPayloadProperty(prop, visibility, this.#ignoreMetadataAnnotations())
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

  getRawBinarySchema(): Schema {
    throw new Error("Method not implemented.");
  }

  modelPropertyLiteral(prop: ModelProperty): EmitterOutput<object> {
    const program = this.emitter.getProgram();

    const refSchema = this.emitter.emitTypeReference(prop.type, {
      referenceContext: {},
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

    const schema = this.applyEncoding(prop, refSchema.value as any);

    // Apply decorators on the property to the type's schema
    const additionalProps: Partial<Schema> = this.applyConstraints(
      prop,
      {} as Schema,
      schema,
    ) as any;
    if (prop.defaultValue) {
      additionalProps.default = getDefaultValue(program, prop.defaultValue, prop);
    }

    if (isReadonlyProperty(program, prop)) {
      additionalProps.readOnly = true;
    }

    // Attach any additional OpenAPI extensions
    attachExtensions(program, prop, additionalProps);

    if (schema && isRef && !(prop.type.kind === "Model" && isArrayModelType(program, prop.type))) {
      if (Object.keys(additionalProps).length === 0) {
        return schema;
      } else {
        if (additionalProps.xml?.attribute) {
          return additionalProps;
        } else {
          return {
            allOf: [schema],
            ...additionalProps,
          };
        }
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

    return this.#createDeclaration(en, baseName, new ObjectBuilder(this.enumSchema(en)));
  }

  enumSchema(en: Enum): Schema {
    // Enums are handled differently between 3.x versions due to the differences in `type`
    throw new Error("Method not implemented.");
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
    const schema = this.unionSchema(union);
    const baseName = getOpenAPITypeName(this.emitter.getProgram(), union, this.#typeNameOptions());
    return this.#createDeclaration(union, baseName, schema);
  }

  unionSchema(union: Union): ObjectBuilder<Schema> {
    // Unions are handled differently between 3.x versions
    // mostly due to how nullable properties are handled.
    throw new Error("Method not implemented.");
  }

  discriminatedUnion(union: DiscriminatedUnion): ObjectBuilder<Schema> {
    let schema: any;
    if (union.options.envelope === "none") {
      const items = new ArrayBuilder();
      for (const variant of union.variants.values()) {
        items.push(this.emitter.emitTypeReference(variant));
      }
      schema = {
        type: "object",
        oneOf: items,
        discriminator: {
          propertyName: union.options.discriminatorPropertyName,
          mapping: this.getDiscriminatorMapping(union.variants),
        },
      };
    } else {
      const envelopeVariants = new Map<string, Model>();

      for (const [name, variant] of union.variants) {
        const envelopeModel = $.model.create({
          name: union.type.name + capitalize(name),
          properties: {
            [union.options.discriminatorPropertyName]: $.modelProperty.create({
              name: union.options.discriminatorPropertyName,
              type: $.literal.createString(name),
            }),
            [union.options.envelopePropertyName]: $.modelProperty.create({
              name: union.options.envelopePropertyName,
              type: variant,
            }),
          },
        });

        envelopeVariants.set(name, envelopeModel);
      }

      const items = new ArrayBuilder();
      for (const variant of envelopeVariants.values()) {
        items.push(this.emitter.emitTypeReference(variant));
      }
      schema = {
        type: "object",
        oneOf: items,
        discriminator: {
          propertyName: union.options.discriminatorPropertyName,
          mapping: this.getDiscriminatorMapping(envelopeVariants),
        },
      };
    }

    return this.applyConstraints(union.type, schema);
  }

  getDiscriminatorMapping(variants: Map<string, Type>) {
    const mapping: Record<string, string> | undefined = {};
    for (const [key, model] of variants.entries()) {
      const ref = this.emitter.emitTypeReference(model);
      compilerAssert(ref.kind === "code", "Unexpected ref schema. Should be kind: code");
      mapping[key] = (ref.value as any).$ref;
    }
    return mapping;
  }

  unionLiteral(union: Union): EmitterOutput<object> {
    return this.unionSchema(union);
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

  reference(
    targetDeclaration: Declaration<Record<string, unknown>>,
    pathUp: Scope<Record<string, unknown>>[],
    pathDown: Scope<Record<string, unknown>>[],
    commonScope: Scope<Record<string, unknown>> | null,
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
    cycle: ReferenceCycle,
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

  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<Schema> {
    const isStd = isStdType(this.emitter.getProgram(), scalar);
    const schema = this.#getSchemaForScalar(scalar);
    const baseName = getOpenAPITypeName(this.emitter.getProgram(), scalar, this.#typeNameOptions());

    // Don't create a declaration for std types
    return isStd
      ? schema
      : (this.#createDeclaration(scalar, baseName, new ObjectBuilder(schema)) as any);
  }

  scalarInstantiation(
    scalar: Scalar,
    name: string | undefined,
  ): EmitterOutput<Record<string, any>> {
    return this.#getSchemaForScalar(scalar);
  }

  tupleLiteral(tuple: Tuple): EmitterOutput<Record<string, any>> {
    return { type: "array", items: {} };
  }
  #getSchemaForScalar(scalar: Scalar): Schema {
    let result: Schema = {} as Schema;
    const isStd = isStdType(this.emitter.getProgram(), scalar);
    if (isStd) {
      result = this.getSchemaForStdScalars(scalar);
    } else if (scalar.baseScalar) {
      result = this.#getSchemaForScalar(scalar.baseScalar);
    }
    const withDecorators = this.applyEncoding(scalar, this.applyConstraints(scalar, result) as any);
    if (isStd) {
      // Standard types are going to be inlined in the spec and we don't want the description of the scalar to show up
      delete withDecorators.description;
    }
    return withDecorators;
  }

  getSchemaForStdScalars(scalar: Scalar & { name: IntrinsicScalarName }): Schema {
    return getSchemaForStdScalars(scalar, this._options) as Schema;
  }

  applyCustomConstraints(
    type: Scalar | Model | ModelProperty | Union | Enum,
    target: Schema,
    refSchema?: Schema,
  ) {}

  applyConstraints(
    type: Scalar | Model | ModelProperty | Union | Enum,
    original: Schema,
    refSchema?: Schema,
  ): ObjectBuilder<Schema> {
    // Apply common constraints
    const schema = new ObjectBuilder<Schema>(original);
    const program = this.emitter.getProgram();
    const applyConstraint = (fn: (p: Program, t: Type) => any, key: keyof CommonOpenAPI3Schema) => {
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

    // apply json schema decorators
    const jsonSchemaModule = this._jsonSchemaModule;
    if (jsonSchemaModule) {
      applyConstraint(jsonSchemaModule.getMultipleOf, "multipleOf");
      applyConstraint(jsonSchemaModule.getUniqueItems, "uniqueItems");
      applyConstraint(jsonSchemaModule.getMinProperties, "minProperties");
      applyConstraint(jsonSchemaModule.getMaxProperties, "maxProperties");
    }

    if (isSecret(program, type)) {
      schema.format = "password";
    }

    // the stdlib applies a format of "url" but json schema wants "uri",
    // so ignore this format if it's the built-in type.
    if (!isStdType(program, type) || type.name !== "url") {
      applyConstraint(getFormat, "format");
    }

    applyConstraint(getDoc, "description");
    applyConstraint(getSummary, "title");
    applyConstraint(
      (p: Program, t: Type) => (getDeprecated(p, t) !== undefined ? true : undefined),
      "deprecated",
    );

    this.applyCustomConstraints(type, schema as any, refSchema);

    this.applyXml(type, schema as any, refSchema);
    attachExtensions(program, type, schema);

    return new ObjectBuilder<Schema>(schema);
  }

  applyXml(
    type: Scalar | Model | ModelProperty | Union | Enum,
    schema: Schema,
    refSchema?: Schema,
  ): void {
    const program = this.emitter.getProgram();

    if (this._xmlModule) {
      switch (type.kind) {
        case "Scalar":
        case "Model":
          this._xmlModule.attachXmlObjectForScalarOrModel(program, type, schema);
          break;
        case "ModelProperty":
          this._xmlModule.attachXmlObjectForModelProperty(
            program,
            this._options,
            type,
            schema,
            refSchema,
          );
          break;
      }
    }
  }

  #inlineType(type: Type, schema: ObjectBuilder<any>) {
    if (this._options.includeXTypeSpecName !== "never") {
      schema.set("x-typespec-name", getTypeName(type, this.#typeNameOptions()));
    }
    return schema;
  }

  #createDeclaration(type: Type, name: string, schema: ObjectBuilder<any>) {
    const skipNameValidation = type.kind === "Model" && type.templateMapper !== undefined;
    if (!skipNameValidation) {
      name = ensureValidComponentFixedFieldKey(this.emitter.getProgram(), type, name);
    }

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

    const usage = this._visibilityUsage.getUsage(type);

    const shouldAddSuffix = usage !== undefined && usage.size > 1;
    const visibility = this.#getVisibilityContext();
    const fullName =
      name + (shouldAddSuffix ? getVisibilitySuffix(visibility, Visibility.Read) : "");

    const decl = this.emitter.result.declaration(fullName, schema);
    checkDuplicateTypeName(
      this.emitter.getProgram(),
      type,
      fullName,
      Object.fromEntries(decl.scope.declarations.map((x) => [x.name, true])),
    );

    return decl;
  }

  applyEncoding(
    typespecType: Scalar | ModelProperty,
    target: Schema | Placeholder<Schema>,
  ): Schema {
    throw new Error("Method not implemented.");
  }

  programContext(program: Program): Context {
    const sourceFile = this.emitter.createSourceFile("openapi");
    return { scope: sourceFile.globalScope };
  }
}

export const Builders = {
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

/**
 * Simple utility function to capitalize a string.
 */
function capitalize<S extends string>(s: S) {
  return (s.slice(0, 1).toUpperCase() + s.slice(1)) as Capitalize<S>;
}

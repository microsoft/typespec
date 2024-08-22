import {
  BooleanLiteral,
  DiagnosticTarget,
  Enum,
  EnumMember,
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
  Union,
  UnionVariant,
  compilerAssert,
  emitFile,
  explainStringTemplateNotSerializable,
  getDeprecated,
  getDirectoryPath,
  getDoc,
  getFormat,
  getMaxItems,
  getMaxLength,
  getMaxValue,
  getMaxValueExclusive,
  getMinItems,
  getMinLength,
  getMinValue,
  getMinValueExclusive,
  getPattern,
  getRelativePathFromDirectory,
  getSummary,
  isArrayModelType,
  isNullType,
  isType,
  joinPaths,
} from "@typespec/compiler";
import {
  ArrayBuilder,
  Context,
  Declaration,
  EmitEntity,
  EmittedSourceFile,
  EmitterOutput,
  ObjectBuilder,
  Placeholder,
  Scope,
  SourceFile,
  SourceFileScope,
  TypeEmitter,
} from "@typespec/compiler/emitter-framework";
import { DuplicateTracker } from "@typespec/compiler/utils";
import { stringify } from "yaml";
import {
  JsonSchemaDeclaration,
  findBaseUri,
  getContains,
  getContentEncoding,
  getContentMediaType,
  getContentSchema,
  getExtensions,
  getId,
  getMaxContains,
  getMaxProperties,
  getMinContains,
  getMinProperties,
  getMultipleOf,
  getPrefixItems,
  getUniqueItems,
  isJsonSchemaDeclaration,
  isOneOf,
} from "./index.js";
import { JSONSchemaEmitterOptions, reportDiagnostic } from "./lib.js";
export class JsonSchemaEmitter extends TypeEmitter<Record<string, any>, JSONSchemaEmitterOptions> {
  #idDuplicateTracker = new DuplicateTracker<string, DiagnosticTarget>();
  #typeForSourceFile = new Map<SourceFile<any>, JsonSchemaDeclaration>();
  #refToDecl = new Map<string, Declaration<Record<string, unknown>>>();

  modelDeclaration(model: Model, name: string): EmitterOutput<object> {
    const schema = this.#initializeSchema(model, name, {
      type: "object",
      properties: this.emitter.emitModelProperties(model),
      required: this.#requiredModelProperties(model),
    });

    if (model.baseModel) {
      const allOf = new ArrayBuilder();
      allOf.push(this.emitter.emitTypeReference(model.baseModel));
      schema.set("allOf", allOf);
    }

    if (model.indexer) {
      schema.set("additionalProperties", this.emitter.emitTypeReference(model.indexer.value));
    }

    this.#applyConstraints(model, schema);
    return this.#createDeclaration(model, name, schema);
  }

  modelLiteral(model: Model): EmitterOutput<object> {
    const schema = new ObjectBuilder({
      type: "object",
      properties: this.emitter.emitModelProperties(model),
      required: this.#requiredModelProperties(model),
    });

    if (model.indexer) {
      schema.set("additionalProperties", this.emitter.emitTypeReference(model.indexer.value));
    }

    return schema;
  }

  modelInstantiation(model: Model, name: string | undefined): EmitterOutput<Record<string, any>> {
    if (!name) {
      return this.modelLiteral(model);
    }

    return this.modelDeclaration(model, name);
  }

  arrayDeclaration(array: Model, name: string, elementType: Type): EmitterOutput<object> {
    const schema = this.#initializeSchema(array, name, {
      type: "array",
      items: this.emitter.emitTypeReference(elementType),
    });

    this.#applyConstraints(array, schema);

    return this.#createDeclaration(array, name, schema);
  }

  arrayLiteral(array: Model, elementType: Type): EmitterOutput<object> {
    return new ObjectBuilder({
      type: "array",
      items: this.emitter.emitTypeReference(elementType),
    });
  }

  #requiredModelProperties(model: Model): string[] | undefined {
    const requiredProps = [];

    for (const prop of model.properties.values()) {
      if (!prop.optional) {
        requiredProps.push(prop.name);
      }
    }

    return requiredProps.length > 0 ? requiredProps : undefined;
  }

  modelProperties(model: Model): EmitterOutput<object> {
    const props = new ObjectBuilder();

    for (const [name, prop] of model.properties) {
      const result = this.emitter.emitModelProperty(prop);
      props.set(name, result);
    }

    return props;
  }

  modelPropertyLiteral(property: ModelProperty): EmitterOutput<object> {
    const propertyType = this.emitter.emitTypeReference(property.type);
    compilerAssert(propertyType.kind === "code", "Unexpected non-code result from emit reference");

    const result = new ObjectBuilder(propertyType.value);

    // eslint-disable-next-line deprecation/deprecation
    if (property.default) {
      // eslint-disable-next-line deprecation/deprecation
      result.default = this.#getDefaultValue(property.type, property.default);
    }

    if (result.anyOf && isOneOf(this.emitter.getProgram(), property)) {
      result.oneOf = result.anyOf;
      delete result.anyOf;
    }

    this.#applyConstraints(property, result);

    return result;
  }

  #getDefaultValue(type: Type, defaultType: Type): any {
    const program = this.emitter.getProgram();

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
            this.#getDefaultValue(type.values[index], defaultTupleValue)
          );
        } else {
          return defaultType.values.map((defaultTuplevalue) =>
            this.#getDefaultValue(type.indexer!.value, defaultTuplevalue)
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
      case "UnionVariant":
        return this.#getDefaultValue(type, defaultType.type);
      default:
        reportDiagnostic(program, {
          code: "invalid-default",
          format: { type: defaultType.kind },
          target: defaultType,
        });
    }
  }

  booleanLiteral(boolean: BooleanLiteral): EmitterOutput<object> {
    return { type: "boolean", const: boolean.value };
  }

  stringLiteral(string: StringLiteral): EmitterOutput<object> {
    return { type: "string", const: string.value };
  }

  stringTemplate(string: StringTemplate): EmitterOutput<object> {
    if (string.stringValue !== undefined) {
      return { type: "string", const: string.stringValue };
    }
    const diagnostics = explainStringTemplateNotSerializable(string);
    this.emitter
      .getProgram()
      .reportDiagnostics(diagnostics.map((x) => ({ ...x, severity: "warning" })));
    return { type: "string" };
  }

  numericLiteral(number: NumericLiteral): EmitterOutput<object> {
    return { type: "number", const: number.value };
  }

  enumDeclaration(en: Enum, name: string): EmitterOutput<object> {
    const enumTypes = new Set<string>();
    const enumValues = new Set<string | number>();
    for (const member of en.members.values()) {
      // ???: why do we let emitters decide what the default type of an enum is
      enumTypes.add(typeof member.value === "number" ? "number" : "string");
      enumValues.add(member.value ?? member.name);
    }

    const enumTypesArray = [...enumTypes];

    const withConstraints = this.#initializeSchema(en, name, {
      type: enumTypesArray.length === 1 ? enumTypesArray[0] : enumTypesArray,
      enum: [...enumValues],
    });
    this.#applyConstraints(en, withConstraints);
    return this.#createDeclaration(en, name, withConstraints);
  }

  enumMemberReference(member: EnumMember): EmitterOutput<Record<string, any>> {
    // would like to dispatch to the same `literal` codepaths but enum members aren't literal types
    switch (typeof member.value) {
      case "undefined":
        return { type: "string", const: member.name };
      case "string":
        return { type: "string", const: member.value };
      case "number":
        return { type: "number", const: member.value };
    }
  }

  tupleLiteral(tuple: Tuple): EmitterOutput<Record<string, any>> {
    return new ObjectBuilder({
      type: "array",
      prefixItems: this.emitter.emitTupleLiteralValues(tuple),
    });
  }

  tupleLiteralValues(tuple: Tuple): EmitterOutput<Record<string, any>> {
    const values = new ArrayBuilder();
    for (const value of tuple.values.values()) {
      values.push(this.emitter.emitType(value));
    }
    return values;
  }

  unionDeclaration(union: Union, name: string): EmitterOutput<object> {
    const key = isOneOf(this.emitter.getProgram(), union) ? "oneOf" : "anyOf";

    const withConstraints = this.#initializeSchema(union, name, {
      [key]: this.emitter.emitUnionVariants(union),
    });

    this.#applyConstraints(union, withConstraints);
    return this.#createDeclaration(union, name, withConstraints);
  }

  unionLiteral(union: Union): EmitterOutput<object> {
    const key = isOneOf(this.emitter.getProgram(), union) ? "oneOf" : "anyOf";

    return new ObjectBuilder({
      [key]: this.emitter.emitUnionVariants(union),
    });
  }

  unionVariants(union: Union): EmitterOutput<object> {
    const variants = new ArrayBuilder();
    for (const variant of union.variants.values()) {
      variants.push(this.emitter.emitType(variant));
    }
    return variants;
  }

  unionVariant(variant: UnionVariant): EmitterOutput<object> {
    const variantType = this.emitter.emitTypeReference(variant.type);
    compilerAssert(variantType.kind === "code", "Unexpected non-code result from emit reference");

    const result = new ObjectBuilder(variantType.value);

    this.#applyConstraints(variant, result);

    return result;
  }

  modelPropertyReference(property: ModelProperty): EmitterOutput<object> {
    // this is interesting - model property references will generally need to inherit
    // the relevant decorators from the property they are referencing. I wonder if this
    // could be made easier, as it's a bit subtle.

    const refSchema = this.emitter.emitTypeReference(property.type);
    compilerAssert(refSchema.kind === "code", "Unexpected non-code result from emit reference");
    const schema = new ObjectBuilder(refSchema.value);
    this.#applyConstraints(property, schema);
    return schema;
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

    if (targetDeclaration.value.$id) {
      return { $ref: targetDeclaration.value.$id };
    }

    if (!commonScope) {
      if (targetSfScope && !targetSfScope.sourceFile.meta.shouldEmit) {
        // referencing a schema which should not be emitted. In which case, it will be inlined
        // into the defs of the root schema which references this schema.
        return { $ref: "#/$defs/" + targetDeclaration.name };
      } else {
        // referencing a schema that is in a different source file, but doesn't have an id.
        // nb: this may be dead code.

        // when either targetSfScope or currentSfScope are undefined, we have a common scope
        // (i.e. we are doing a self-reference)
        const resolved = getRelativePathFromDirectory(
          getDirectoryPath(currentSfScope!.sourceFile.path),
          targetSfScope!.sourceFile.path,
          false
        );
        return { $ref: resolved };
      }
    }

    if (!currentSfScope && !targetSfScope) {
      // referencing ourself, and we don't have an id (otherwise we'd have
      // returned that above), so just return a ref.
      // This should be accurate because the only case when this can happen is if
      // the target declaration is not a root schema, and so it will be present in
      // the defs of some root schema, and there is only one level of defs.

      return { $ref: "#/$defs/" + targetDeclaration.name };
    }

    throw new Error("JSON Pointer refs to arbitrary schemas is not supported");
  }

  scalarInstantiation(
    scalar: Scalar,
    name: string | undefined
  ): EmitterOutput<Record<string, any>> {
    if (!name) {
      return this.#getSchemaForScalar(scalar);
    }

    return this.scalarDeclaration(scalar, name);
  }

  scalarInstantiationContext(scalar: Scalar, name: string | undefined): Context {
    if (name === undefined) {
      return {};
    } else {
      return this.#newFileScope(scalar);
    }
  }

  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<object> {
    const isStd = this.#isStdType(scalar);
    const schema = this.#getSchemaForScalar(scalar);
    // Don't create a declaration for std types
    if (isStd) {
      return schema;
    }

    const builderSchema = this.#initializeSchema(scalar, name, schema);
    return this.#createDeclaration(scalar, name, builderSchema);
  }

  #getSchemaForScalar(scalar: Scalar) {
    let result: any = {};
    const isStd = this.#isStdType(scalar);
    if (isStd) {
      result = this.#getSchemaForStdScalars(scalar);
    } else if (scalar.baseScalar) {
      result = this.#getSchemaForScalar(scalar.baseScalar);
    } else {
      reportDiagnostic(this.emitter.getProgram(), {
        code: "unknown-scalar",
        format: { name: scalar.name },
        target: scalar,
      });
      return {};
    }

    const objectBuilder = new ObjectBuilder(result);
    this.#applyConstraints(scalar, objectBuilder);
    if (isStd) {
      // Standard types are going to be inlined in the spec and we don't want the description of the scalar to show up
      delete objectBuilder.description;
    }
    return objectBuilder;
  }

  #getSchemaForStdScalars(baseBuiltIn: Scalar) {
    switch (baseBuiltIn.name) {
      case "uint8":
        return { type: "integer", minimum: 0, maximum: 255 };
      case "uint16":
        return { type: "integer", minimum: 0, maximum: 65535 };
      case "uint32":
        return { type: "integer", minimum: 0, maximum: 4294967295 };
      case "int8":
        return { type: "integer", minimum: -128, maximum: 127 };
      case "int16":
        return { type: "integer", minimum: -32768, maximum: 32767 };
      case "int32":
        return { type: "integer", minimum: -2147483648, maximum: 2147483647 };
      case "int64":
        const int64Strategy = this.emitter.getOptions()["int64-strategy"] ?? "string";
        if (int64Strategy === "string") {
          return { type: "string" };
        } else {
          // can't use minimum and maximum because we can't actually encode these values as literals
          // without losing precision.
          return { type: "integer" };
        }

      case "uint64":
        const uint64Strategy = this.emitter.getOptions()["int64-strategy"] ?? "string";
        if (uint64Strategy === "string") {
          return { type: "string" };
        } else {
          // can't use minimum and maximum because we can't actually encode these values as literals
          // without losing precision.
          return { type: "integer" };
        }
      case "decimal":
      case "decimal128":
        return { type: "string" };
      case "integer":
        return { type: "integer" };
      case "safeint":
        return { type: "integer" };
      case "float":
        return { type: "number" };
      case "float32":
        return { type: "number" };
      case "float64":
        return { type: "number" };
      case "numeric":
        return { type: "number" };
      case "string":
        return { type: "string" };
      case "boolean":
        return { type: "boolean" };
      case "plainDate":
        return { type: "string", format: "date" };
      case "plainTime":
        return { type: "string", format: "time" };
      case "offsetDateTime":
      case "utcDateTime":
        return { type: "string", format: "date-time" };
      case "duration":
        return { type: "string", format: "duration" };
      case "url":
        return { type: "string", format: "uri" };
      case "bytes":
        return { type: "string", contentEncoding: "base64" };
      default:
        compilerAssert(false, `Unknown built-in scalar type ${baseBuiltIn.name}`);
    }
  }

  #applyConstraints(
    type: Scalar | Model | ModelProperty | Union | UnionVariant | Enum,
    schema: ObjectBuilder<unknown>
  ) {
    const applyConstraint = (fn: (p: Program, t: Type) => any, key: string) => {
      const value = fn(this.emitter.getProgram(), type);
      if (value !== undefined) {
        schema[key] = value;
      }
    };

    const applyTypeConstraint = (fn: (p: Program, t: Type) => Type, key: string) => {
      const constraintType = fn(this.emitter.getProgram(), type);
      if (constraintType) {
        const ref = this.emitter.emitTypeReference(constraintType);
        compilerAssert(ref.kind === "code", "Unexpected non-code result from emit reference");
        schema.set(key, ref.value);
      }
    };

    applyConstraint(getMinLength, "minLength");
    applyConstraint(getMaxLength, "maxLength");
    applyConstraint(getMinValue, "minimum");
    applyConstraint(getMinValueExclusive, "exclusiveMinimum");
    applyConstraint(getMaxValue, "maximum");
    applyConstraint(getMaxValueExclusive, "exclusiveMaximum");
    applyConstraint(getPattern, "pattern");
    applyConstraint(getMinItems, "minItems");
    applyConstraint(getMaxItems, "maxItems");

    // the stdlib applies a format of "url" but json schema wants "uri",
    // so ignore this format if it's the built-in type.
    if (!this.#isStdType(type) || type.name !== "url") {
      applyConstraint(getFormat, "format");
    }

    applyConstraint(getMultipleOf, "multipleOf");
    applyTypeConstraint(getContains, "contains");
    applyConstraint(getMinContains, "minContains");
    applyConstraint(getMaxContains, "maxContains");
    applyConstraint(getUniqueItems, "uniqueItems");
    applyConstraint(getMinProperties, "minProperties");
    applyConstraint(getMaxProperties, "maxProperties");
    applyConstraint(getContentEncoding, "contentEncoding");
    applyConstraint(getContentMediaType, "contentMediaType");
    applyTypeConstraint(getContentSchema, "contentSchema");
    applyConstraint(getDoc, "description");
    applyConstraint(getSummary, "title");
    applyConstraint(
      (p: Program, t: Type) => (getDeprecated(p, t) !== undefined ? true : undefined),
      "deprecated"
    );

    const prefixItems = getPrefixItems(this.emitter.getProgram(), type);
    if (prefixItems) {
      const prefixItemsSchema = new ArrayBuilder<Record<string, unknown>>();
      for (const item of prefixItems.values) {
        prefixItemsSchema.push(this.emitter.emitTypeReference(item));
      }
      schema.set("prefixItems", prefixItemsSchema);
    }

    const extensions = getExtensions(this.emitter.getProgram(), type);
    for (const { key, value } of extensions) {
      if (this.#isTypeLike(value)) {
        schema.set(key, this.emitter.emitTypeReference(value));
      } else {
        schema.set(key, value);
      }
    }
  }

  #isTypeLike(value: any): value is Type {
    return typeof value === "object" && value !== null && isType(value);
  }

  #createDeclaration(type: JsonSchemaDeclaration, name: string, schema: ObjectBuilder<unknown>) {
    const decl = this.emitter.result.declaration(name, schema);
    const sf = (decl.scope as SourceFileScope<any>).sourceFile;
    sf.meta.shouldEmit = this.#shouldEmitRootSchema(type);
    return decl;
  }

  #initializeSchema(
    type: JsonSchemaDeclaration,
    name: string,
    props: Record<string, unknown>
  ): ObjectBuilder<unknown> {
    const rootSchemaProps = this.#shouldEmitRootSchema(type)
      ? this.#getRootSchemaProps(type, name)
      : {};

    return new ObjectBuilder({
      ...rootSchemaProps,
      ...props,
    });
  }

  #getRootSchemaProps(type: JsonSchemaDeclaration, name: string) {
    return {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: this.#getDeclId(type, name),
    };
  }

  #shouldEmitRootSchema(type: JsonSchemaDeclaration) {
    return (
      this.emitter.getOptions().emitAllRefs ||
      this.emitter.getOptions().emitAllModels ||
      isJsonSchemaDeclaration(this.emitter.getProgram(), type)
    );
  }

  #isStdType(type: Type) {
    return this.emitter.getProgram().checker.isStdType(type);
  }

  intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<object> {
    switch (intrinsic.name) {
      case "null":
        return { type: "null" };
      case "unknown":
        return {};
      case "never":
      case "void":
        return { not: {} };
      case "ErrorType":
        return {};
      default:
        const _assertNever: never = intrinsic.name;
        compilerAssert(false, "Unreachable");
    }
  }

  #reportDuplicateIds() {
    for (const [id, targets] of this.#idDuplicateTracker.entries()) {
      for (const target of targets) {
        reportDiagnostic(this.emitter.getProgram(), {
          code: "duplicate-id",
          format: { id },
          target: target,
        });
      }
    }
  }
  async writeOutput(sourceFiles: SourceFile<Record<string, any>>[]): Promise<void> {
    if (this.emitter.getOptions().noEmit) {
      return;
    }
    this.#reportDuplicateIds();
    const toEmit: EmittedSourceFile[] = [];

    const bundleId = this.emitter.getOptions().bundleId;
    if (bundleId) {
      const content = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: bundleId,
        $defs: {} as Record<string, any>,
      };
      for (const sf of sourceFiles) {
        if (sf.meta.shouldEmit) {
          content.$defs[sf.globalScope.declarations[0].name] = this.#finalizeSourceFileContent(sf);
        }
      }
      await emitFile(this.emitter.getProgram(), {
        path: joinPaths(this.emitter.getOptions().emitterOutputDir, bundleId),
        content: this.#serializeSourceFileContent(content),
      });
    } else {
      for (const sf of sourceFiles) {
        const emittedSf = await this.emitter.emitSourceFile(sf);

        // emitSourceFile will assert if somehow we have more than one declaration here
        if (sf.meta.shouldEmit) {
          toEmit.push(emittedSf);
        }
      }

      for (const emittedSf of toEmit) {
        await emitFile(this.emitter.getProgram(), {
          path: emittedSf.path,
          content: emittedSf.contents,
        });
      }
    }
  }

  sourceFile(sourceFile: SourceFile<object>): EmittedSourceFile {
    const content = this.#finalizeSourceFileContent(sourceFile);

    return {
      contents: this.#serializeSourceFileContent(content),
      path: sourceFile.path,
    };
  }

  #finalizeSourceFileContent(sourceFile: SourceFile<object>): Record<string, any> {
    const decls = sourceFile.globalScope.declarations;
    compilerAssert(decls.length === 1, "Multiple decls in single schema per file mode");
    const content: Record<string, any> = { ...decls[0].value };
    const bundledDecls = new Set<Declaration<object>>();

    if (sourceFile.meta.bundledRefs.length > 0) {
      // bundle any refs, including refs of refs
      content.$defs = {};
      const refsToBundle: Declaration<object>[] = [...sourceFile.meta.bundledRefs];
      while (refsToBundle.length > 0) {
        const decl = refsToBundle.shift()!;
        if (bundledDecls.has(decl)) {
          // already $def'd, no need to def it again.
          continue;
        }
        bundledDecls.add(decl);
        content.$defs[decl.name] = decl.value;

        // all scopes are source file scopes in this emitter
        const refSf = (decl.scope as SourceFileScope<any>).sourceFile;
        refsToBundle.push(...refSf.meta.bundledRefs);
      }
    }

    return content;
  }

  #serializeSourceFileContent(content: Record<string, any>): string {
    if (this.emitter.getOptions()["file-type"] === "json") {
      return JSON.stringify(content, null, 4);
    } else {
      return stringify(content, {
        aliasDuplicateObjects: false,
        lineWidth: 0,
      });
    }
  }

  #getCurrentSourceFile() {
    let scope: Scope<object> = this.emitter.getContext().scope;
    compilerAssert(scope, "Scope should exists");

    while (scope && scope.kind !== "sourceFile") {
      scope = scope.parentScope;
    }
    compilerAssert(scope, "Top level scope should be a source file");

    return scope.sourceFile;
  }

  #getDeclId(type: JsonSchemaDeclaration, name: string): string {
    const baseUri = findBaseUri(this.emitter.getProgram(), type);
    const explicitId = getId(this.emitter.getProgram(), type);
    if (explicitId) {
      return this.#trackId(idWithBaseURI(explicitId, baseUri), type);
    }

    // generate the ID based on the file path
    const base = this.emitter.getOptions().emitterOutputDir;
    const file = this.#getCurrentSourceFile().path;
    const relative = getRelativePathFromDirectory(base, file, false);

    if (baseUri) {
      return this.#trackId(new URL(relative, baseUri).href, type);
    } else {
      return this.#trackId(relative, type);
    }

    function idWithBaseURI(id: string, baseUri: string | undefined): string {
      if (baseUri) {
        return new URL(id, baseUri).href;
      } else {
        return id;
      }
    }
  }

  #trackId(id: string, target: DiagnosticTarget) {
    this.#idDuplicateTracker.track(id, target);
    return id;
  }

  // #region context emitters
  modelDeclarationContext(model: Model, name: string): Context {
    if (this.#isStdType(model) && (model.name as any) === "object") {
      return {};
    }

    return this.#newFileScope(model);
  }

  modelInstantiationContext(model: Model, name: string | undefined): Context {
    if (name === undefined) {
      return {};
    } else {
      return this.#newFileScope(model);
    }
  }

  arrayDeclarationContext(array: Model): Context {
    return this.#newFileScope(array);
  }

  enumDeclarationContext(en: Enum): Context {
    return this.#newFileScope(en);
  }

  unionDeclarationContext(union: Union): Context {
    return this.#newFileScope(union);
  }

  scalarDeclarationContext(scalar: Scalar): Context {
    if (this.#isStdType(scalar)) {
      return {};
    } else {
      return this.#newFileScope(scalar);
    }
  }

  #newFileScope(type: JsonSchemaDeclaration) {
    const sourceFile = this.emitter.createSourceFile(
      `${this.declarationName(type)}.${this.#fileExtension()}`
    );

    sourceFile.meta.shouldEmit = true;
    sourceFile.meta.bundledRefs = [];

    this.#typeForSourceFile.set(sourceFile, type);
    return {
      scope: sourceFile.globalScope,
    };
  }

  #fileExtension() {
    return this.emitter.getOptions()["file-type"] === "json" ? "json" : "yaml";
  }

  // #endregion
}

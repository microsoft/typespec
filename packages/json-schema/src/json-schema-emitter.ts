import {
  BooleanLiteral,
  compilerAssert,
  emitFile,
  Enum,
  EnumMember,
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
  IntrinsicType,
  isArrayModelType,
  isNullType,
  Model,
  ModelProperty,
  NumericLiteral,
  Program,
  Scalar,
  StringLiteral,
  StringTemplate,
  stringTemplateToString,
  Tuple,
  Type,
  typespecTypeToJson,
  Union,
  UnionVariant,
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
import { stringify } from "yaml";
import {
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
  JsonSchemaDeclaration,
} from "./index.js";
import { JSONSchemaEmitterOptions, reportDiagnostic } from "./lib.js";
export class JsonSchemaEmitter extends TypeEmitter<Record<string, any>, JSONSchemaEmitterOptions> {
  #seenIds = new Set();
  #typeForSourceFile = new Map<SourceFile<any>, JsonSchemaDeclaration>();
  #refToDecl = new Map<string, Declaration<Record<string, unknown>>>();

  modelDeclaration(model: Model, name: string): EmitterOutput<object> {
    const schema = new ObjectBuilder({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: this.#getDeclId(model, name),
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
    const schema = new ObjectBuilder({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: this.#getDeclId(array, name),
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

    if (propertyType.kind !== "code") {
      throw new Error("Unexpected non-code result from emit reference");
    }

    const result = new ObjectBuilder(propertyType.value);

    if (property.default) {
      result.default = this.#getDefaultValue(property.type, property.default);
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
    const [value, diagnostics] = stringTemplateToString(string);
    if (diagnostics.length > 0) {
      this.emitter
        .getProgram()
        .reportDiagnostics(diagnostics.map((x) => ({ ...x, severity: "warning" })));
      return { type: "string" };
    }
    return { type: "string", const: value };
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

    const withConstraints = new ObjectBuilder({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: this.#getDeclId(en, name),
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
    const withConstraints = new ObjectBuilder({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: this.#getDeclId(union, name),
      anyOf: this.emitter.emitUnionVariants(union),
    });

    this.#applyConstraints(union, withConstraints);
    return this.#createDeclaration(union, name, withConstraints);
  }

  unionLiteral(union: Union): EmitterOutput<object> {
    this.emitter.getProgram().resolveTypeReference("Cadl.Foo");
    return new ObjectBuilder({
      anyOf: this.emitter.emitUnionVariants(union),
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
    return this.emitter.emitTypeReference(variant.type);
  }

  modelPropertyReference(property: ModelProperty): EmitterOutput<object> {
    // this is interesting - model property references will generally need to inherit
    // the relevant decorators from the property they are referencing. I wonder if this
    // could be made easier, as it's a bit subtle.

    const refSchema = this.emitter.emitTypeReference(property.type);
    if (refSchema.kind !== "code") {
      throw new Error("Unexpected non-code result from emit reference");
    }
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
      // when either targetSfScope or currentSfScope are undefined, we have a common scope
      // (i.e. we are doing a self-reference)
      const resolved = getRelativePathFromDirectory(
        getDirectoryPath(currentSfScope!.sourceFile.path),
        targetSfScope!.sourceFile.path,
        false
      );
      return { $ref: resolved };
    }

    throw new Error("$ref to $defs not yet supported.");
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
    if (this.emitter.getOptions().bundleId) {
      return {};
    } else if (name === undefined) {
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

    const builderSchema = new ObjectBuilder({
      ...schema,
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: this.#getDeclId(scalar, name),
    });
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
      throw new Error(`Can't emit custom scalar type ${scalar.name}`);
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
        throw new Error("Unknown scalar type " + baseBuiltIn.name);
    }
  }

  #applyConstraints(
    type: Scalar | Model | ModelProperty | Union | Enum,
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
        if (ref.kind !== "code") {
          throw new Error("Couldn't get reference to contains type");
        }
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
    for (const extension of extensions) {
      // todo: fix up when we have an authoritative way to ask "am I an instantiation of that template"
      if (
        extension.value.kind === "Model" &&
        extension.value.name === "Json" &&
        extension.value.namespace?.name === "JsonSchema"
      ) {
        // we check in a decorator
        schema.set(
          extension.key,
          typespecTypeToJson(extension.value.properties.get("value")!.type, null as any)[0]
        );
      } else {
        schema.set(extension.key, this.emitter.emitTypeReference(extension.value));
      }
    }
  }

  #createDeclaration(type: JsonSchemaDeclaration, name: string, schema: ObjectBuilder<unknown>) {
    const decl = this.emitter.result.declaration(name, schema);
    if (!this.emitter.getOptions().bundleId && !this.emitter.getOptions().emitAllRefs) {
      const declSf = this.emitter.getContext().scope.sourceFile;
      declSf.meta.shouldEmit = isJsonSchemaDeclaration(this.emitter.getProgram(), type);
    }

    return decl;
  }

  #isStdType(type: Type) {
    return this.emitter.getProgram().checker.isStdType(type);
  }

  intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<object> {
    switch (name) {
      case "null":
        return { type: "null" };
      case "unknown":
        return {};
      case "never":
      case "void":
        return { not: {} };
    }

    throw new Error("Unknown intrinsic type " + name);
  }

  async writeOutput(sourceFiles: SourceFile<Record<string, any>>[]): Promise<void> {
    const toEmit: EmittedSourceFile[] = [];

    for (const sf of sourceFiles) {
      const emittedSf = await this.emitter.emitSourceFile(sf);

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

  sourceFile(sourceFile: SourceFile<object>): EmittedSourceFile {
    let serializedContent: string;
    const decls = sourceFile.globalScope.declarations;

    let content: Record<string, any>;
    if (this.emitter.getOptions().bundleId) {
      const base = this.emitter.getOptions().emitterOutputDir;
      const file = sourceFile.path;
      const id = getRelativePathFromDirectory(base, file, false);
      content = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: id,
        $defs: decls.reduce(
          (prev, decl) => {
            prev[decl.name] = decl.value;
            return prev;
          },
          {} as Record<string, any>
        ),
      };
    } else {
      if (decls.length > 1) {
        throw new Error("Emit error - multiple decls in single schema per file mode");
      }

      content = { ...decls[0].value };

      if (sourceFile.meta.bundledRefs.length > 0) {
        // bundle any refs, including refs of refs
        content.$defs = {};
        const refsToBundle: Declaration<object>[] = [...sourceFile.meta.bundledRefs];
        while (refsToBundle.length > 0) {
          const decl = refsToBundle.shift()!;
          content.$defs[decl.name] = decl.value;

          // all scopes are source file scopes in this emitter
          const refSf = (decl.scope as SourceFileScope<any>).sourceFile;
          refsToBundle.push(...refSf.meta.bundledRefs);
        }
      }
    }

    if (this.emitter.getOptions()["file-type"] === "json") {
      serializedContent = JSON.stringify(content, null, 4);
    } else {
      serializedContent = stringify(content, {
        aliasDuplicateObjects: false,
        lineWidth: 0,
      });
    }

    return {
      contents: serializedContent,
      path: sourceFile.path,
    };
  }

  #getCurrentSourceFile() {
    let scope: Scope<object> = this.emitter.getContext().scope;
    if (!scope) throw new Error("need scope");

    while (scope && scope.kind !== "sourceFile") {
      scope = scope.parentScope;
    }

    if (!scope) throw new Error("Didn't find source file scope");

    return scope.sourceFile;
  }

  #getDeclId(type: JsonSchemaDeclaration, name: string): string {
    const baseUri = findBaseUri(this.emitter.getProgram(), type);
    const explicitId = getId(this.emitter.getProgram(), type);
    if (explicitId) {
      return this.#checkForDuplicateId(idWithBaseURI(explicitId, baseUri));
    }

    // generate an id
    if (this.emitter.getOptions().bundleId) {
      if (!type.name) {
        throw new Error("Type needs a name to emit a declaration id");
      }
      return this.#checkForDuplicateId(idWithBaseURI(name, baseUri));
    } else {
      // generate the ID based on the file path
      const base = this.emitter.getOptions().emitterOutputDir;
      const file = this.#getCurrentSourceFile().path;
      const relative = getRelativePathFromDirectory(base, file, false);

      if (baseUri) {
        return this.#checkForDuplicateId(new URL(relative, baseUri).href);
      } else {
        return this.#checkForDuplicateId(relative);
      }
    }

    function idWithBaseURI(id: string, baseUri: string | undefined): string {
      if (baseUri) {
        return new URL(id, baseUri).href;
      } else {
        return id;
      }
    }
  }

  #checkForDuplicateId(id: string) {
    if (this.#seenIds.has(id)) {
      throw new Error(`Duplicate id: ${id}`);
    }

    this.#seenIds.add(id);
    return id;
  }

  // #region context emitters
  programContext(program: Program): Context {
    if (this.emitter.getOptions().bundleId) {
      const sourceFile = this.emitter.createSourceFile(this.emitter.getOptions().bundleId!);
      sourceFile.meta.shouldEmit = true;
      return { scope: sourceFile.globalScope };
    } else {
      return {};
    }
  }
  modelDeclarationContext(model: Model, name: string): Context {
    if (this.emitter.getOptions().bundleId) {
      return {};
    } else {
      if (this.#isStdType(model) && model.name === "object") {
        return {};
      }

      return this.#newFileScope(model);
    }
  }

  modelInstantiationContext(model: Model, name: string | undefined): Context {
    if (this.emitter.getOptions().bundleId) {
      return {};
    } else if (name === undefined) {
      return {};
    } else {
      return this.#newFileScope(model);
    }
  }

  arrayDeclarationContext(array: Model): Context {
    if (this.emitter.getOptions().bundleId) {
      return {};
    } else {
      return this.#newFileScope(array);
    }
  }

  enumDeclarationContext(en: Enum): Context {
    if (this.emitter.getOptions().bundleId) {
      return {};
    } else {
      return this.#newFileScope(en);
    }
  }

  unionDeclarationContext(union: Union): Context {
    if (this.emitter.getOptions().bundleId) {
      return {};
    } else {
      return this.#newFileScope(union);
    }
  }

  scalarDeclarationContext(scalar: Scalar): Context {
    if (this.emitter.getOptions().bundleId) {
      return {};
    } else if (this.#isStdType(scalar)) {
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

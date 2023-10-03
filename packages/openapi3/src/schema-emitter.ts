import {
  BooleanLiteral,
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
  IntrinsicScalarName,
  IntrinsicType,
  Model,
  ModelProperty,
  NumericLiteral,
  Program,
  Scalar,
  StringLiteral,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";
import {
  ArrayBuilder,
  Context,
  Declaration,
  EmitEntity,
  EmitterOutput,
  ObjectBuilder,
  Placeholder,
  Scope,
  SourceFileScope,
  TypeEmitter,
} from "@typespec/compiler/emitter-framework";
import { getExtensions } from "@typespec/openapi";
import { OpenAPI3Schema } from "./types.js";

export interface OpenAPI3SchemaEmitterOptions {}
export class OpenAPI3SchemaEmitter extends TypeEmitter<
  Record<string, any>,
  OpenAPI3SchemaEmitterOptions
> {
  modelDeclaration(model: Model, name: string): EmitterOutput<object> {
    const schema = new ObjectBuilder({
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
    const result = this.emitter.emitTypeReference(property.type);

    if (result.kind !== "code") {
      throw new Error("Unexpected non-code result from emit reference");
    }

    const withConstraints = new ObjectBuilder(result.value);
    this.#applyConstraints(property, withConstraints);

    return withConstraints;
  }

  booleanLiteral(boolean: BooleanLiteral): EmitterOutput<object> {
    return { type: "boolean", enum: [boolean.value] };
  }

  stringLiteral(string: StringLiteral): EmitterOutput<object> {
    return { type: "string", enum: [string.value] };
  }

  numericLiteral(number: NumericLiteral): EmitterOutput<object> {
    return { type: "number", enum: [number.value] };
  }

  enumDeclaration(en: Enum, name: string): EmitterOutput<object> {
    const enumTypes = new Set<string>();
    const enumValues = new Set<string | number>();
    for (const member of en.members.values()) {
      // ???: why do we let emitters decide what the default type of an enum is
      enumTypes.add(member.value ? typeof member.value : "string");
      enumValues.add(member.value ?? member.name);
    }

    const enumTypesArray = [...enumTypes];

    const withConstraints = new ObjectBuilder({
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

  unionDeclaration(union: Union, name: string): EmitterOutput<object> {
    const withConstraints = new ObjectBuilder({
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

  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<object> {
    const baseBuiltIn = this.#scalarBuiltinBaseType(scalar);

    if (baseBuiltIn === undefined) {
      return new ObjectBuilder({});
    }

    const schema = this.#getSchemaForStdScalars(baseBuiltIn);

    const builderSchema = new ObjectBuilder(schema);

    // avoid creating declarations for built-in TypeSpec types
    if (baseBuiltIn === scalar) {
      return builderSchema;
    }

    this.#applyConstraints(scalar, builderSchema);
    return this.#createDeclaration(scalar, name, builderSchema);
  }

  #getSchemaForStdScalars(scalar: Scalar & { name: IntrinsicScalarName }): OpenAPI3Schema {
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

    applyConstraint(getMinLength, "minLength");
    applyConstraint(getMaxLength, "maxLength");
    applyConstraint(getMinValue, "minimum");
    applyConstraint(getMinValueExclusive, "exclusiveMinimum");
    applyConstraint(getMaxValue, "maximum");
    applyConstraint(getMaxValueExclusive, "exclusiveMinimum");
    applyConstraint(getPattern, "pattern");
    applyConstraint(getMinItems, "minItems");
    applyConstraint(getMaxItems, "maxItems");

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

    const extensions = getExtensions(this.emitter.getProgram(), type);
    for (const [key, value] of Object.entries(extensions)) {
      schema.set(key, value);
    }
  }

  #scalarBuiltinBaseType(scalar: Scalar): (Scalar & { name: IntrinsicScalarName }) | undefined {
    let current = scalar;
    while (current.baseScalar && !this.#isStdType(current)) {
      current = current.baseScalar;
    }

    if (this.#isStdType(current)) {
      return current;
    }

    return undefined;
  }

  #createDeclaration(type: Type, name: string, schema: ObjectBuilder<unknown>) {
    const decl = this.emitter.result.declaration(name, schema);
    return decl;
  }

  #isStdType(type: Type): type is Scalar & { name: IntrinsicScalarName } {
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

  programContext(program: Program): Context {
    const sourceFile = this.emitter.createSourceFile("openapi");
    return { scope: sourceFile.globalScope };
  }
}

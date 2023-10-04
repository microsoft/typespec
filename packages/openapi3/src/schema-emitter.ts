import {
  BooleanLiteral,
  compilerAssert,
  Enum,
  EnumMember,
  getDeprecated,
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
  getPattern,
  getSummary,
  IntrinsicScalarName,
  IntrinsicType,
  isArrayModelType,
  isNullType,
  isSecret,
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
import { getExtensions, isReadonlyProperty } from "@typespec/openapi";
import { getOneOf } from "./decorators.js";
import { reportDiagnostic } from "./lib.js";
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

  modelPropertyLiteral(prop: ModelProperty): EmitterOutput<object> {
    const program = this.emitter.getProgram();
    const description = getDoc(program, prop);

    const refSchema = this.emitter.emitTypeReference(prop.type);
    if (refSchema.kind !== "code") {
      throw new Error("Unexpected non-code result from emit reference");
    }

    const schema = this.#applyEncoding(prop, refSchema.value as any);
    // Apply decorators on the property to the type's schema
    const additionalProps: Partial<OpenAPI3Schema> = this.#applyConstraints(prop, {});
    if (description) {
      additionalProps.description = description;
    }

    if (prop.default) {
      additionalProps.default = this.#getDefaultValue(prop.type, prop.default);
    }

    if (isReadonlyProperty(program, prop)) {
      additionalProps.readOnly = true;
    }

    // Attach any additional OpenAPI extensions
    this.#attachExtensions(program, prop, additionalProps);

    if (schema && "$ref" in schema) {
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

      return { ...schema, ...additionalProps };
    }
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
    return this.#createDeclaration(en, name, this.#enumSchema(en));
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

  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<OpenAPI3Schema> {
    const isStd = this.#isStdType(scalar);
    const schema = this.#getSchemaForScalar(scalar);
    // Don't create a declaration for std types
    return isStd ? schema : this.#createDeclaration(scalar, name, schema);
  }

  scalarInstantiation(
    scalar: Scalar,
    name: string | undefined
  ): EmitterOutput<Record<string, any>> {
    return this.#getSchemaForScalar(scalar);
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
    original: OpenAPI3Schema
  ): OpenAPI3Schema {
    const schema = { ...original };
    const program = this.emitter.getProgram();
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
      return {
        oneOf: [schema, this.#enumSchema(values)],
      };
    }

    return schema;
  }

  #createDeclaration(type: Type, name: string, schema: OpenAPI3Schema) {
    const decl = this.emitter.result.declaration(name, schema);
    return decl;
  }

  #isStdType(type: Type): type is Scalar & { name: IntrinsicScalarName } {
    return this.emitter.getProgram().checker.isStdType(type);
  }

  #applyEncoding(typespecType: Scalar | ModelProperty, target: OpenAPI3Schema): OpenAPI3Schema {
    const encodeData = getEncode(this.emitter.getProgram(), typespecType);
    if (encodeData) {
      const newTarget = { ...target };
      const newType = this.#getSchemaForStdScalars(encodeData.type as any);

      newTarget.type = newType.type;
      // If the target already has a format it takes priority. (e.g. int32)
      newTarget.format = this.#mergeFormatAndEncoding(
        newTarget.format,
        encodeData.encoding,
        newType.format
      );
      return newTarget;
    }
    return target;
  }
  #mergeFormatAndEncoding(
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

import {
  BooleanLiteral,
  Enum,
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
  Declaration,
  EmitEntity,
  EmittedSourceFile,
  EmitterOutput,
  ObjectBuilder,
  Scope,
  SourceFile,
  SourceFileScope,
  TypeEmitter,
} from "@typespec/compiler/emitter-framework";
import yaml from "js-yaml";
import path from "path";
import relateurl from "relateurl";
import { pathToFileURL } from "url";
import { getMultipleOf } from "./index.js";
import { JSONSchemaEmitterOptions } from "./lib.js";

export class JsonSchemaEmitter extends TypeEmitter<Record<string, any>, JSONSchemaEmitterOptions> {
  modelDeclaration(model: Model, name: string): EmitterOutput<object> {
    if (this.emitter.getProgram().checker.isStdType(model) && model.name === "object") {
      return { type: "object" };
    }

    const schema = new ObjectBuilder({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: this.#getDeclId(),
      type: "object",
      properties: this.emitter.emitModelProperties(model),
      required: this.#requiredModelProperties(model),
    });

    if (model.baseModel) {
      const allOf = new ArrayBuilder();
      allOf.push(this.emitter.emitTypeReference(model.baseModel));
      schema.set("allOf", allOf);
    }

    return this.emitter.result.declaration(name, schema);
  }

  modelLiteral(model: Model): EmitterOutput<object> {
    if (this.emitter.getProgram().checker.isStdType(model) && model.name === "object") {
      return { type: "object" };
    }

    return {
      type: "object",
      properties: this.emitter.emitModelProperties(model),
      required: this.#requiredModelProperties(model),
    };
  }

  modelInstantiation(model: Model, name: string): EmitterOutput<Record<string, any>> {
    return this.modelDeclaration(model, name);
  }

  arrayDeclaration(array: Model, name: string, elementType: Type): EmitterOutput<object> {
    return this.emitter.result.declaration(
      name,
      new ObjectBuilder({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: this.#getDeclId(),
        type: "array",
        items: this.emitter.emitTypeReference(elementType),
      })
    );
  }

  arrayLiteral(array: Model, elementType: Type): EmitterOutput<object> {
    return new ObjectBuilder({
      type: "array",
      items: this.emitter.emitTypeReference(elementType),
    });
  }

  #requiredModelProperties(model: Model): string[] | undefined {
    const reqs = [];

    for (const prop of model.properties.values()) {
      if (!prop.optional) {
        reqs.push(prop.name);
      }
    }

    return reqs.length > 0 ? reqs : undefined;
  }

  modelProperties(model: Model): EmitterOutput<object> {
    let props = new ObjectBuilder();

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

    return this.emitter.result.declaration(
      name,
      new ObjectBuilder({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: this.#getDeclId(),
        type: enumTypesArray.length === 1 ? enumTypesArray[0] : enumTypesArray,
        enum: [...enumValues],
      })
    );
  }

  unionDeclaration(union: Union, name: string): EmitterOutput<object> {
    return this.emitter.result.declaration(
      name,
      new ObjectBuilder({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: this.#getDeclId(),
        anyOf: this.emitter.emitUnionVariants(union),
      })
    );
  }

  unionLiteral(union: Union): EmitterOutput<object> {
    this.emitter.getProgram().resolveTypeReference("Cadl.Foo");
    return new ObjectBuilder({
      anyOf: this.emitter.emitUnionVariants(union),
    });
  }

  unionVariants(union: Union): EmitterOutput<object> {
    let variants = new ArrayBuilder();
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
    targetDeclaration: Declaration<object>,
    pathUp: Scope<object>[],
    pathDown: Scope<object>[],
    commonScope: Scope<object> | null
  ): object | EmitEntity<object> {
    if (!commonScope) {
      let currentSfScope = pathUp[pathUp.length - 1] as SourceFileScope<object>;
      let targetSfScope = pathDown[0] as SourceFileScope<object>;
      const resolved = path.relative(
        path.dirname(currentSfScope.sourceFile.path),
        targetSfScope.sourceFile.path
      );
      return { $ref: resolved };
    }

    throw new Error("$ref to $defs not yet supported.");
  }

  scalarDeclaration(scalar: Scalar, name: string): EmitterOutput<object> {
    const baseBuiltIn = this.#scalarBuiltinBaseType(scalar);

    if (baseBuiltIn === null) {
      throw new Error(`Can't emit custom scalar type ${scalar.name}`);
    }

    let schema: Record<string, any>;
    switch (baseBuiltIn.name) {
      case "uint8":
        schema = { type: "integer", minimum: 0, maximum: 255 };
        break;
      case "uint16":
        schema = { type: "integer", minimum: 0, maximum: 65535 };
        break;
      case "uint32":
        schema = { type: "integer", minimum: 0, maximum: 4294967295 };
        break;
      case "int8":
        schema = { type: "integer", minimum: -128, maximum: 127 };
        break;
      case "int16":
        schema = { type: "integer", minimum: -32768, maximum: 32767 };
        break;
      case "int32":
        schema = { type: "integer", minimum: -2147483648, maximum: 2147483647 };
        break;
      case "int64":
        const int64Strategy = this.emitter.getOptions()["int64-strategy"] ?? "string";
        if (int64Strategy === "string") {
          schema = { type: "string" };
        } else {
          schema = { type: "integer", minimum: 0, maximum: 18446744073709551615 };
        }
        break;
      case "uint64":
        const uint64Strategy = this.emitter.getOptions()["int64-strategy"] ?? "string";
        if (uint64Strategy === "string") {
          schema = { type: "string" };
        } else {
          schema = { type: "integer", minimum: -9223372036854775808, maximum: 9223372036854775807 };
        }
        break;
      case "integer":
        schema = { type: "integer" };
        break;
      case "safeint":
        schema = { type: "integer" };
        break;
      case "float":
        schema = { type: "number" };
        break;
      case "float32":
        schema = { type: "number" };
        break;
      case "float64":
        schema = { type: "number" };
        break;
      case "numeric":
        schema = { type: "number" };
        break;
      case "string":
        schema = { type: "string" };
        break;
      case "boolean":
        schema = { type: "boolean" };
        break;
      case "plainDate":
        schema = { type: "string", format: "date" };
        break;
      case "plainTime":
        schema = { type: "string", format: "time" };
        break;
      case "zonedDateTime":
        schema = { type: "string", format: "date-time" };
        break;
      case "duration":
        schema = { type: "string", format: "duration" };
        break;
      case "url":
        schema = { type: "string", format: "uri" };
        break;
      case "bytes":
        schema = { type: "string", contentEncoding: "base64" };
        break;
      default:
        throw new Error("Unknown scalar type " + baseBuiltIn.name);
    }

    this.#applyConstraints(scalar, schema);

    if (baseBuiltIn === scalar) {
      return schema;
    }

    return this.emitter.result.declaration(name, schema);
  }

  #applyConstraints(type: Scalar | Model | ModelProperty, schema: Record<string, any>) {
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
    applyConstraint(getFormat, "format");
    applyConstraint(getMultipleOf, "multipleOf");
  }

  #scalarBuiltinBaseType(scalar: Scalar): Scalar | null {
    let current = scalar;
    while (current.baseScalar && !this.#isStdType(current)) {
      current = current.baseScalar;
    }

    if (this.#isStdType(current)) {
      return current;
    }

    return null;
  }

  #isStdType(type: Type) {
    return this.emitter.getProgram().checker.isStdType(type);
  }

  intrinsic(intrinsic: IntrinsicType, name: string): EmitterOutput<object> {
    switch (name) {
      case "null":
        return { type: "null" };
    }

    throw new Error("Unknown intrinsic type " + name);
  }

  sourceFile(sourceFile: SourceFile<object>): EmittedSourceFile {
    let contents: string;
    if (this.emitter.getOptions()["file-type"] === "json") {
      contents = JSON.stringify(sourceFile.globalScope.declarations[0].value, null, 4);
    } else {
      contents = yaml.dump(sourceFile.globalScope.declarations[0].value);
    }
    return {
      contents,
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

  #getDeclId() {
    const base = pathToFileURL(this.emitter.getOptions().emitterOutputDir);
    const file = pathToFileURL(this.#getCurrentSourceFile().path);
    return relateurl.relate(base.href + "/", file.href);
  }
}

// better way to do this?
function isSomeInt64Subtype(program: Program, type: Type) {
  if (type.kind !== "Scalar") return;
  const base = scalarBaseType(type);
  if (program.checker.isStdType(base) && (base.name === "int64" || base.name === "uint64")) {
    return true;
  }

  return false;
}

function scalarBaseType(scalar: Scalar): Scalar {
  let current = scalar;
  while (current.baseScalar) {
    current = current.baseScalar;
  }

  return current;
}

import {
  BooleanLiteral,
  Enum,
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
} from "@cadl-lang/compiler";
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
} from "@cadl-lang/compiler/emitter-framework";
import yaml from "js-yaml";
import path from "path";
import relateurl from "relateurl";
import { pathToFileURL } from "url";
import { JSONSchemaEmitterOptions } from "./lib.js";

export class JsonSchemaEmitter extends TypeEmitter<object, JSONSchemaEmitterOptions> {
  modelDeclaration(model: Model, name: string): EmitterOutput<object> {
    if (this.emitter.getProgram().checker.isStdType(model) && model.name === "object") {
      return { type: "object" };
    }

    return this.emitter.result.declaration(
      name,
      new ObjectBuilder({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: this.#getDeclId(),
        type: "object",
        properties: this.emitter.emitModelProperties(model),
        required: this.#requiredModelProperties(model),
      })
    );
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
    return result;
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
    // horrible.
    if (this.emitter.getProgram().checker.isStdType(scalar)) {
      switch (name) {
        case "uint8":
        case "uint16":
        case "uint32":
        case "int8":
        case "int16":
        case "int32":
        case "integer":
        case "safeint":
          return { type: "integer" };
        case "float":
        case "float32":
        case "float64":
        case "numeric":
          return { type: "number" };
        case "string":
          return { type: "string" };
        case "boolean":
          return { type: "boolean" };
        case "uint64":
        case "int64":
          const strategy = this.emitter.getOptions()["int64-strategy"] ?? "string";
          return { type: strategy };
        case "plainDate":
          return { type: "string", format: "date" };
        case "plainTime":
          return { type: "string", format: "time" };
        case "zonedDateTime":
          return { type: "string", format: "date-time" };
        case "duration":
          return { type: "string", format: "duration" };
        case "url":
          return { type: "string", format: "uri" };
        case "bytes":
          return { type: "string", contentEncoding: "base64" };
      }
    }

    throw new Error("Can't emit custom scalars");
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

  // there is probably a more pedant way to do this.
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
}

function scalarBaseType(scalar: Scalar): Scalar {
  let current = scalar;
  while (current.baseScalar) {
    current = current.baseScalar;
  }

  return current;
}

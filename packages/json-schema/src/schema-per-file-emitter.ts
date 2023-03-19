import { Enum, Model, Scalar, Type, Union } from "@typespec/compiler";
import { Context } from "@typespec/compiler/emitter-framework";
import { JsonSchemaEmitter } from "./json-schema-emitter.js";

export class SchemaPerFileEmitter extends JsonSchemaEmitter {
  modelDeclarationContext(model: Model, name: string): Context {
    // horrible
    if (this.emitter.getProgram().checker.isStdType(model) && model.name === "object") {
      return {};
    }

    return this.#newFileScope(model.name);
  }

  arrayDeclarationContext(array: Model): Context {
    return this.#newFileScope(array.name);
  }

  enumDeclarationContext(en: Enum): Context {
    return this.#newFileScope(en.name);
  }

  unionDeclarationContext(union: Union): Context {
    return this.#newFileScope(union.name!);
  }

  scalarDeclarationContext(scalar: Scalar): Context {
    if (this.#isStdType(scalar)) {
      return {};
    }

    return this.#newFileScope(scalar.name);
  }

  #isStdType(type: Type) {
    return this.emitter.getProgram().checker.isStdType(type);
  }

  #newFileScope(name: string) {
    const extension = this.emitter.getOptions()["file-type"] === "json" ? "json" : "yaml";
    const sourceFile = this.emitter.createSourceFile(`${name}.${extension}`);
    return {
      scope: sourceFile.globalScope,
    };
  }
}

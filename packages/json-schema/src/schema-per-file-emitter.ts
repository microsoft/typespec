import { Enum, Model, Union } from "@cadl-lang/compiler";
import { Context } from "@cadl-lang/compiler/emitter-framework";
import { JsonSchemaEmitter } from "./json-schema-emitter.js";

export class SchemaPerFileEmitter extends JsonSchemaEmitter {
  modelDeclarationContext(model: Model, name: string): Context {
    // horrible
    if (this.emitter.getProgram().checker.isStdType(model) && model.name === "object") {
      return {};
    }

    return this.#newFileScope(model.name);
  }

  enumDeclarationContext(en: Enum): Context {
    return this.#newFileScope(en.name);
  }

  unionDeclarationContext(union: Union): Context {
    return this.#newFileScope(union.name!);
  }

  #newFileScope(name: string) {
    const extension = this.emitter.getOptions()["file-type"] === "json" ? "json" : "yaml";
    const sourceFile = this.emitter.createSourceFile(`${name}.${extension}`);
    return {
      scope: sourceFile.globalScope,
    };
  }
}

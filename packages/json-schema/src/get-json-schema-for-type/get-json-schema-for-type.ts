import { createAssetEmitter } from "@typespec/asset-emitter";
import type { Program, Type } from "@typespec/compiler";
import { JsonSchemaEmitter } from "../json-schema-emitter.js";

// TODO: add docs
export function getJsonSchemaForType(program: Program, type: Type) {
  const cls = class extends JsonSchemaEmitter {
    constructor(emitter: any) {
      super(emitter, {
        noDeclarations: true, // Always inline references for this function
      });
    }
  };
  const emitter = createAssetEmitter(program, cls, { options: {} } as any);
  const result = emitter.emitType(type);

  switch (result.kind) {
    case "code":
      return render(result.value);
    case "declaration":
      return render(result.value);
    case "circular":
    case "none":
      throw new Error("Unexpected result kind from JsonSchemaEmitter");
  }
}

/** Render down object and array builder produced by Asset emitter */
function render(value: unknown): string {
  return JSON.parse(JSON.stringify(value));
}

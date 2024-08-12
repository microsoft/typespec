import { EmitContext, Enum, Model, Scalar, Union } from "@typespec/compiler";
import { createAssetEmitter } from "@typespec/compiler/emitter-framework";
import { getJsonSchemaTypes } from "./decorators.js";
import { JsonSchemaEmitter } from "./json-schema-emitter.js";
import { JSONSchemaEmitterOptions } from "./lib.js";

export { JsonSchemaEmitter } from "./json-schema-emitter.js";
export { $flags, $lib, EmitterOptionsSchema, JSONSchemaEmitterOptions } from "./lib.js";

export const namespace = "TypeSpec.JsonSchema";
export type JsonSchemaDeclaration = Model | Union | Enum | Scalar;

export async function $onEmit(context: EmitContext<JSONSchemaEmitterOptions>) {
  const emitter = createAssetEmitter(context.program, JsonSchemaEmitter as any, context);

  if (emitter.getOptions().emitAllModels) {
    emitter.emitProgram({ emitTypeSpecNamespace: false });
  } else {
    for (const item of getJsonSchemaTypes(context.program)) {
      emitter.emitType(item);
    }
  }

  await emitter.writeOutput();
}

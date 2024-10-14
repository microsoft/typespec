import type { EmitContext, Enum, Model, Scalar, Union } from "@typespec/compiler";
import { createAssetEmitter } from "@typespec/compiler/emitter-framework";
import { getJsonSchemaTypes } from "./decorators.js";
import { JsonSchemaEmitter } from "./json-schema-emitter.js";
import type { JSONSchemaEmitterOptions } from "./lib.js";
export { $flags, $lib, EmitterOptionsSchema, type JSONSchemaEmitterOptions } from "./lib.js";

export const namespace = "TypeSpec.JsonSchema";
export type JsonSchemaDeclaration = Model | Union | Enum | Scalar;

/**
 * Internal: TypeSpec emitter entry point
 */
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

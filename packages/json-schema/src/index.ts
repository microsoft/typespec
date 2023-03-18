import { EmitContext } from "@typespec/compiler";
import "./lib.js";
import { JSONSchemaEmitterOptions } from "./lib.js";
import { SchemaPerFileEmitter } from "./schema-per-file-emitter.js";

export async function $onEmit(context: EmitContext<JSONSchemaEmitterOptions>) {
  const emitter = context.getAssetEmitter(SchemaPerFileEmitter);

  emitter.emitProgram();
  await emitter.writeOutput();
}

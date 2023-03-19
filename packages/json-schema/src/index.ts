import { DecoratorContext, EmitContext, Model, Namespace, Program, Type } from "@typespec/compiler";
import "./lib.js";
import { createStateSymbol, JSONSchemaEmitterOptions } from "./lib.js";
import { SchemaPerFileEmitter } from "./schema-per-file-emitter.js";

export const namespace = "JsonSchema";

const jsonSchemaKey = createStateSymbol("JsonSchema");

export async function $onEmit(context: EmitContext<JSONSchemaEmitterOptions>) {
  const emitter = context.getAssetEmitter(SchemaPerFileEmitter);

  for (const item of context.program.stateSet(jsonSchemaKey)) {
    emitter.emitType(item);
  }

  await emitter.writeOutput();
}

export function $JsonSchema(context: DecoratorContext, target: Namespace | Model) {
  context.program.stateSet(jsonSchemaKey).add(target);
}

export function getJsonSchemaTypes(program: Program): (Namespace | Model)[] {
  return [...(program.stateSet(jsonSchemaKey) || [])] as (Namespace | Model)[];
}
const multipleOfKey = createStateSymbol("JsonSchema.multipleOf");
export function $multipleOf(context: DecoratorContext, target: Model, value: number) {
  context.program.stateMap(multipleOfKey).set(target, value);
}

export function getMultipleOf(program: Program, target: Type) {
  return program.stateMap(multipleOfKey).get(target);
}

import {
  DecoratorContext,
  EmitContext,
  Enum,
  Model,
  Namespace,
  Program,
  Scalar,
  Type,
  Union,
} from "@typespec/compiler";
import { JsonSchemaEmitter } from "./json-schema-emitter.js";
import "./lib.js";
import { createStateSymbol, JSONSchemaEmitterOptions } from "./lib.js";

export const namespace = "JsonSchema";
export type JsonSchemaDeclaration = Model | Union | Enum | Scalar;

const jsonSchemaKey = createStateSymbol("JsonSchema");

export async function $onEmit(context: EmitContext<JSONSchemaEmitterOptions>) {
  const emitter = context.getAssetEmitter(JsonSchemaEmitter);

  for (const item of getJsonSchemaTypes(context.program)) {
    emitter.emitType(item);
  }

  await emitter.writeOutput();
}

export function $JsonSchema(
  context: DecoratorContext,
  target: JsonSchemaDeclaration | Namespace,
  baseUriOrId?: string
) {
  context.program.stateSet(jsonSchemaKey).add(target);
  if (baseUriOrId) {
    if (target.kind === "Namespace") {
      context.call($baseUri, target, baseUriOrId);
    } else {
      context.call($id, target, baseUriOrId);
    }
  }
}

const baseUriKey = createStateSymbol("JsonSchema.baseURI");
export function $baseUri(context: DecoratorContext, target: Namespace, baseUri: string) {
  context.program.stateMap(baseUriKey).set(target, baseUri);
}

export function getBaseUri(program: Program, target: Type) {
  return program.stateMap(baseUriKey).get(target);
}

export function findBaseUri(
  program: Program,
  target: JsonSchemaDeclaration | Namespace
): string | undefined {
  let baseUrl: string | undefined;
  let current: JsonSchemaDeclaration | Namespace | undefined = target;
  do {
    baseUrl = getBaseUri(program, current);
    current = current.namespace;
  } while (!baseUrl && current);

  return baseUrl;
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

const idKey = createStateSymbol("JsonSchema.id");
export function $id(
  context: DecoratorContext,
  target: Model | Union | Enum | Scalar,
  value: string
) {
  context.program.stateMap(idKey).set(target, value);
}

export function getId(program: Program, target: Type) {
  return program.stateMap(idKey).get(target);
}

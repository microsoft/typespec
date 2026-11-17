import type {
  DecoratorContext,
  Model,
  ModelProperty,
  Program,
  Type,
  Union,
} from "@typespec/compiler";
import type { OneOfDecorator, UseRefDecorator } from "../generated-defs/TypeSpec.OpenAPI.js";
import { createStateSymbol, reportDiagnostic } from "./lib.js";

const refTargetsKey = createStateSymbol("refs");
/** Implements `@useRef`, substituting an external schema reference for an emitted model or property. */
export const $useRef: UseRefDecorator = (
  context: DecoratorContext,
  entity: Model | ModelProperty,
  refUrl: string,
) => {
  context.program.stateMap(refTargetsKey).set(entity, refUrl);
};

/** Returns the reference recorded by `@useRef` for this exact target, or undefined if none was set. */
export function getRef(program: Program, entity: Type): string | undefined {
  return program.stateMap(refTargetsKey).get(entity);
}

const oneOfKey = createStateSymbol("oneOf");
/** Implements `@oneOf`, requesting exactly-one rather than at-least-one matching for a union schema. */
export const $oneOf: OneOfDecorator = (
  context: DecoratorContext,
  entity: Union | ModelProperty,
) => {
  if (entity.kind === "ModelProperty" && entity.type.kind !== "Union") {
    reportDiagnostic(context.program, {
      code: "oneof-union",
      target: context.decoratorTarget,
    });
  }
  context.program.stateMap(oneOfKey).set(entity, true);
};

/** Looks up the `@oneOf` marker on this exact target; test its truthiness when choosing union composition. */
export function getOneOf(program: Program, entity: Type): boolean {
  return program.stateMap(oneOfKey).get(entity);
}

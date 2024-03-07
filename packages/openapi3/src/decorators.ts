import { DecoratorContext, Model, ModelProperty, Program, Type, Union } from "@typespec/compiler";
import { createStateSymbol, reportDiagnostic } from "./lib.js";

const refTargetsKey = createStateSymbol("refs");
export function $useRef(
  context: DecoratorContext,
  entity: Model | ModelProperty,
  refUrl: string
): void {
  context.program.stateMap(refTargetsKey).set(entity, refUrl);
}

export function getRef(program: Program, entity: Type): string | undefined {
  return program.stateMap(refTargetsKey).get(entity);
}

const oneOfKey = createStateSymbol("oneOf");
export function $oneOf(context: DecoratorContext, entity: Union | ModelProperty) {
  if (entity.kind === "ModelProperty" && entity.type.kind !== "Union") {
    reportDiagnostic(context.program, {
      code: "oneof-union",
      target: context.decoratorTarget,
    });
  }
  context.program.stateMap(oneOfKey).set(entity, true);
}

export function getOneOf(program: Program, entity: Type): boolean {
  return program.stateMap(oneOfKey).get(entity);
}

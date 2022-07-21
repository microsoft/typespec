import { DecoratorContext, Program, Type, validateDecoratorTarget } from "@cadl-lang/compiler";

const refTargetsKey = Symbol("refs");
export function $useRef(context: DecoratorContext, entity: Type, refUrl: string): void {
  if (!validateDecoratorTarget(context, entity, "@useRef", ["Model", "ModelProperty"])) {
    return;
  }

  context.program.stateMap(refTargetsKey).set(entity, refUrl);
}

export function getRef(program: Program, entity: Type): string | undefined {
  return program.stateMap(refTargetsKey).get(entity);
}

const oneOfKey = Symbol("oneOf");
export function $oneOf(context: DecoratorContext, entity: Type) {
  if (!validateDecoratorTarget(context, entity, "@oneOf", "Union")) {
    return;
  }
  context.program.stateMap(oneOfKey).set(entity, true);
}

export function getOneOf(program: Program, entity: Type): boolean {
  return program.stateMap(oneOfKey).get(entity);
}

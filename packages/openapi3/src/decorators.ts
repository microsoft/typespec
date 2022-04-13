import {
  DecoratorContext,
  Program,
  setDecoratorNamespace,
  Type,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";

const refTargetsKey = Symbol("refs");
export function $useRef({ program }: DecoratorContext, entity: Type, refUrl: string): void {
  if (!validateDecoratorTarget(program, entity, "@useRef", ["Model", "ModelProperty"])) {
    return;
  }

  program.stateMap(refTargetsKey).set(entity, refUrl);
}

export function getRef(program: Program, entity: Type): string | undefined {
  return program.stateMap(refTargetsKey).get(entity);
}

const oneOfKey = Symbol("oneOf");
export function $oneOf({ program }: DecoratorContext, entity: Type) {
  if (!validateDecoratorTarget(program, entity, "@oneOf", "Union")) {
    return;
  }
  program.stateMap(oneOfKey).set(entity, true);
}

export function getOneOf(program: Program, entity: Type): boolean {
  return program.stateMap(oneOfKey).get(entity);
}

setDecoratorNamespace("OpenAPI", $useRef, $oneOf);

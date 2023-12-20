import { DecoratorContext, Operation, Program } from "@typespec/compiler";
import { createStateSymbol, reportDiagnostic } from "./lib.js";

export const namespace = "LibraryTs";

const alternateNameKey = createStateSymbol("alternateName");
export function $alternateName(context: DecoratorContext, target: Operation, name: string) {
  if (name === "banned") {
    reportDiagnostic(context.program, {
      code: "banned-alternate-name",
      target: context.getArgumentTarget(0)!,
      format: { name },
    });
  }
  context.program.stateMap(alternateNameKey).set(target, name);
}

export function getAlternateName(program: Program, target: Operation): string | undefined {
  return program.stateMap(alternateNameKey).get(target);
}

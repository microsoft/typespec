import { DecoratorContext, isErrorModel, Model, Type } from "@typespec/compiler";
import { createStateSymbol, reportDiagnostic } from "./lib.js";
import { getResourceTypeKey } from "./resource.js";

export const namespace = "TypeSpec.Rest.Private";

const validatedMissingKey = createStateSymbol("validatedMissing");
// Workaround for the lack of template constraints https://github.com/microsoft/typespec/issues/377
export function $validateHasKey(context: DecoratorContext, target: Type, value: Model) {
  if (context.program.stateSet(validatedMissingKey).has(value)) {
    return;
  }
  const resourceKey = getResourceTypeKey(context.program, value);
  if (resourceKey === undefined) {
    reportDiagnostic(context.program, {
      code: "resource-missing-key",
      format: { modelName: value.name },
      target: value,
    });
    context.program.stateSet(validatedMissingKey).add(value);
  }
}

const validatedErrorKey = createStateSymbol("validatedError");
// Workaround for the lack of template constraints https://github.com/microsoft/typespec/issues/377
export function $validateIsError(context: DecoratorContext, target: Type, value: Model) {
  if (context.program.stateSet(validatedErrorKey).has(value)) {
    return;
  }
  const isError = isErrorModel(context.program, value);
  if (!isError) {
    reportDiagnostic(context.program, {
      code: "resource-missing-error",
      format: { modelName: value.name },
      target: value,
    });
    context.program.stateSet(validatedErrorKey).add(value);
  }
}

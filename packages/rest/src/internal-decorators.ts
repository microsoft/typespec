import { DecoratorContext, getTypeName, isErrorModel, Type } from "@typespec/compiler";
import { ValidateHasKeyDecorator, ValidateIsErrorDecorator } from "../generated-defs/decorators.js";
import { createStateSymbol, reportDiagnostic } from "./lib.js";
import { getResourceTypeKey } from "./resource.js";

export const namespace = "TypeSpec.Rest.Private";

const validatedMissingKey = createStateSymbol("validatedMissing");
// Workaround for the lack of template constraints https://github.com/microsoft/typespec/issues/377
export const $validateHasKey: ValidateHasKeyDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type
) => {
  if (context.program.stateSet(validatedMissingKey).has(value)) {
    return;
  }
  const resourceKey = value.kind === "Model" && getResourceTypeKey(context.program, value);
  if (resourceKey === undefined) {
    reportDiagnostic(context.program, {
      code: "resource-missing-key",
      format: { modelName: getTypeName(value) },
      target: value,
    });
    context.program.stateSet(validatedMissingKey).add(value);
  }
};

const validatedErrorKey = createStateSymbol("validatedError");
// Workaround for the lack of template constraints https://github.com/microsoft/typespec/issues/377
export const $validateIsError: ValidateIsErrorDecorator = (
  context: DecoratorContext,
  target: Type,
  value: Type
) => {
  if (context.program.stateSet(validatedErrorKey).has(value)) {
    return;
  }
  const isError = value.kind === "Model" && isErrorModel(context.program, value);
  if (!isError) {
    reportDiagnostic(context.program, {
      code: "resource-missing-error",
      format: { modelName: getTypeName(value) },
      target: value,
    });
    context.program.stateSet(validatedErrorKey).add(value);
  }
};

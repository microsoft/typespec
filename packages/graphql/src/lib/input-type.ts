import type { DecoratorContext, DecoratorFunction, Model } from "@typespec/compiler";

export const $inputType: DecoratorFunction = (_context: DecoratorContext, _target: Model) => {};

export function isInputType(model: Model): boolean {
  return model.decorators.some((d) => d.decorator === $inputType);
}

export function setInputType(model: Model): void {
  if (model.decorators.some((d) => d.decorator === $inputType)) return;
  model.decorators.push({ decorator: $inputType, args: [] });
}

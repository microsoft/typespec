import type { DecoratorContext, DecoratorFunction, Model } from "@typespec/compiler";
import { NAMESPACE } from "../lib.js";

// This will set the namespace for decorators implemented in this file
export const namespace = NAMESPACE;

/**
 * Decorator implementation for `@oneOf`.
 *
 * No-op — the decorator's presence on the type's `decorators` array is the
 * signal. No additional state storage is needed.
 */
export const $oneOf: DecoratorFunction = (
  _context: DecoratorContext,
  _target: Model,
) => {};

/**
 * Check if a model has been marked as a @oneOf input object.
 * These are synthetic models created by the union mutation when a union
 * is used in input context — GraphQL unions are output-only, so input
 * unions become @oneOf input objects.
 */
export function isOneOf(model: Model): boolean {
  return model.decorators.some((d) => d.decorator === $oneOf);
}

/**
 * Mark a model as a @oneOf input object.
 */
export function setOneOf(model: Model): void {
  if (model.decorators.some((d) => d.decorator === $oneOf)) return;
  model.decorators.push({ decorator: $oneOf, args: [] });
}

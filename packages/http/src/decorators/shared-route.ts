import type { DecoratorContext, Operation, Program } from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import { SharedRouteDecorator } from "../../generated-defs/TypeSpec.Http.js";
import { HttpStateKeys } from "../lib.js";

const [getSharedRoute, setSharedRouteFor] = useStateMap(HttpStateKeys.sharedRoutes);

export function setSharedRoute(program: Program, operation: Operation) {
  setSharedRouteFor(program, operation, true);
}

export function isSharedRoute(program: Program, operation: Operation): boolean {
  return getSharedRoute(program, operation) === true;
}

/**
 * `@sharedRoute` marks the operation as sharing a route path with other operations.
 *
 * When an operation is marked with `@sharedRoute`, it enables other operations to share the same
 * route path as long as those operations are also marked with `@sharedRoute`.
 *
 * `@sharedRoute` can only be applied directly to operations.
 */
export const $sharedRoute: SharedRouteDecorator = (
  context: DecoratorContext,
  entity: Operation,
) => {
  setSharedRoute(context.program, entity);
};

import {
  validateDecoratorUniqueOnNode,
  type DecoratorContext,
  type Interface,
  type Namespace,
  type Operation,
} from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import { RouteDecorator } from "../../generated-defs/TypeSpec.Http.js";
import { setSharedRoute } from "../index.js";
import { HttpStateKeys, reportDiagnostic } from "../lib.js";
import type { RoutePath } from "../types.js";

const [getRouteState, setRouteState] = useStateMap<Operation | Interface | Namespace, string>(
  HttpStateKeys.routes,
);

// export { setRoute };

/**
 * `@route` defines the relative route URI for the target operation
 *
 * The first argument should be a URI fragment that may contain one or more path parameter fields.
 * If the namespace or interface that contains the operation is also marked with a `@route` decorator,
 * it will be used as a prefix to the route URI of the operation.
 *
 * `@route` can only be applied to operations, namespaces, and interfaces.
 */
export const $route: RouteDecorator = (
  context: DecoratorContext,
  entity: Operation | Namespace | Interface,
  path: string,
) => {
  validateDecoratorUniqueOnNode(context, entity, $route);

  setRoute(context, entity, {
    path,
    shared: false,
  });
};

export function setRoute(
  context: DecoratorContext,
  entity: Operation | Namespace | Interface,
  details: RoutePath,
) {
  const existingPath: string | undefined = getRouteState(context.program, entity);
  if (existingPath && entity.kind === "Namespace") {
    if (existingPath !== details.path) {
      reportDiagnostic(context.program, {
        code: "duplicate-route-decorator",
        messageId: "namespace",
        target: entity,
      });
    }
  } else {
    setRouteState(context.program, entity, details.path);
    if (entity.kind === "Operation" && details.shared) {
      setSharedRoute(context.program, entity);
    }
  }
}

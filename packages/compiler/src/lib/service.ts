import { ServiceDecorator } from "../../generated-defs/TypeSpec.js";
import { validateDecoratorUniqueOnNode } from "../core/decorator-utils.js";
import { Type, getTypeName, reportDeprecated } from "../core/index.js";
import { reportDiagnostic } from "../core/messages.js";
import type { Program } from "../core/program.js";
import { DecoratorContext, Namespace } from "../core/types.js";
import { useStateMap } from "./utils.js";

export interface ServiceDetails {
  title?: string;
  /** @deprecated Service version is deprecated. If wanting to describe a service versioning you can use the `@typespec/versioning` library. If wanting to describe the project version you can use the package.json version */
  version?: string;
}

export interface Service extends ServiceDetails {
  type: Namespace;
}

const [getService, setService, getServiceMap] = useStateMap<Namespace, Service>(
  Symbol.for("@typespec/compiler.services"),
);

/**
 * List all the services defined in the TypeSpec program
 * @param program Program
 * @returns List of service.
 */
export function listServices(program: Program): Service[] {
  return [...getServiceMap(program).values()];
}

export {
  /**
   * Get the service information for the given namespace.
   * @param program Program
   * @param namespace Service namespace
   * @returns Service information or undefined if namespace is not a service namespace.
   */
  getService,
};

/**
 * Check if the namespace is defined as a service.
 * @param program Program
 * @param namespace Namespace
 * @returns Boolean
 */
export function isService(program: Program, namespace: Namespace): boolean {
  return getServiceMap(program).has(namespace);
}

/**
 * Mark the given namespace as a service.
 * @param program Program
 * @param namespace Namespace
 * @param details Service details
 */
export function addService(
  program: Program,
  namespace: Namespace,
  details: ServiceDetails = {},
): void {
  const serviceMap = getServiceMap(program);
  const existing = serviceMap.get(namespace) ?? {};
  setService(program, namespace, { ...existing, ...details, type: namespace });
}

export const $service: ServiceDecorator = (
  context: DecoratorContext,
  target: Namespace,
  options?: Type,
) => {
  validateDecoratorUniqueOnNode(context, target, $service);

  if (options && options.kind !== "Model") {
    reportDiagnostic(context.program, {
      code: "invalid-argument",
      format: { value: options.kind, expected: "Model" },
      target: context.getArgumentTarget(0)!,
    });
    return;
  }
  const serviceDetails: ServiceDetails = {};
  const title = options?.properties.get("title")?.type;
  const versionProp = options?.properties.get("version");
  if (title) {
    if (title.kind === "String") {
      serviceDetails.title = title.value;
    } else {
      reportDiagnostic(context.program, {
        code: "unassignable",
        format: { sourceType: getTypeName(title), targetType: "String" },
        target: context.getArgumentTarget(0)!,
      });
    }
  }
  if (versionProp) {
    const version = versionProp.type;
    reportDeprecated(
      context.program,
      "version: property is deprecated in @service. If wanting to describe a service versioning you can use the `@typespec/versioning` library. If wanting to describe the project version you can use the package.json version.",
      versionProp,
    );
    if (version.kind === "String") {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      serviceDetails.version = version.value;
    } else {
      reportDiagnostic(context.program, {
        code: "unassignable",
        format: { sourceType: getTypeName(version), targetType: "String" },
        target: context.getArgumentTarget(0)!,
      });
    }
  }

  addService(context.program, target, serviceDetails);
};

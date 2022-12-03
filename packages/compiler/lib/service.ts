import { validateDecoratorTarget, validateDecoratorUniqueOnNode } from "../core/decorator-utils.js";
import { getNamespaceFullName, getTypeName, reportDeprecated } from "../core/index.js";
import { reportDiagnostic } from "../core/messages.js";
import { Program } from "../core/program.js";
import { DecoratorContext, Model, Namespace, Type } from "../core/types.js";

export interface ServiceDetails {
  title?: string;
  version?: string;
}

export interface Service extends ServiceDetails {
  type: Namespace;
}

const serviceDetailsKey = Symbol.for("@cadl-lang/compiler.services");
function getServiceMap(program: Program): Map<Namespace, Service> {
  return program.stateMap(serviceDetailsKey) as Map<Namespace, Service>;
}

/**
 * List all the services defined in the cadl program
 * @param program Program
 * @returns List of service.
 */
export function listServices(program: Program): Service[] {
  return [...getServiceMap(program).values()];
}

/**
 * Get the service information for the given namespace.
 * @param program Program
 * @param namespace Service namespace
 * @returns Service information or undefined if namespace is not a service namespace.
 */
export function getService(program: Program, namespace: Namespace): Service | undefined {
  return getServiceMap(program).get(namespace);
}

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
  details: ServiceDetails = {}
): void {
  const serviceMap = getServiceMap(program);
  const existing = serviceMap.get(namespace) ?? {};
  serviceMap.set(namespace, { ...existing, ...details, type: namespace });
}

export function $service(context: DecoratorContext, target: Namespace, options?: Model) {
  validateDecoratorUniqueOnNode(context, target, $service);

  const serviceDetails: ServiceDetails = {};
  const title = options?.properties.get("title")?.type;
  const version = options?.properties.get("version")?.type;
  if (title) {
    if (title.kind === "String") {
      serviceDetails.title = title.value;
    } else {
      reportDiagnostic(context.program, {
        code: "unassignable",
        format: { value: getTypeName(title), targetType: "String" },
        target: context.getArgumentTarget(0)!,
      });
    }
  }
  if (version) {
    if (version.kind === "String") {
      serviceDetails.version = version.value;
    } else {
      reportDiagnostic(context.program, {
        code: "unassignable",
        format: { value: getTypeName(version), targetType: "String" },
        target: context.getArgumentTarget(0)!,
      });
    }
  }

  addService(context.program, target, serviceDetails);
}

/**
 * @deprecated use `@service` instead
 */
export function $serviceTitle(context: DecoratorContext, target: Type, title: string) {
  reportDeprecated(
    context.program,
    "@serviceTitle decorator has been deprecated use @service({title: _}) instead.",
    context.decoratorTarget
  );
  if (!validateDecoratorTarget(context, target, "@serviceTitle", "Namespace")) {
    return;
  }

  addService(context.program, target, { title });
}

/**
 * @deprecated use `@service` instead
 */
export function $serviceVersion(context: DecoratorContext, target: Type, version: string) {
  reportDeprecated(
    context.program,
    "@serviceVersion decorator has been deprecated use @service({title: _}) instead.",
    context.decoratorTarget
  );
  if (!validateDecoratorTarget(context, target, "@serviceVersion", "Namespace")) {
    return;
  }

  addService(context.program, target, { version });
}

// #region deprecated
/** @deprecated use @see listServices() or @see getService() */
export function getServiceNamespace(program: Program): Namespace {
  return listServices(program)[0]?.type ?? program.getGlobalNamespaceType();
}

/** @deprecated use @see listServices() or @see getService() */
export function getServiceTitle(program: Program): string {
  return listServices(program)[0]?.title ?? `(title)`;
}
/** @deprecated use @see listServices() or @see getService() */
export function getServiceVersion(program: Program): string {
  return listServices(program)[0]?.version ?? `0000-00-00`;
}

/** @deprecated use @see listServices() or @see getService() */
export function getServiceNamespaceString(program: Program): string | undefined {
  return getNamespaceFullName(getServiceNamespace(program));
}

/** @deprecated use @see addService */
export function setServiceNamespace(program: Program, namespace: Namespace): void {
  addService(program, namespace);
}
// #endregion

import { validateDecoratorTarget } from "../core/decorator-utils.js";
import { reportDeprecated } from "../core/index.js";
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

export function listServices(program: Program): Service[] {
  return [...getServiceMap(program).values()];
}

export function getService(program: Program, namespace: Namespace): Service | undefined {
  return getServiceMap(program).get(namespace);
}

export function isService(program: Program, namespace: Namespace): boolean {
  return getServiceMap(program).has(namespace);
}

export function setServiceNamespace(
  program: Program,
  namespace: Namespace,
  options: ServiceDetails = {}
): void {
  const serviceMap = getServiceMap(program);
  const existing = serviceMap.get(namespace) ?? {};
  serviceMap.set(namespace, { ...existing, ...options, type: namespace });
}

export function $service(context: DecoratorContext, target: Namespace, options?: Model) {
  const serviceDetails: ServiceDetails = {};
  const title = options?.properties.get("title")?.type;
  const version = options?.properties.get("version")?.type;
  if (title) {
    if (title.kind === "String") {
      serviceDetails.title = title.value;
    } else {
      reportDiagnostic(context.program, {
        code: "unassignable",
        format: { value: context.program.checker.getTypeName(title), targetType: "String" },
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
        format: { value: context.program.checker.getTypeName(version), targetType: "String" },
        target: context.getArgumentTarget(0)!,
      });
    }
  }

  setServiceNamespace(context.program, target, serviceDetails);
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

  setServiceNamespace(context.program, target, { title });
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

  setServiceNamespace(context.program, target, { version });
}

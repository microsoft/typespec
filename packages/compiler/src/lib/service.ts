import type { ServiceDecorator, ServiceOptions } from "../../generated-defs/TypeSpec.js";
import { validateDecoratorUniqueOnNode } from "../core/decorator-utils.js";
import type { Program } from "../core/program.js";
import type { DecoratorContext, Namespace } from "../core/types.js";
import { Realm } from "../experimental/realm.js";
import { useStateMap } from "../utils/index.js";

/** Optional descriptive metadata used when registering or updating a service namespace. */
export interface ServiceDetails {
  /** Human-readable service title; no title is synthesized when omitted. */
  title?: string;
}

/** A registered service namespace and its descriptive metadata. */
export interface Service extends ServiceDetails {
  /** Namespace that defines this service, not a model or operation within it. */
  type: Namespace;
}

const [
  /**
   * Get the service information for the given namespace.
   * @param program Program
   * @param namespace Service namespace
   * @returns Service information or undefined if namespace is not a service namespace.
   */
  getService,
  setService,
  getServiceMap,
] = useStateMap<Namespace, Service>(Symbol.for("@typespec/compiler.services"));

/**
 * Lists services in registration order, excluding namespace clones owned by a realm.
 * Returns a new array containing the stored service records.
 * @param program Program
 * @returns List of service.
 */
export function listServices(program: Program): Service[] {
  return [...getServiceMap(program).values()].filter((x) => !Realm.realmForType.has(x.type));
}

export { getService };

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
 * Registers the namespace as a service, merging supplied details over any existing record.
 * Omitted details preserve existing values; the namespace is always retained as the service's `type`.
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

/** Marks a namespace as a service and merges its optional descriptive metadata into the service registry. */
export const $service: ServiceDecorator = (
  context: DecoratorContext,
  target: Namespace,
  options?: ServiceOptions,
) => {
  validateDecoratorUniqueOnNode(context, target, $service);
  addService(context.program, target, options);
};

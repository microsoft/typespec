import { validateDecoratorTarget } from "../core/decorator-utils.js";
import { createDiagnostic } from "../core/messages.js";
import { Program } from "../core/program.js";
import { DecoratorContext, Namespace, Projector, Type } from "../core/types.js";

interface ServiceDetails {
  namespace?: Namespace;
  title?: string;
  version?: string;
  host?: string;
}

const programServiceDetails = new WeakMap<Program | Projector, ServiceDetails>();
function getServiceDetails(program: Program) {
  let serviceDetails = programServiceDetails.get(program.currentProjector ?? program);
  if (!serviceDetails) {
    serviceDetails = {};
    programServiceDetails.set(program.currentProjector ?? program, serviceDetails);
  }

  return serviceDetails;
}

export function setServiceNamespace(program: Program, namespace: Namespace): void {
  const serviceDetails = getServiceDetails(program);
  if (serviceDetails.namespace && serviceDetails.namespace !== namespace) {
    program.reportDiagnostic(
      createDiagnostic({ code: "service-namespace-duplicate", target: namespace })
    );
  }

  serviceDetails.namespace = namespace;
}

export function checkIfServiceNamespace(program: Program, namespace: Namespace): boolean {
  const serviceDetails = getServiceDetails(program);
  return serviceDetails.namespace === namespace;
}

export function $serviceTitle(context: DecoratorContext, target: Type, title: string) {
  const serviceDetails = getServiceDetails(context.program);
  if (serviceDetails.title) {
    context.program.reportDiagnostic(
      createDiagnostic({
        code: "service-decorator-duplicate",
        format: { name: "title" },
        target,
      })
    );
  }

  if (!validateDecoratorTarget(context, target, "@serviceTitle", "Namespace")) {
    return;
  }

  setServiceNamespace(context.program, target);
  serviceDetails.title = title;
}

export function getServiceTitle(program: Program): string {
  const serviceDetails = getServiceDetails(program);
  return serviceDetails.title || "(title)";
}

export function $serviceVersion(context: DecoratorContext, target: Type, version: string) {
  const serviceDetails = getServiceDetails(context.program);
  if (serviceDetails.version) {
    context.program.reportDiagnostic(
      createDiagnostic({
        code: "service-decorator-duplicate",
        format: { name: "version" },
        target,
      })
    );
  }

  if (!validateDecoratorTarget(context, target, "@serviceVersion", "Namespace")) {
    return;
  }

  setServiceNamespace(context.program, target);
  serviceDetails.version = version;
}

export function getServiceVersion(program: Program): string {
  const serviceDetails = getServiceDetails(program);
  return serviceDetails.version || "0000-00-00";
}

export function getServiceNamespace(program: Program): Namespace | undefined {
  const serviceDetails = getServiceDetails(program);
  return serviceDetails.namespace ?? program.checker.getGlobalNamespaceType();
}

export function getServiceNamespaceString(program: Program): string | undefined {
  const serviceDetails = getServiceDetails(program);
  return (
    (serviceDetails.namespace && program.checker.getNamespaceString(serviceDetails.namespace)) ||
    undefined
  );
}

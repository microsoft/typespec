import { getNamespaceFullName, Namespace } from "@typespec/compiler";
import { getVersions } from "@typespec/versioning";
import { getExplicitClientApiVersions } from "../decorators.js";
import { TCGCContext } from "../interfaces.js";
import { listAllUserDefinedNamespaces } from "../internal-utils.js";
import { reportDiagnostic } from "../lib.js";

export function validatePackage(context: TCGCContext) {
  validateNamespaces(context);
}

function validateNamespaces(context: TCGCContext) {
  for (const namespace of listAllUserDefinedNamespaces(context)) {
    validateDecoratorsAppliedToVersionedService(context, namespace);
    validateClientApiVersionsIncludesAllServiceVersions(context, namespace);
  }
}
function validateDecoratorsAppliedToVersionedService(context: TCGCContext, namespace: Namespace) {
  const versions = getVersions(context.program, namespace)[1];
  if (
    (versions === undefined || versions.getVersions().length === 0) &&
    getExplicitClientApiVersions(context, namespace)
  ) {
    reportDiagnostic(context.program, {
      code: "require-versioned-service",
      format: {
        serviceName: getNamespaceFullName(namespace),
        decoratorName: "@clientApiVersions",
      },
      target: namespace,
    });
  }
}

function validateClientApiVersionsIncludesAllServiceVersions(
  context: TCGCContext,
  namespace: Namespace,
) {
  const versions = getVersions(context.program, namespace)[1];
  if (versions === undefined || versions.getVersions().length === 0) {
    return;
  }
  const clientApiVersionsEnum = getExplicitClientApiVersions(context, namespace);
  if (clientApiVersionsEnum === undefined) {
    return;
  }
  const clientApiVersions = [...clientApiVersionsEnum.members.values()].map(
    (x) => x.value ?? x.name,
  );
  const missingVersions = versions
    .getVersions()
    .map((x) => x.value)
    .filter((version) => !clientApiVersions.includes(version));
  if (missingVersions.length > 0) {
    reportDiagnostic(context.program, {
      code: "missing-service-versions",
      format: {
        serviceName: getNamespaceFullName(namespace),
        missingVersions: missingVersions.join(", "),
      },
      target: namespace,
    });
  }
}

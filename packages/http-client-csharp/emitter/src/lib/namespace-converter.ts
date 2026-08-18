import type { SdkHttpOperation, SdkNamespace } from "@azure-tools/typespec-client-generator-core";
import type { Diagnostic } from "@typespec/compiler";
import { createDiagnosticCollector } from "@typespec/compiler";
import type { CSharpEmitterContext } from "../sdk-context.js";
import type { InputNamespace } from "../type/input-type.js";

export function fromSdkNamespaces(
  sdkContext: CSharpEmitterContext,
  namespaces: SdkNamespace<SdkHttpOperation>[],
): [InputNamespace[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const inputNamespaces: InputNamespace[] = [];
  for (const namespace of namespaces) {
    const inputNamespace = fromSdkNamespace(sdkContext, namespace);
    inputNamespaces.push(inputNamespace);
  }

  return diagnostics.wrap(inputNamespaces);
}

function fromSdkNamespace(
  sdkContext: CSharpEmitterContext,
  namespace: SdkNamespace<SdkHttpOperation>,
): InputNamespace {
  let inputNamespace: InputNamespace | undefined = sdkContext.__typeCache.namespaces.get(
    namespace.fullName,
  );
  if (inputNamespace) {
    return inputNamespace;
  }

  const nestedNamespaces = Array.from(namespace.namespaces.values()).map((childNamespace) =>
    fromSdkNamespace(sdkContext, childNamespace),
  );

  inputNamespace = {
    name: namespace.name,
    fullName: namespace.fullName,
    decorators: namespace.decorators,
    namespaces: nestedNamespaces,
  };

  sdkContext.__typeCache.updateNamespaceCache(namespace, inputNamespace);
  return inputNamespace;
}

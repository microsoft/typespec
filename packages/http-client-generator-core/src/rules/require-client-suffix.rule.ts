import { createRule, Interface, Namespace, paramMessage } from "@typespec/compiler";
import { createTCGCContext } from "../context.js";
import { getClient } from "../decorators.js";

export const requireClientSuffixRule = createRule({
  name: "require-client-suffix",
  description: "Client names should end with 'Client'.",
  severity: "warning",
  url: "https://azure.github.io/typespec-azure/docs/libraries/typespec-client-generator-core/rules/require-client-suffix",
  messages: {
    default: paramMessage`Client name "${"name"}" must end with Client. Use @client({name: "...Client"}`,
  },
  create(context) {
    const tcgcContext = createTCGCContext(
      context.program,
      "@azure-tools/typespec-client-generator-core",
      {
        mutateNamespace: false,
      },
    );
    return {
      namespace: (namespace: Namespace) => {
        const sdkClient = getClient(tcgcContext, namespace);
        if (sdkClient && sdkClient.parent === undefined && !sdkClient.name.endsWith("Client")) {
          context.reportDiagnostic({
            target: namespace,
            format: {
              name: sdkClient.name,
            },
          });
        }
      },
      interface: (interfaceType: Interface) => {
        const sdkClient = getClient(tcgcContext, interfaceType);
        if (sdkClient && sdkClient.parent === undefined && !sdkClient.name.endsWith("Client")) {
          context.reportDiagnostic({
            target: interfaceType,
            format: {
              name: sdkClient.name,
            },
          });
        }
      },
    };
  },
});

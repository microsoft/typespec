import { For, SourceDirectory, type Children } from "@alloy-js/core";
import * as cs from "@alloy-js/csharp";
import { Namespace } from "@alloy-js/csharp";
import type { Interface } from "@typespec/compiler";
import type { OperationHttpCanonicalization } from "@typespec/http-canonicalization";
import { useEmitterOptions } from "../context/emitter-options-context.js";
import { Controller } from "./controllers/controllers.jsx";
import { CSharpFile } from "./csharp-file.jsx";
import { BusinessLogicInterface } from "./interfaces/interfaces.jsx";
import { RequestModels, type RequestModelInfo } from "./request-models.jsx";

export interface ControllersAndInterfacesProps {
  /** Pre-resolved service interfaces (including synthetic ones for namespace-level ops). */
  interfaces: Interface[];
  /** Pre-computed canonical HTTP operations per interface. */
  canonicalOpsMap: Map<string, OperationHttpCanonicalization[]>;
}

/**
 * Component that renders controllers and their corresponding business logic interfaces.
 */
export function ControllersAndInterfaces(props: ControllersAndInterfacesProps): Children {
  const namePolicy = cs.useCSharpNamePolicy();
  const { serviceNamespace: parentNamespace } = useEmitterOptions();

  const interfaceOps = props.interfaces.map((iface) => ({
    iface,
    ops: props.canonicalOpsMap.get(iface.name) ?? [],
  }));

  // Collect operations that need request model classes
  const requestModels: RequestModelInfo[] = [];
  for (const { iface, ops } of interfaceOps) {
    for (const op of ops) {
      // GET requests don't have body parameters in the server
      if (op.method === "get") continue;

      const body = op.requestParameters.body;
      if (body?.bodyKind === "single" && body.bodies.length > 0) {
        const bodyType = body.bodies[0].type.sourceType;
        // Create request model for body parameters that have properties to decompose
        // This handles spread params (...Model) and implicit body models
        if (bodyType.kind === "Model" && bodyType.properties.size > 0) {
          // Skip if the body has an explicit property (i.e., @body/@bodyRoot decorator used)
          const hasExplicitBody = body.bodies[0].property !== undefined;
          if (!hasExplicitBody) {
            const opName = namePolicy.getName(op.name, "class-method");
            const requestModelName = `${iface.name}${opName}Request`;
            requestModels.push({ name: requestModelName, op, ifaceName: iface.name });
          }
        }
      }
    }
  }

  return (
    <>
      <SourceDirectory path="models">
        <RequestModels requestModels={requestModels} />
      </SourceDirectory>
      <SourceDirectory path="operations">
        <For each={interfaceOps}>
          {({ iface, ops }) => {
            const hasMultipart = ops.some(
              (op) => op.requestParameters.body?.bodyKind === "multipart",
            );
            return (
              <CSharpFile
                path={`I${iface.name}.cs`}
                using={[
                  "System",
                  "System.Collections.Generic",
                  "System.Text.Json",
                  "System.Text.Json.Nodes",
                  "System.Text.Json.Serialization",
                  "System.Threading.Tasks",
                  ...(hasMultipart ? ["Microsoft.AspNetCore.WebUtilities"] : []),
                ]}
              >
                <BusinessLogicInterface type={iface} canonicalOps={ops} />
              </CSharpFile>
            );
          }}
        </For>
      </SourceDirectory>
      <SourceDirectory path="controllers">
        <Namespace name="Controllers">
          <For each={interfaceOps}>
            {({ iface, ops }) => {
              const hasMultipart = ops.some(
                (op) => op.requestParameters.body?.bodyKind === "multipart",
              );
              return (
                <CSharpFile
                  path={`${iface.name}Controller.cs`}
                  using={[
                    "System",
                    "System.Net",
                    "System.Threading.Tasks",
                    "System.Text.Json",
                    "System.Text.Json.Nodes",
                    "System.Text.Json.Serialization",
                    ...(hasMultipart
                      ? [
                          "Microsoft.AspNetCore.WebUtilities",
                          "Microsoft.AspNetCore.Http.Extensions",
                        ]
                      : []),
                    ...(parentNamespace ? [parentNamespace] : []),
                  ]}
                >
                  <Controller type={iface} operations={ops} requestModels={requestModels} />
                </CSharpFile>
              );
            }}
          </For>
        </Namespace>
      </SourceDirectory>
    </>
  );
}

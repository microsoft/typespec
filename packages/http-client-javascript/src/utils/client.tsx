import { Interface, ModelProperty, Namespace } from "@typespec/compiler";
import { $ as standard } from "@typespec/compiler/typekit";
import { $ } from "../../../compiler/src/experimental/typekit/index.js";
import { getAuthentication, getServers } from "@typespec/http";

function getEndpointParameter(type: Namespace): ModelProperty | undefined {
  const server = getServers(standard.program, type)?.[0];
  // if (!server?.url) {
  //   return $.modelProperty.create({
  //     name: "endpoint",
  //     type: $.scalar.extendsString("hello"),
  //     optional: false,
  //   })
  // }
  return undefined;
}

function getApiVersionParameter(type: Namespace): ModelProperty | undefined {
  return undefined;
}

function getCredentialParameter(type: Namespace): ModelProperty | undefined {
  const auth = getAuthentication(standard.program, type);
  if (!auth) return undefined;
  // return $.modelProperty.create({
  //   name: "credential",
  //   type: {
  //     kind: ""
  //   }
  //   optional: false,
  // });
}

export function getClientParams(
  type: Namespace | Interface,
): ModelProperty[] {
  const clientParameters: ModelProperty[] = [];
  if (type.kind === "Interface") return clientParameters;
  const endpointParameter = getEndpointParameter(type);
  if (endpointParameter) {
    clientParameters.push(endpointParameter);
  }
  const apiVersionParameter = getApiVersionParameter(type);
  if (apiVersionParameter) {
    clientParameters.push(apiVersionParameter);
  }

  const credentialParameter = getCredentialParameter(type);
  if (credentialParameter) {
    clientParameters.push(credentialParameter);
  }
  return clientParameters;
}


// for (const namespace of $.namespaces) {
//   for (const model of namespace.models) {
//   }
//   for (const client of namespace.clients) {
    
//   }
//   const subNamespaces = namespace.namespaces;
// }

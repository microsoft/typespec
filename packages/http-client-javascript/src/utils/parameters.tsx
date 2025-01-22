import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { ModelProperty } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { buildParameterDescriptor } from "@typespec/emitter-framework/typescript";
import { HttpAuth } from "@typespec/http";
import { getClientContextOptionsRef } from "../components/client-context/client-context-options.jsx";
import { httpRuntimeTemplateLib } from "../components/external-packages/ts-http-runtime.js";
import { Client } from "./client-discovery.js";

export function buildClientParameters(client: Client): Record<string, ts.ParameterDescriptor> {
  const clientConstructor = $.client.getConstructor(client);
  const parameters = $.operation.getClientSignature(client, clientConstructor);
  const params = parameters.reduce(
    (acc, param) => {
      const paramsDescriptor = buildClientParameterDescriptor(param);
      if (!paramsDescriptor) {
        return acc;
      }
      const [name, descriptor] = paramsDescriptor;

      if (!descriptor.optional) {
        acc[name] = descriptor;
      }

      return acc;
    },
    {} as Record<string, ts.ParameterDescriptor>,
  );

  if (!params["options"]) {
    params["options"] = {
      refkey: ay.refkey(),
      optional: true,
      type: getClientContextOptionsRef(client),
    };
  }

  return params;
}

function buildClientParameterDescriptor(
  modelProperty: ModelProperty,
): [string, ts.ParameterDescriptor] | undefined {
  const authSchemes = $.modelProperty.getCredentialAuth(modelProperty);

  if (authSchemes) {
    if (authSchemes.length === 1 && authSchemes[0].type === "noAuth") {
      return undefined;
    }
    return [
      "credential",
      {
        refkey: ay.refkey(modelProperty),
        optional: modelProperty.optional,
        type: ay.mapJoin(authSchemes, (scheme) => getCredentialType(scheme), { joiner: " | " }),
      },
    ];
  }

  return buildParameterDescriptor(modelProperty);
}

function getCredentialType(scheme: HttpAuth) {
  switch (scheme.type) {
    case "apiKey":
    case "http":
      return httpRuntimeTemplateLib.KeyCredential;
    case "oauth2":
      return httpRuntimeTemplateLib.TokenCredential;
    default:
      return null;
  }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { getClientType } from "@azure-tools/typespec-client-generator-core";
import { getDoc, getSummary, Value } from "@typespec/compiler";
import { HttpServer } from "@typespec/http";
import { getExtensions } from "@typespec/openapi";
import { CSharpEmitterContext } from "../sdk-context.js";
import { InputConstant } from "../type/input-constant.js";
import { InputParameterScope } from "../type/input-parameter-scope.js";
import { InputEndpointParameter, InputType } from "../type/input-type.js";
import { fromSdkType } from "./type-converter.js";

export interface TypeSpecServer {
  url: string;
  description?: string;
  parameters: InputEndpointParameter[];
}

export function resolveServers(
  sdkContext: CSharpEmitterContext,
  servers: HttpServer[],
): TypeSpecServer[] {
  return servers.map((server) => {
    const parameters: InputEndpointParameter[] = [];
    let url: string = server.url;
    const endpoint: string = url.replace("http://", "").replace("https://", "").split("/")[0];
    for (const [name, prop] of server.parameters) {
      const isEndpoint: boolean = endpoint === `{${name}}`;
      let defaultValue: InputConstant | undefined = undefined;
      const value = prop.defaultValue ? getDefaultValue(prop.defaultValue) : "";
      const inputType: InputType = isEndpoint
        ? {
            kind: "url",
            name: "url",
            crossLanguageDefinitionId: "TypeSpec.url",
          }
        : fromSdkType(sdkContext, getClientType(sdkContext, prop));

      if (value) {
        defaultValue = {
          type: inputType,
          value: value,
        };
      }
      const variable: InputEndpointParameter = {
        kind: "endpoint",
        name: name,
        serializedName: name,
        summary: getSummary(sdkContext.program, prop),
        doc: getDoc(sdkContext.program, prop),
        type: inputType,
        isApiVersion: name.toLowerCase() === "apiversion" || name.toLowerCase() === "api-version",
        isEndpoint: isEndpoint,
        optional: false,
        skipUrlEncoding:
          // TODO: update this when https://github.com/Azure/typespec-azure/issues/1022 is resolved
          getExtensions(sdkContext.program, prop).get("x-ms-skip-url-encoding") === true,
        scope: InputParameterScope.Client,
        defaultValue: defaultValue,
        readOnly: false,
        crossLanguageDefinitionId: "",
      };

      parameters.push(variable);
    }
    /* add default server. */
    if (server.url && parameters.length === 0) {
      const variable: InputEndpointParameter = {
        kind: "endpoint",
        name: "host",
        serializedName: "host",
        doc: server.description,
        type: {
          kind: "string",
          name: "string",
          crossLanguageDefinitionId: "TypeSpec.string",
        },
        isApiVersion: false,
        optional: false,
        isEndpoint: true,
        skipUrlEncoding: false,
        scope: InputParameterScope.Client,
        defaultValue: {
          type: {
            kind: "string",
            name: "string",
            crossLanguageDefinitionId: "TypeSpec.string",
          },
          value: server.url,
        } as InputConstant,
        readOnly: false,
        crossLanguageDefinitionId: "",
      };
      url = `{host}`;
      parameters.push(variable);
    }
    return {
      url: url,
      description: server.description,
      parameters,
    };
  });
}

function getDefaultValue(value: Value): any {
  switch (value.valueKind) {
    case "StringValue":
      return value.value;
    case "NumericValue":
      return value.value;
    case "BooleanValue":
      return value.value;
    case "ArrayValue":
      return value.values.map(getDefaultValue);
    default:
      return undefined;
  }
}

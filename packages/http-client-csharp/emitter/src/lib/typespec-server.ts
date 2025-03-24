// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { getDoc, getSummary } from "@typespec/compiler";
import { HttpServer } from "@typespec/http";
import { getExtensions } from "@typespec/openapi";
import { CSharpEmitterContext } from "../sdk-context.js";
import { InputConstant } from "../type/input-constant.js";
import { InputOperationParameterKind } from "../type/input-operation-parameter-kind.js";
import { InputParameter } from "../type/input-parameter.js";
import { InputType } from "../type/input-type.js";
import { RequestLocation } from "../type/request-location.js";
import { getDefaultValue, getInputType } from "./model.js";

export interface TypeSpecServer {
  url: string;
  description?: string;
  parameters: InputParameter[];
}

export function resolveServers(
  sdkContext: CSharpEmitterContext,
  servers: HttpServer[],
): TypeSpecServer[] {
  return servers.map((server) => {
    const parameters: InputParameter[] = [];
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
        : getInputType(sdkContext, prop);

      if (value) {
        defaultValue = {
          type: inputType,
          value: value,
        };
      }
      const variable: InputParameter = {
        name: name,
        nameInRequest: name,
        summary: getSummary(sdkContext.program, prop),
        doc: getDoc(sdkContext.program, prop),
        type: inputType,
        location: RequestLocation.Uri,
        isApiVersion: name.toLowerCase() === "apiversion" || name.toLowerCase() === "api-version",
        isContentType: false,
        isRequired: true,
        isEndpoint: isEndpoint,
        skipUrlEncoding:
          // TODO: update this when https://github.com/Azure/typespec-azure/issues/1022 is resolved
          getExtensions(sdkContext.program, prop).get("x-ms-skip-url-encoding") === true,
        explode: false,
        kind: InputOperationParameterKind.Client,
        defaultValue: defaultValue,
      };

      parameters.push(variable);
    }
    /* add default server. */
    if (server.url && parameters.length === 0) {
      const variable: InputParameter = {
        name: "host",
        nameInRequest: "host",
        doc: server.description,
        type: {
          kind: "string",
          name: "string",
          crossLanguageDefinitionId: "TypeSpec.string",
        },
        location: RequestLocation.Uri,
        isApiVersion: false,
        isContentType: false,
        isRequired: true,
        isEndpoint: true,
        skipUrlEncoding: false,
        explode: false,
        kind: InputOperationParameterKind.Client,
        defaultValue: {
          type: {
            kind: "string",
            name: "string",
            crossLanguageDefinitionId: "TypeSpec.string",
          },
          value: server.url,
        } as InputConstant,
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

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkCredentialParameter,
  SdkCredentialType,
  SdkHttpOperation,
  SdkPackage,
} from "@azure-tools/typespec-client-generator-core";
import { Oauth2Auth, OAuth2Flow } from "@typespec/http";
import { Logger } from "./logger.js";
import { InputAuth } from "../type/input-auth.js";

export function processServiceAuthentication(
  sdkPackage: SdkPackage<SdkHttpOperation>,
): InputAuth | undefined {
  let authClientParameter: SdkCredentialParameter | undefined = undefined;
  for (const client of sdkPackage.clients) {
    for (const parameter of client.initialization.properties) {
      if (parameter.kind === "credential") {
        authClientParameter = parameter;
        break;
      }
    }
  }

  if (!authClientParameter) {
    return undefined;
  }
  if (authClientParameter.type.kind === "credential") {
    return processAuthType(authClientParameter.type);
  }
  const inputAuth: InputAuth = {};
  for (const authType of authClientParameter.type.variantTypes) {
    const auth = processAuthType(authType);
    if (auth?.ApiKey) {
      inputAuth.ApiKey = auth.ApiKey;
    }
    if (auth?.OAuth2) {
      inputAuth.OAuth2 = auth.OAuth2;
    }
  }
  return inputAuth;
}

function processAuthType(credentialType: SdkCredentialType): InputAuth | undefined {
  const scheme = credentialType.scheme;
  switch (scheme.type) {
    case "apiKey":
      if (scheme.in !== "header") {
        Logger.getInstance().warn(
          `Only header is supported for ApiKey auth method. ${scheme.in} is not supported.`,
          credentialType.__raw
        );
        return undefined;
      }
      return { ApiKey: { Name: scheme.name, In: scheme.in } } as InputAuth;
    case "oauth2":
      return processOAuth2(scheme);
    case "http":
      {
        const schemeOrApiKeyPrefix = scheme.scheme;
        switch (schemeOrApiKeyPrefix) {
          case "basic":
            Logger.getInstance().warn(
              `${schemeOrApiKeyPrefix} auth method is currently not supported.`,
              credentialType.__raw
            );
            return undefined;
          case "bearer":
            return {
              ApiKey: {
                Name: "Authorization",
                In: "header",
                Prefix: "Bearer",
              },
            };
          default:
            return {
              ApiKey: {
                Name: "Authorization",
                In: "header",
                Prefix: schemeOrApiKeyPrefix,
              },
            };
        }
      }
    default:
      Logger.getInstance().error(
        `un-supported authentication scheme ${scheme.type}`,
        credentialType.__raw
      );
      return undefined;
  }
}

function processOAuth2(scheme: Oauth2Auth<OAuth2Flow[]>): InputAuth | undefined {
  let scopes: Set<string> | undefined = undefined;
  for (const flow of scheme.flows) {
    if (flow.scopes) {
      scopes ??= new Set<string>();
      for (const scope of flow.scopes) {
        scopes.add(scope.value);
      }
    }
  }
  return scopes
    ? ({
        OAuth2: { Scopes: Array.from(scopes.values()) },
      } as InputAuth)
    : undefined;
}

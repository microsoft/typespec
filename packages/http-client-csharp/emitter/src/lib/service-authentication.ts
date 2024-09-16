// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkCredentialParameter,
  SdkCredentialType,
  SdkHttpOperation,
  SdkPackage,
} from "@azure-tools/typespec-client-generator-core";
import { Oauth2Auth, OAuth2Flow } from "@typespec/http";
import { InputAuth } from "../type/input-auth.js";
import { Logger } from "./logger.js";

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
  for (const authType of authClientParameter.type.values) {
    // TODO: TCGC might change to []SdkCredentialType
    const auth = processAuthType(authType as SdkCredentialType);
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
      return { ApiKey: { Name: scheme.name } } as InputAuth;
    case "oauth2":
      return processOAuth2(scheme);
    case "http":
      {
        const schemeOrApiKeyPrefix = scheme.scheme;
        switch (schemeOrApiKeyPrefix) {
          case "basic":
            Logger.getInstance().warn(
              `${schemeOrApiKeyPrefix} auth method is currently not supported.`,
            );
            return undefined;
          case "bearer":
            return {
              ApiKey: {
                Name: "Authorization",
                Prefix: "Bearer",
              },
            } as InputAuth;
          default:
            return {
              ApiKey: {
                Name: "Authorization",
                Prefix: schemeOrApiKeyPrefix,
              },
            } as InputAuth;
        }
      }
      break;
    default:
      throw new Error(`un-supported authentication scheme ${scheme.type}`);
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

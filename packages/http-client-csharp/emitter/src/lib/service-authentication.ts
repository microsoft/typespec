// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import {
  SdkCredentialParameter,
  SdkCredentialType,
  SdkHttpOperation,
  SdkPackage,
} from "@azure-tools/typespec-client-generator-core";
import { NoTarget } from "@typespec/compiler";
import { Oauth2Auth, OAuth2Flow } from "@typespec/http";
import { CSharpEmitterContext } from "../sdk-context.js";
import { InputAuth } from "../type/input-auth.js";

export function processServiceAuthentication(
  sdkContext: CSharpEmitterContext,
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

  const inputAuth: InputAuth = {};

  if (authClientParameter.type.kind === "credential") {
    const auth = processAuthType(sdkContext, authClientParameter.type);
    if (!auth && authClientParameter.type.scheme.type !== "noAuth") {
      sdkContext.logger.reportDiagnostic({
        code: "unsupported-auth",
        messageId: "onlyUnsupportedAuthProvided",
        target: authClientParameter.type.__raw ?? NoTarget,
      });

      return inputAuth;
    }
    return auth;
  }

  let containsNoAuth = false;
  for (const authType of authClientParameter.type.variantTypes) {
    containsNoAuth = containsNoAuth || authType.scheme.type === "noAuth";
    const auth = processAuthType(sdkContext, authType);
    if (auth?.ApiKey) {
      inputAuth.ApiKey = auth.ApiKey;
    }
    if (auth?.OAuth2) {
      inputAuth.OAuth2 = auth.OAuth2;
    }
  }

  if (containsNoAuth && !inputAuth.ApiKey && !inputAuth.OAuth2) {
    return undefined;
  }

  if (!inputAuth?.ApiKey && !inputAuth?.OAuth2) {
    sdkContext.logger.reportDiagnostic({
      code: "unsupported-auth",
      messageId: "onlyUnsupportedAuthProvided",
      target: authClientParameter.type.__raw ?? NoTarget,
    });
  }

  return inputAuth;
}

function processAuthType(
  sdkContext: CSharpEmitterContext,
  credentialType: SdkCredentialType,
): InputAuth | undefined {
  const scheme = credentialType.scheme;
  switch (scheme.type) {
    case "apiKey":
      if (scheme.in !== "header") {
        sdkContext.logger.reportDiagnostic({
          code: "unsupported-auth",
          format: {
            message: `Only header is supported for ApiKey authentication. ${scheme.in} is not supported.`,
          },
          target: credentialType.__raw ?? NoTarget,
        });
        return undefined;
      }
      return { ApiKey: { Name: scheme.name, In: scheme.in } } as InputAuth;
    case "oauth2":
      return processOAuth2(scheme);
    case "http": {
      const schemeOrApiKeyPrefix = scheme.scheme;
      switch (schemeOrApiKeyPrefix) {
        case "basic":
          sdkContext.logger.reportDiagnostic({
            code: "unsupported-auth",
            format: { message: `${schemeOrApiKeyPrefix} auth method is currently not supported.` },
            target: credentialType.__raw ?? NoTarget,
          });
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
      sdkContext.logger.reportDiagnostic({
        code: "unsupported-auth",
        format: { message: `un-supported authentication scheme ${scheme.type}` },
        target: credentialType.__raw ?? NoTarget,
      });
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

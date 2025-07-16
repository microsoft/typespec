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
import { InputOAuth2Flow } from "../type/input-oauth2-auth.js";

export function processServiceAuthentication(
  sdkContext: CSharpEmitterContext,
  sdkPackage: SdkPackage<SdkHttpOperation>,
): InputAuth | undefined {
  let authClientParameter: SdkCredentialParameter | undefined = undefined;
  for (const client of sdkPackage.clients) {
    for (const parameter of client.clientInitialization.parameters) {
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
    if (auth?.apiKey) {
      inputAuth.apiKey = auth.apiKey;
    }
    if (auth?.oAuth2) {
      inputAuth.oAuth2 = auth.oAuth2;
    }
  }

  if (containsNoAuth && !inputAuth.apiKey && !inputAuth.oAuth2) {
    return undefined;
  }

  if (!inputAuth?.apiKey && !inputAuth?.oAuth2) {
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
      return { apiKey: { name: scheme.name, in: scheme.in } } as InputAuth;
    case "oauth2":
      return processOAuth2(scheme);
    case "http": {
      const schemeOrApiKeyPrefix = scheme.scheme;
      switch (schemeOrApiKeyPrefix) {
        case "Basic":
          sdkContext.logger.reportDiagnostic({
            code: "unsupported-auth",
            format: { message: `${schemeOrApiKeyPrefix} auth method is currently not supported.` },
            target: credentialType.__raw ?? NoTarget,
          });
          return undefined;
        case "Bearer":
          return {
            apiKey: {
              name: "Authorization",
              in: "header",
              prefix: "Bearer",
            },
          };
        default:
          return {
            apiKey: {
              name: "Authorization",
              in: "header",
              prefix: schemeOrApiKeyPrefix,
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
  const inputFlows: InputOAuth2Flow[] = [];

  for (const flow of scheme.flows) {
    const inputFlow: InputOAuth2Flow = {};

    if (flow.scopes) {
      inputFlow.scopes = flow.scopes.map((scope) => scope.value);
    }

    inputFlow.refreshUrl = flow.refreshUrl;

    if (flow.type === "authorizationCode" || flow.type === "implicit" || flow.type === "password") {
      inputFlow.authorizationUrl = flow.authorizationUrl;
    }

    if (flow.type === "authorizationCode" || flow.type === "clientCredentials") {
      inputFlow.tokenUrl = flow.tokenUrl;
    }

    inputFlows.push(inputFlow);
  }

  return { oAuth2: { flows: inputFlows } };
}

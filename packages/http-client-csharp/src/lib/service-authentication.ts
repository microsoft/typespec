// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { Authentication } from "@typespec/http";
import { InputApiKeyAuth } from "../type/input-api-key-auth.js";
import { InputAuth } from "../type/input-auth.js";
import { InputOAuth2Auth } from "../type/input-oauth2-auth.js";
import { logger } from "./logger.js";

export function processServiceAuthentication(authentication: Authentication): InputAuth {
  const auth = {} as InputAuth;
  let scopes: Set<string> | undefined;

  for (const option of authentication.options) {
    for (const scheme of option.schemes) {
      switch (scheme.type) {
        case "apiKey":
          auth.ApiKey = { Name: scheme.name } as InputApiKeyAuth;
          break;
        case "oauth2":
          for (const flow of scheme.flows) {
            if (flow.scopes) {
              scopes ??= new Set<string>();
              for (const scope of flow.scopes) {
                scopes.add(scope.value);
              }
            }
          }
          break;
        case "http":
          const schemeOrApiKeyPrefix = scheme.scheme;
          if (schemeOrApiKeyPrefix === "basic") {
            logger.warn(`{schemeOrApiKeyPrefix} auth method is currently not supported.`);
          } else if (schemeOrApiKeyPrefix === "bearer") {
            auth.ApiKey = {
              Name: "Authorization",
              Prefix: "Bearer",
            } as InputApiKeyAuth;
          } else {
            auth.ApiKey = {
              Name: "Authorization",
              Prefix: schemeOrApiKeyPrefix,
            } as InputApiKeyAuth;
          }
          break;
        default:
          throw new Error("Not supported authentication.");
      }
    }
  }

  if (scopes) {
    auth.OAuth2 = {
      Scopes: Array.from(scopes.values()),
    } as InputOAuth2Auth;
  }

  return auth;
}

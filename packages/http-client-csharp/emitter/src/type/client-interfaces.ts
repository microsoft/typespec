// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";
import { InputOperation, InputParameter } from "./operation-interfaces.js";

export interface InputClient {
  Name: string;
  ClientNamespace: string;
  Summary?: string;
  Doc?: string;
  Operations: InputOperation[];
  Parent?: string;
  Parameters?: InputParameter[];
  Decorators?: DecoratorInfo[];
}

export interface InputAuth {
  ApiKey?: InputApiKeyAuth;
  OAuth2?: InputOAuth2Auth;
}

export interface InputOAuth2Auth {
  Scopes?: string[];
}

export interface InputApiKeyAuth {
  Name: string;
  In: ApiKeyLocation;
  Prefix?: string;
}

export type ApiKeyLocation = "header"; // | "query" | "cookie"; // we do not support query or cookie yet

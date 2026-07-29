// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

export interface InputOAuth2Auth {
  flows: InputOAuth2Flow[];
}

export interface InputOAuth2Flow {
  scopes?: string[];
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
}

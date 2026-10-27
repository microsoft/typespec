// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import type { InputApiKeyAuth } from "./input-api-key-auth.js";
import type { InputOAuth2Auth } from "./input-oauth2-auth.js";

export interface InputAuth {
  apiKey?: InputApiKeyAuth;
  oAuth2?: InputOAuth2Auth;
}

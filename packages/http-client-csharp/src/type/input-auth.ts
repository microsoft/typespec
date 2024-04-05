// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputOAuth2Auth } from "./input-oauth2-auth.js";
import { InputApiKeyAuth } from "./inputApiKeyAuth.js";

export interface InputAuth {
  ApiKey?: InputApiKeyAuth;
  OAuth2?: InputOAuth2Auth;
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import type { InputAuth } from "./input-auth.js";
import type { InputClient, InputEnumType, InputLiteralType, InputModelType } from "./input-type.js";

/**
 * The code model for the CSharp emitter.
 * @beta
 */
export interface CodeModel {
  name: string;
  apiVersions: string[];
  enums: InputEnumType[];
  constants: InputLiteralType[];
  models: InputModelType[];
  clients: InputClient[];
  auth?: InputAuth;
}

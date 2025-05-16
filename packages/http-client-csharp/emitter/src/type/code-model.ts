// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputAuth } from "./input-auth.js";
import { InputClient, InputEnumType, InputLiteralType, InputModelType } from "./input-type.js";

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

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputAuth } from "./input-auth.js";
import { InputClient, InputEnumType, InputModelType } from "./input-type.js";

export interface CodeModel {
  name: string;
  apiVersions: string[];
  enums: InputEnumType[];
  models: InputModelType[];
  clients: InputClient[];
  auth?: InputAuth;
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputAuth } from "./input-auth.js";
import { InputClient, InputEnumType, InputModelType } from "./input-type.js";

export interface CodeModel {
  Name: string;
  ApiVersions: string[];
  Enums: InputEnumType[];
  Models: InputModelType[];
  Clients: InputClient[];
  Auth?: InputAuth;
}

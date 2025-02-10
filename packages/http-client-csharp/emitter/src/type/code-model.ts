// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputAuth, InputClient } from "./client-interfaces.js";
import { InputEnumType, InputModelType } from "./type-interfaces.js";

export interface CodeModel {
  Name: string;
  ApiVersions: string[];
  Enums: InputEnumType[];
  Models: InputModelType[];
  Clients: InputClient[];
  Auth?: InputAuth;
}

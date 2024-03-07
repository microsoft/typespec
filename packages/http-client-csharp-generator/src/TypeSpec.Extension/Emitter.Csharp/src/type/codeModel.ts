// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputAuth } from "./inputAuth.js";
import { InputClient } from "./inputClient.js";
import { InputEnumType, InputModelType } from "./inputType.js";

export interface CodeModel {
    Name: string;
    Description?: string;
    ApiVersions: string[];
    Enums: InputEnumType[];
    Models: InputModelType[];
    Clients: InputClient[];
    Auth?: InputAuth;
}

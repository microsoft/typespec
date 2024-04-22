// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputOperation } from "./input-operation.js";
import { InputParameter } from "./input-parameter.js";
import { Protocols } from "./protocols.js";

export interface InputClient {
  Name: string;
  Description?: string;
  Operations: InputOperation[];
  Protocol?: Protocols;
  Parent?: string;
  Creatable: boolean;
  Parameters?: InputParameter[];
}

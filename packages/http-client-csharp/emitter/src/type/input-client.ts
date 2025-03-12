// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";
import { InputOperation } from "./input-operation.js";
import { InputParameter } from "./input-parameter.js";

export interface InputClient {
  name: string;
  namespace: string;
  summary?: string;
  doc?: string;
  operations: InputOperation[];
  parent?: string;
  parameters?: InputParameter[];
  decorators?: DecoratorInfo[];
  crossLanguageDefinitionId: string;
}

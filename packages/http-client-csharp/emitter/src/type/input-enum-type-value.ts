// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";

export interface InputEnumTypeValue {
  Name: string;
  Value: any;
  Description?: string;
  Decorators?: DecoratorInfo[];
}

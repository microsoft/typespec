// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputDecoratedType } from "./input-decorated-type.js";

export interface InputEnumTypeValue extends InputDecoratedType {
  Name: string;
  Value: any;
  Description?: string;
}

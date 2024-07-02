// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { InputType } from "./input-type.js";

export interface InputModelProperty {
  Name: string;
  SerializedName: string;
  Description: string;
  Type: InputType;
  IsRequired: boolean;
  IsReadOnly: boolean;
  IsDiscriminator?: boolean;
  FlattenedNames?: string[];
}

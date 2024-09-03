// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { DecoratorInfo } from "@azure-tools/typespec-client-generator-core";
import { InputType } from "./input-type.js";

export interface InputModelProperty {
  name: string;
  serializedName: string;
  description?: string;
  type: InputType;
  optional: boolean;
  readOnly: boolean;
  discriminator: boolean;
  decorators?: DecoratorInfo[];
  crossLanguageDefinitionId: string;
  FlattenedNames?: string[]; // TODO -- remove this when we are ready to move the flatten handling from emitter to the generator
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { Type, EncodeData } from "@typespec/compiler";
export interface FormattedType {
    type: Type;
    format?: string;
    encode?: EncodeData;
}

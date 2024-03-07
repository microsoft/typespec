// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { BodyMediaType } from "./bodyMediaType.js";
import { HttpResponseHeader } from "./httpResponseHeader.js";
import { InputType } from "./inputType.js";

export interface OperationResponse {
    StatusCodes: number[];
    BodyType?: InputType;
    BodyMediaType: BodyMediaType;
    Headers: HttpResponseHeader[];
    ContentTypes?: string[];
    IsErrorResponse: boolean;
}

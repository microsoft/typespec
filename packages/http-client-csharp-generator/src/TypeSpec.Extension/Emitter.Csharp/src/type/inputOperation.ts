// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { BodyMediaType } from "./bodyMediaType.js";
import { OperationLongRunning } from "./operationLongRunning.js";
import { OperationPaging } from "./operationPaging.js";
import { InputParameter } from "./inputParameter.js";
import { OperationResponse } from "./operationResponse.js";
import { RequestMethod } from "./requestMethod.js";

export interface Paging {
    NextLinkName?: string;
    ItemName: string;
    NextPageMethod?: string;
}

export interface InputOperation {
    Name: string;
    ResourceName?: string;
    Summary?: string;
    Deprecated?: string;
    Description?: string;
    Accessibility?: string;
    Parameters: InputParameter[];
    Responses: OperationResponse[];
    HttpMethod: RequestMethod;
    RequestBodyMediaType: BodyMediaType;
    Uri: string;
    Path: string;
    ExternalDocsUrl?: string;
    RequestMediaTypes?: string[];
    BufferResponse: boolean;
    LongRunning?: OperationLongRunning;
    Paging?: OperationPaging;
    GenerateProtocolMethod: boolean;
    GenerateConvenienceMethod: boolean;
}

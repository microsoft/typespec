// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace AutoRest.CSharp.Common.Input;

internal record OperationResponse(IReadOnlyList<int> StatusCodes, InputType? BodyType, BodyMediaType BodyMediaType, IReadOnlyList<OperationResponseHeader> Headers, bool IsErrorResponse, IReadOnlyList<string> ContentTypes)
{
    public OperationResponse() : this(StatusCodes: Array.Empty<int>(), BodyType: null, BodyMediaType: BodyMediaType.None, Headers: Array.Empty<OperationResponseHeader>(), IsErrorResponse: false, ContentTypes: Array.Empty<string>()) { }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents an operation response.
    /// </summary>
    public sealed class OperationResponse
    {
        public OperationResponse(IReadOnlyList<int> statusCodes, InputType? bodyType, IReadOnlyList<OperationResponseHeader> headers, bool isErrorResponse, IReadOnlyList<string> contentTypes)
        {
            StatusCodes = statusCodes;
            BodyType = bodyType;
            Headers = headers;
            IsErrorResponse = isErrorResponse;
            ContentTypes = contentTypes;
        }

        public OperationResponse() : this(Array.Empty<int>(), null,  Array.Empty<OperationResponseHeader>(), false, Array.Empty<string>()) { }

        public IReadOnlyList<int> StatusCodes { get; }
        public InputType? BodyType { get; }
        public IReadOnlyList<OperationResponseHeader> Headers { get; }
        public bool IsErrorResponse { get; }
        public IReadOnlyList<string> ContentTypes { get; }
    }
}

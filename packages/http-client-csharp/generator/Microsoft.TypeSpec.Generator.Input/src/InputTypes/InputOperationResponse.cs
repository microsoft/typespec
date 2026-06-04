// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents an operation response.
    /// </summary>
    public sealed class InputOperationResponse
    {
        public InputOperationResponse(IReadOnlyList<int> statusCodes, InputType? bodyType, IReadOnlyList<InputOperationResponseHeader> headers, bool isErrorResponse, IReadOnlyList<string> contentTypes, InputSerializationOptions? serializationOptions = null)
        {
            StatusCodes = statusCodes;
            BodyType = bodyType;
            Headers = headers;
            IsErrorResponse = isErrorResponse;
            ContentTypes = contentTypes;
            SerializationOptions = serializationOptions;
        }

        public InputOperationResponse() : this(Array.Empty<int>(), null,  Array.Empty<InputOperationResponseHeader>(), false, Array.Empty<string>()) { }

        public IReadOnlyList<int> StatusCodes { get; }
        public InputType? BodyType { get; }
        public IReadOnlyList<InputOperationResponseHeader> Headers { get; }
        public bool IsErrorResponse { get; }
        public IReadOnlyList<string> ContentTypes { get; }

        /// <summary>
        /// Options describing how the response body is deserialized from the wire.
        /// </summary>
        public InputSerializationOptions? SerializationOptions { get; }
    }
}

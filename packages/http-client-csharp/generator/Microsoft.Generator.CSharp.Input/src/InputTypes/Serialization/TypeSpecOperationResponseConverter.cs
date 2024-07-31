// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecOperationResponseConverter : JsonConverter<OperationResponse>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecOperationResponseConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override OperationResponse? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<OperationResponse>(_referenceHandler.CurrentResolver) ?? CreateOperationResponse(ref reader, null, options);
        }

        public override void Write(Utf8JsonWriter writer, OperationResponse value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private OperationResponse CreateOperationResponse(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options)
        {
            var isFirstProperty = id == null;
            IReadOnlyList<int>? statusCodes = null;
            InputType? bodyType = null;
            string? bodyMediaTypeString = null;
            IReadOnlyList<OperationResponseHeader>? headers = null;
            bool isErrorResponse = default;
            IReadOnlyList<string>? contentTypes = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadWithConverter(nameof(OperationResponse.StatusCodes), options, ref statusCodes)
                    || reader.TryReadWithConverter(nameof(OperationResponse.BodyType), options, ref bodyType)
                    || reader.TryReadString(nameof(OperationResponse.BodyMediaType), ref bodyMediaTypeString)
                    || reader.TryReadWithConverter(nameof(OperationResponse.Headers), options, ref headers)
                    || reader.TryReadBoolean(nameof(OperationResponse.IsErrorResponse), ref isErrorResponse)
                    || reader.TryReadWithConverter(nameof(OperationResponse.ContentTypes), options, ref contentTypes);

                if (!isKnownProperty)
                {
                    continue;
                }
            }

            statusCodes = statusCodes ?? throw new JsonException("OperationResponse must have StatusCodes");
            contentTypes ??= [];
            headers ??= [];

            if (!Enum.TryParse<BodyMediaType>(bodyMediaTypeString, true, out var bodyMediaType))
            {
                throw new JsonException();
            }

            var result = new OperationResponse(statusCodes, bodyType, bodyMediaType, headers, isErrorResponse, contentTypes);

            if (id != null)
            {
                _referenceHandler.CurrentResolver.AddReference(id, result);
            }

            return result;
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputOperationResponseConverter : JsonConverter<InputOperationResponse>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputOperationResponseConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputOperationResponse? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<InputOperationResponse>(_referenceHandler.CurrentResolver) ?? CreateOperationResponse(ref reader, null, options);
        }

        public override void Write(Utf8JsonWriter writer, InputOperationResponse value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputOperationResponse CreateOperationResponse(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options)
        {
            var isFirstProperty = id == null;
            IReadOnlyList<int>? statusCodes = null;
            InputType? bodyType = null;
            IReadOnlyList<InputOperationResponseHeader>? headers = null;
            bool isErrorResponse = default;
            IReadOnlyList<string>? contentTypes = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadComplexType("statusCodes", options, ref statusCodes)
                    || reader.TryReadComplexType("bodyType", options, ref bodyType)
                    || reader.TryReadComplexType("headers", options, ref headers)
                    || reader.TryReadBoolean("isErrorResponse", ref isErrorResponse)
                    || reader.TryReadComplexType("contentTypes", options, ref contentTypes);

                if (!isKnownProperty)
                {
                    continue;
                }
            }

            statusCodes = statusCodes ?? throw new JsonException("OperationResponse must have StatusCodes");
            contentTypes ??= [];
            headers ??= [];

            var result = new InputOperationResponse(statusCodes, bodyType, headers, isErrorResponse, contentTypes);

            if (id != null)
            {
                _referenceHandler.CurrentResolver.AddReference(id, result);
            }

            return result;
        }
    }
}

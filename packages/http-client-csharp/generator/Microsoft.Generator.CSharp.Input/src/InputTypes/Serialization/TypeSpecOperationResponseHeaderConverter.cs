// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecOperationResponseHeaderConverter : JsonConverter<OperationResponseHeader>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecOperationResponseHeaderConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override OperationResponseHeader? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<OperationResponseHeader>(_referenceHandler.CurrentResolver) ?? CreateOperationResponseHeader(ref reader, null, options);
        }

        public override void Write(Utf8JsonWriter writer, OperationResponseHeader value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private OperationResponseHeader CreateOperationResponseHeader(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options)
        {
            var isFirstProperty = id == null;
            string? name = null;
            string? nameInResponse = null;
            string? description = null;
            InputType? type = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(OperationResponseHeader.Name), ref name)
                    || reader.TryReadString(nameof(OperationResponseHeader.NameInResponse), ref nameInResponse)
                    || reader.TryReadString(nameof(OperationResponseHeader.Description), ref description)
                    || reader.TryReadWithConverter(nameof(OperationResponseHeader.Type), options, ref type);

                if (!isKnownProperty)
                {
                    continue;
                }
            }

            name = name ?? throw new JsonException("OperationResponseHeader must have Name");
            nameInResponse = nameInResponse ?? throw new JsonException("OperationResponseHeader must have NameInResponse");
            description = description ?? string.Empty;
            type = type ?? throw new JsonException("OperationResponseHeader must have Type");

            var result = new OperationResponseHeader(name, nameInResponse, description, type);

            if (id != null)
            {
                _referenceHandler.CurrentResolver.AddReference(id, result);
            }

            return result;
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecOperationResponseHeaderConverter : JsonConverter<InputOperationResponseHeader>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecOperationResponseHeaderConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputOperationResponseHeader? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<InputOperationResponseHeader>(_referenceHandler.CurrentResolver) ?? CreateOperationResponseHeader(ref reader, null, options);
        }

        public override void Write(Utf8JsonWriter writer, InputOperationResponseHeader value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputOperationResponseHeader CreateOperationResponseHeader(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options)
        {
            var isFirstProperty = id == null;
            string? name = null;
            string? nameInResponse = null;
            string? summary = null;
            string? doc = null;
            InputType? type = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputOperationResponseHeader.Name), ref name)
                    || reader.TryReadString(nameof(InputOperationResponseHeader.NameInResponse), ref nameInResponse)
                    || reader.TryReadString("Summary", ref summary)
                    || reader.TryReadString("Doc", ref doc)
                    || reader.TryReadComplexType(nameof(InputOperationResponseHeader.Type), options, ref type);

                if (!isKnownProperty)
                {
                    continue;
                }
            }

            name = name ?? throw new JsonException("OperationResponseHeader must have Name");
            nameInResponse = nameInResponse ?? throw new JsonException("OperationResponseHeader must have NameInResponse");
            type = type ?? throw new JsonException("OperationResponseHeader must have Type");

            var result = new InputOperationResponseHeader(name, nameInResponse, summary, doc, type);

            if (id != null)
            {
                _referenceHandler.CurrentResolver.AddReference(id, result);
            }

            return result;
        }
    }
}

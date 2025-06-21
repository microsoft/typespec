// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputOperationResponseHeaderConverter : JsonConverter<InputOperationResponseHeader>
    {
        public InputOperationResponseHeaderConverter()
        {
        }

        public override InputOperationResponseHeader? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => CreateOperationResponseHeader(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputOperationResponseHeader value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputOperationResponseHeader CreateOperationResponseHeader(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }
            string? name = null;
            string? nameInResponse = null;
            string? summary = null;
            string? doc = null;
            InputType? type = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadString("nameInResponse", ref nameInResponse)
                    || reader.TryReadString("summary", ref summary)
                    || reader.TryReadString("doc", ref doc)
                    || reader.TryReadComplexType("type", options, ref type);

                if (!isKnownProperty)
                {
                    continue;
                }
            }

            name = name ?? throw new JsonException("OperationResponseHeader must have Name");
            nameInResponse = nameInResponse ?? throw new JsonException("OperationResponseHeader must have NameInResponse");
            type = type ?? throw new JsonException("OperationResponseHeader must have Type");

            var result = new InputOperationResponseHeader(name, nameInResponse, summary, doc, type);

            return result;
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputOperationExampleConverter : JsonConverter<InputOperationExample>
    {
        public override InputOperationExample? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => CreateInputHttpOperationExample(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputOperationExample value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputOperationExample CreateInputHttpOperationExample(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }
            string? name = null;
            string? description = null;
            IReadOnlyList<InputParameterExample>? parameters = null;
            string? filePath = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadString("description", ref description)
                    || reader.TryReadString("filePath", ref filePath)
                    || reader.TryReadComplexType("parameters", options, ref parameters);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            var result = new InputOperationExample(name ?? throw new JsonException(), description, parameters ?? throw new JsonException(), filePath ?? throw new JsonException());

            return result;
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputJsonSerializationOptionsConverter : JsonConverter<InputJsonSerializationOptions>
    {
        public InputJsonSerializationOptionsConverter()
        {
        }

        public override InputJsonSerializationOptions Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => ReadInputJsonSerializationOptions(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputJsonSerializationOptions value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputJsonSerializationOptions ReadInputJsonSerializationOptions(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            string? name = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            return new InputJsonSerializationOptions(name ?? throw new JsonException("JsonSerializationOptions must have name"));
        }
    }
}

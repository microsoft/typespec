// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputSerializationOptionsConverter : JsonConverter<InputSerializationOptions>
    {
        public InputSerializationOptionsConverter()
        {
        }

        public override InputSerializationOptions Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => ReadInputSerializationOptions(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputSerializationOptions value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputSerializationOptions ReadInputSerializationOptions(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            InputJsonSerializationOptions? json = null;
            InputXmlSerializationOptions? xml = null;
            InputMultipartOptions? multipart = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("json", options, ref json)
                    || reader.TryReadComplexType("xml", options, ref xml)
                    || reader.TryReadComplexType("multipart", options, ref multipart);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            return new InputSerializationOptions(json, xml, multipart);
        }
    }
}

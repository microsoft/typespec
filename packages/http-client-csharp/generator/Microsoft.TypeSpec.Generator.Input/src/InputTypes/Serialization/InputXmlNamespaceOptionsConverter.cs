// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputXmlNamespaceOptionsConverter : JsonConverter<InputXmlNamespaceOptions>
    {
        public InputXmlNamespaceOptionsConverter()
        {
        }

        public override InputXmlNamespaceOptions Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => ReadInputXmlNamespaceOptions(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputXmlNamespaceOptions value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputXmlNamespaceOptions ReadInputXmlNamespaceOptions(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            string? ns = null;
            string? prefix = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("namespace", ref ns)
                    || reader.TryReadString("prefix", ref prefix);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            return new InputXmlNamespaceOptions(
                ns ?? throw new JsonException("XmlNamespaceOptions must have namespace"),
                prefix ?? throw new JsonException("XmlNamespaceOptions must have prefix")
            );
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputXmlSerializationOptionsConverter : JsonConverter<InputXmlSerializationOptions>
    {
        public InputXmlSerializationOptionsConverter()
        {
        }

        public override InputXmlSerializationOptions Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => ReadInputXmlSerializationOptions(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputXmlSerializationOptions value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputXmlSerializationOptions ReadInputXmlSerializationOptions(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            string? name = null;
            bool? attribute = null;
            InputXmlNamespaceOptions? ns = null;
            bool? unwrapped = null;
            string? itemsName = null;
            InputXmlNamespaceOptions? itemsNs = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadNullableBoolean("attribute", ref attribute)
                    || reader.TryReadComplexType("ns", options, ref ns)
                    || reader.TryReadNullableBoolean("unwrapped", ref unwrapped)
                    || reader.TryReadString("itemsName", ref itemsName)
                    || reader.TryReadComplexType("itemsNs", options, ref itemsNs);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            return new InputXmlSerializationOptions(
                name ?? throw new JsonException("XmlSerializationOptions must have name"),
                attribute,
                ns,
                unwrapped,
                itemsName,
                itemsNs);
        }
    }
}

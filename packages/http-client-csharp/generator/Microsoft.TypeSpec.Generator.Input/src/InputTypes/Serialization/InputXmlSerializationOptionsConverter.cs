// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputXmlSerializationOptionsConverter : JsonConverter<InputXmlSerializationOptions>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputXmlSerializationOptionsConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputXmlSerializationOptions Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputXmlSerializationOptions>(_referenceHandler.CurrentResolver) ?? ReadInputXmlSerializationOptions(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputXmlSerializationOptions value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputXmlSerializationOptions ReadInputXmlSerializationOptions(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            // create an empty options to resolve circular references
            var xmlOptions = new InputXmlSerializationOptions(null!);
            resolver.AddReference(id, xmlOptions);

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

            xmlOptions.Name = name ?? throw new JsonException("XmlSerializationOptions must have name");
            xmlOptions.Attribute = attribute;
            xmlOptions.Namespace = ns;
            xmlOptions.Unwrapped = unwrapped;
            xmlOptions.ItemsName = itemsName;
            xmlOptions.ItemsNamespace = itemsNs;

            return xmlOptions;
        }
    }
}

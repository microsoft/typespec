// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputXmlNamespaceOptionsConverter : JsonConverter<InputXmlNamespaceOptions>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputXmlNamespaceOptionsConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputXmlNamespaceOptions Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputXmlNamespaceOptions>(_referenceHandler.CurrentResolver) ?? ReadInputXmlNamespaceOptions(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputXmlNamespaceOptions value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputXmlNamespaceOptions ReadInputXmlNamespaceOptions(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            // create an empty options to resolve circular references
            var nsOptions = new InputXmlNamespaceOptions(null!, null!);
            resolver.AddReference(id, nsOptions);

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

            nsOptions.Namespace = ns ?? throw new JsonException("XmlNamespaceOptions must have namespace");
            nsOptions.Prefix = prefix ?? throw new JsonException("XmlNamespaceOptions must have prefix");

            return nsOptions;
        }
    }
}

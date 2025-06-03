// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputSerializationOptionsConverter : JsonConverter<InputSerializationOptions>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputSerializationOptionsConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputSerializationOptions Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputSerializationOptions>(_referenceHandler.CurrentResolver) ?? ReadInputSerializationOptions(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputSerializationOptions value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputSerializationOptions ReadInputSerializationOptions(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            // create an empty serialization options to resolve circular references
            var serializationOptions = new InputSerializationOptions();
            resolver.AddReference(id, serializationOptions);

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

            serializationOptions.Json = json;
            serializationOptions.Xml = xml;
            serializationOptions.Multipart = multipart;

            return serializationOptions;
        }
    }
}

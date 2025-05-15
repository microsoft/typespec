// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputJsonSerializationOptionsConverter : JsonConverter<InputJsonSerializationOptions>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputJsonSerializationOptionsConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputJsonSerializationOptions Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputJsonSerializationOptions>(_referenceHandler.CurrentResolver) ?? ReadInputJsonSerializationOptions(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputJsonSerializationOptions value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputJsonSerializationOptions ReadInputJsonSerializationOptions(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            // create an empty options to resolve circular references
            var jsonOptions = new InputJsonSerializationOptions(null!);
            resolver.AddReference(id, jsonOptions);

            string? name = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            jsonOptions.Name = name ?? throw new JsonException("JsonSerializationOptions must have name");

            return jsonOptions;
        }
    }
}

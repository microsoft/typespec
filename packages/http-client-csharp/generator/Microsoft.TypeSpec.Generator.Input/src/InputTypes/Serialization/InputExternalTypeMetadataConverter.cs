// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputExternalTypeMetadataConverter : JsonConverter<InputExternalTypeMetadata>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputExternalTypeMetadataConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputExternalTypeMetadata? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            return reader.ReadReferenceAndResolve<InputExternalTypeMetadata>(_referenceHandler.CurrentResolver) ?? CreateInputExternalTypeMetadata(ref reader, null, options, _referenceHandler.CurrentResolver);
        }

        public override void Write(Utf8JsonWriter writer, InputExternalTypeMetadata value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputExternalTypeMetadata CreateInputExternalTypeMetadata(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? identity = null;
            string? package = null;
            string? minVersion = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref id)
                    || reader.TryReadString("identity", ref identity)
                    || reader.TryReadString("package", ref package)
                    || reader.TryReadString("minVersion", ref minVersion);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            identity = identity ?? throw new JsonException("InputExternalTypeMetadata must have identity");

            var externalTypeProperties = new InputExternalTypeMetadata(identity, package, minVersion);

            if (id != null)
            {
                resolver.AddReference(id, externalTypeProperties);
            }

            return externalTypeProperties;
        }
    }
}

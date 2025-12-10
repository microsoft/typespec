// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputExternalTypeMetadataConverter : JsonConverter<InputExternalTypeMetadata>
    {
        public override InputExternalTypeMetadata? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            return CreateInputExternalTypeMetadata(ref reader);
        }

        public override void Write(Utf8JsonWriter writer, InputExternalTypeMetadata value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputExternalTypeMetadata CreateInputExternalTypeMetadata(ref Utf8JsonReader reader)
        {
            string? identity = null;
            string? package = null;
            string? minVersion = null;

            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("identity", ref identity)
                                      || reader.TryReadString("package", ref package)
                                      || reader.TryReadString("minVersion", ref minVersion);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            identity = identity ?? throw new JsonException("InputExternalTypeMetadata must have identity");

            var externalTypeProperties = new InputExternalTypeMetadata(identity, package, minVersion);

            return externalTypeProperties;
        }
    }
}

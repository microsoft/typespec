// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputApiKeyAuthConverter : JsonConverter<InputApiKeyAuth>
    {
        public InputApiKeyAuthConverter()
        {
        }

        public override InputApiKeyAuth? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => CreateInputApiKeyAuth(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputApiKeyAuth value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputApiKeyAuth CreateInputApiKeyAuth(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            string? name = null;
            string? @in = null;
            string? prefix = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadString("in", ref @in)
                    || reader.TryReadString("prefix", ref prefix);
                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            name = name ?? throw new JsonException("ApiKeyAuth must have Name");

            var result = new InputApiKeyAuth(name, prefix); // TODO -- when we support other kind of auth, we need to change InputApiKeyAuth type to accept the `In` property.
            return result;
        }
    }
}

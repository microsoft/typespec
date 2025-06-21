// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputOAuth2AuthConverter : JsonConverter<InputOAuth2Auth>
    {
        public InputOAuth2AuthConverter()
        {
        }

        public override InputOAuth2Auth? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => CreateInputOAuth2Auth(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputOAuth2Auth value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputOAuth2Auth CreateInputOAuth2Auth(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }
            IReadOnlyList<string>? scopes = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("scopes", options, ref scopes);
                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }
            var result = new InputOAuth2Auth(scopes ?? []);

            return result;
        }
    }
}

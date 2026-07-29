// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputOAuth2FlowConverter : JsonConverter<InputOAuth2Flow>
    {
        public InputOAuth2FlowConverter()
        {
        }

        public override InputOAuth2Flow? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => CreateInputOAuth2Auth(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputOAuth2Flow value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputOAuth2Flow CreateInputOAuth2Auth(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }
            IReadOnlyList<string>? scopes = null;
            string? authorizationUrl = null;
            string? tokenUrl = null;
            string? refreshUrl = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("scopes", options, ref scopes)
                    || reader.TryReadString("authorizationUrl", ref authorizationUrl)
                    || reader.TryReadString("tokenUrl", ref tokenUrl)
                    || reader.TryReadString("refreshUrl", ref refreshUrl);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }
            var result = new InputOAuth2Flow(scopes ?? [], authorizationUrl, tokenUrl, refreshUrl);

            return result;
        }
    }
}

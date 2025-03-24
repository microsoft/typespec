// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputAuthConverter : JsonConverter<InputAuth>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputAuthConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputAuth? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => ReadInputAuth(ref reader, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputAuth value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputAuth? ReadInputAuth(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            InputOAuth2Auth? oAuth2 = null;
            InputApiKeyAuth? apiKey = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("apiKey", options, ref apiKey)
                    || reader.TryReadComplexType("oAuth2", options, ref oAuth2);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            return new InputAuth(apiKey, oAuth2);
        }
    }
}

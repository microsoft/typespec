// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class TypeSpecInputOAuth2AuthConverter : JsonConverter<InputOAuth2Auth>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputOAuth2AuthConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputOAuth2Auth? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputOAuth2Auth>(_referenceHandler.CurrentResolver) ?? CreateInputOAuth2Auth(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputOAuth2Auth value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputOAuth2Auth CreateInputOAuth2Auth(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            IReadOnlyList<string>? scopes = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadComplexType("scopes", options, ref scopes);
                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }
            var result = new InputOAuth2Auth(scopes ?? []);
            if (id != null)
            {
                resolver.AddReference(id, result);
            }
            return result;
        }
    }
}

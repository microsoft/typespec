// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputServiceMethodResponseConverter : JsonConverter<InputServiceMethodResponse>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputServiceMethodResponseConverter (TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputServiceMethodResponse Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputServiceMethodResponse>(_referenceHandler.CurrentResolver) ?? ReadInputServiceMethodResponse(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputServiceMethodResponse value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputServiceMethodResponse ReadInputServiceMethodResponse(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();
            var response = new InputServiceMethodResponse();
            resolver.AddReference(id, response);

            var isFirstProperty = true;
            InputType? type = null;
            IReadOnlyList<string>? resultSegments = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadComplexType("type", options, ref type)
                    || reader.TryReadComplexType("resultSegments", options, ref resultSegments);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            response.Type = type;
            response.ResultSegments = resultSegments;

            return response;
        }
    }
}

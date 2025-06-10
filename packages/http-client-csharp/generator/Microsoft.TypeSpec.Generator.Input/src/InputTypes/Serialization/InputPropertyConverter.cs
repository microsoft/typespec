// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputPropertyConverter : JsonConverter<InputProperty>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputPropertyConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputProperty Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputProperty>(_referenceHandler.CurrentResolver) ?? ReadInputProperty(ref reader, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputProperty value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputProperty ReadInputProperty(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? id = null;
            string? kind = null;

            InputProperty? property = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isIdOrKind = reader.TryReadReferenceId(ref id)
                    || reader.TryReadString("kind", ref kind);
                if (isIdOrKind)
                {
                    continue;
                }
                property = CreatePropertyType(ref reader, id, kind, options, resolver);
            }

            return property ?? CreatePropertyType(ref reader, id, kind, options, resolver);
        }

        private static InputProperty CreatePropertyType(ref Utf8JsonReader reader, string? id, string? kind, JsonSerializerOptions options, ReferenceResolver resolver) => kind switch
        {
            null => throw new JsonException($"InputProperty (id: '{id}') must have a 'Kind' property"),
            ModelPropertyKind => InputModelPropertyConverter.ReadInputModelProperty(ref reader, id, kind, options, resolver),
            HeaderParameterKind => InputHeaderParameterConverter.ReadInputHeaderParameter(ref reader, id, kind, options, resolver),
            QueryParameterKind => InputQueryParameterConverter.ReadInputQueryParameter(ref reader, id, kind, options, resolver),
            PathParameterKind => InputPathParameterConverter.ReadInputPathParameter(ref reader, id, kind, options, resolver),
            BodyParameterKind => InputBodyParameterConverter.ReadInputBodyParameter(ref reader, id, kind, options, resolver),
            _ => throw new JsonException($"Unknown kind for InputProperty (id: '{id}'): '{kind}'"),
        };

        private const string ModelPropertyKind = "property";
        private const string HeaderParameterKind = "header";
        private const string QueryParameterKind = "query";
        private const string PathParameterKind = "path";
        private const string BodyParameterKind = "body";
    }
}

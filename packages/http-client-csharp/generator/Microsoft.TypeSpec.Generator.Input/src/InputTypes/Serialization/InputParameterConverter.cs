// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputParameterConverter : JsonConverter<InputParameter>
    {
        private const string HeaderParameterKind = "header";
        private const string QueryParameterKind = "query";
        private const string PathParameterKind = "path";
        private const string BodyParameterKind = "body";
        private const string EndpointParameterKind = "endpoint";
        private const string MethodParameterKind = "method";
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputParameterConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputParameter? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputParameter>(_referenceHandler.CurrentResolver) ?? CreateInputParameter(ref reader, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputParameter value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputParameter CreateInputParameter(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? id = null;
            string? kind = null;
            InputParameter? parameter = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isIdOrKind = reader.TryReadReferenceId(ref id) || reader.TryReadString("kind", ref kind);

                if (isIdOrKind)
                {
                    continue;
                }
                parameter = CreateDerivedType(ref reader, id, kind, options, resolver);
            }

            return parameter ?? CreateDerivedType(ref reader, id, kind, options, resolver);
        }

        private static InputParameter CreateDerivedType(ref Utf8JsonReader reader, string? id, string? kind, JsonSerializerOptions options, ReferenceResolver resolver) => kind switch
        {
            null => throw new JsonException($"InputParameter (id: '{id}') must have a 'kind' property"),
            MethodParameterKind => InputMethodParameterConverter.ReadInputMethodParameter(ref reader, id, options, resolver),
            HeaderParameterKind => InputHeaderParameterConverter.ReadInputHeaderParameter(ref reader, id, options, resolver),
            QueryParameterKind => InputQueryParameterConverter.ReadInputQueryParameter(ref reader, id, options, resolver),
            PathParameterKind => InputPathParameterConverter.ReadInputPathParameter(ref reader, id, options, resolver),
            BodyParameterKind => InputBodyParameterConverter.ReadInputBodyParameter(ref reader, id, options, resolver),
            EndpointParameterKind => InputEndpointParameterConverter.ReadInputEndpointParameter(ref reader, id, options, resolver),
            _ => throw new JsonException($"Unknown kind for InputParameter (id: '{id}'): '{kind}'"),
        };
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputServiceMethodConverter : JsonConverter<InputServiceMethod>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;
        private const string BasicKind = "basic";
        private const string PagingKind = "paging";
        private const string LongRunningKind = "lro";
        private const string LongRunningPagingKind = "lropaging";

        public InputServiceMethodConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputServiceMethod? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<InputServiceMethod>(_referenceHandler.CurrentResolver) ?? CreateInputServiceMethod(ref reader, options, _referenceHandler.CurrentResolver);
        }

        public override void Write(Utf8JsonWriter writer, InputServiceMethod value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputServiceMethod CreateInputServiceMethod(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? id = null;
            string? kind = null;
            string? name = null;
            InputServiceMethod? method = null;
            var isFirstProperty = true;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isIdOrKind = reader.TryReadReferenceId(ref isFirstProperty, ref id) || reader.TryReadString("kind", ref kind);

                if (isIdOrKind)
                {
                    continue;
                }
                method = CreateDerivedType(ref reader, id, kind, name, options);
            }

            return method ?? CreateDerivedType(ref reader, id, kind, name, options);
        }

        private InputServiceMethod CreateDerivedType(ref Utf8JsonReader reader, string? id, string? kind, string? name, JsonSerializerOptions options) => kind switch
        {
            null => throw new JsonException($"InputType (id: '{id}', name: '{name}') must have a 'Kind' property"),
            BasicKind => InputBasicServiceMethodConverter.CreateInputBasicServiceMethod(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            PagingKind => InputPagingServiceMethodConverter.CreateInputPagingServiceMethod(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            LongRunningKind => InputLongRunningServiceMethodConverter.CreateInputLongRunningServiceMethod(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            LongRunningPagingKind => InputLongRunningPagingServiceMethodConverter.CreateInputLongRunningPagingServiceMethod(ref reader, id, name, options, _referenceHandler.CurrentResolver),
            _ => InputBasicServiceMethodConverter.CreateInputBasicServiceMethod(ref reader, id, name, options, _referenceHandler.CurrentResolver),
        };
    }
}

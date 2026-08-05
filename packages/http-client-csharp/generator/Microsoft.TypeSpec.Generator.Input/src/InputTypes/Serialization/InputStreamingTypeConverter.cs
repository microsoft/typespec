// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputStreamingTypeConverter : JsonConverter<InputStreamingType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputStreamingTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputStreamingType? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputStreamingType>(_referenceHandler.CurrentResolver)
                ?? CreateStreamingType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputStreamingType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputStreamingType CreateStreamingType(
            ref Utf8JsonReader reader,
            string? id,
            string? name,
            JsonSerializerOptions options,
            ReferenceResolver resolver)
        {
            string? crossLanguageDefinitionId = null;
            InputType? valueType = null;
            IReadOnlyList<string>? contentTypes = null;
            string? streamKind = null;
            string? terminalEventType = null;
            string? terminalEventValue = null;

            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();
            var streamingType = new InputStreamingType(name ?? "Stream", string.Empty, null!, []);
            resolver.AddReference(id, streamingType);

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref id)
                    || reader.TryReadString("name", ref name)
                    || reader.TryReadString("crossLanguageDefinitionId", ref crossLanguageDefinitionId)
                    || reader.TryReadComplexType("valueType", options, ref valueType)
                    || reader.TryReadComplexType("contentTypes", options, ref contentTypes)
                    || reader.TryReadString("streamKind", ref streamKind)
                    || reader.TryReadString("terminalEventType", ref terminalEventType)
                    || reader.TryReadString("terminalEventValue", ref terminalEventValue);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            streamingType.Name = name ?? "Stream";
            streamingType.CrossLanguageDefinitionId = crossLanguageDefinitionId ?? string.Empty;
            streamingType.ValueType = valueType ?? throw new JsonException("InputStreamingType must have a valueType.");
            streamingType.ContentTypes = contentTypes ?? [];
            streamingType.StreamKind = streamKind ?? InputStreamingType.JsonLinesStreamKind;
            streamingType.TerminalEventType = terminalEventType;
            streamingType.TerminalEventValue = terminalEventValue;
            return streamingType;
        }
    }
}

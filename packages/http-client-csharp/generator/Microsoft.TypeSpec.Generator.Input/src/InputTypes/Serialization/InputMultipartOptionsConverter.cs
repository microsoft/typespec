// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputMultipartOptionsConverter : JsonConverter<InputMultipartOptions>
    {
        public InputMultipartOptionsConverter()
        {
        }

        public override InputMultipartOptions Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => ReadInputMultipartOptions(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputMultipartOptions value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputMultipartOptions ReadInputMultipartOptions(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            string? name = null;
            bool isFilePart = false;
            bool isMulti = false;
            IReadOnlyList<string>? defaultContentTypes = null;
            InputModelProperty? filename = null;
            InputModelProperty? contentType = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadBoolean("isFilePart", ref isFilePart)
                    || reader.TryReadBoolean("isMulti", ref isMulti)
                    || reader.TryReadComplexType("defaultContentTypes", options, ref defaultContentTypes)
                    || reader.TryReadComplexType("filename", options, ref filename)
                    || reader.TryReadComplexType("contentType", options, ref contentType);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            return new InputMultipartOptions(
                name ?? throw new JsonException("InputMultipartOptions must have name"),
                isFilePart,
                isMulti,
                defaultContentTypes ?? [],
                filename,
                contentType);
        }
    }
}

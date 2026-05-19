// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputBinarySerializationOptionsConverter : JsonConverter<InputBinarySerializationOptions>
    {
        public InputBinarySerializationOptionsConverter()
        {
        }

        public override InputBinarySerializationOptions Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => ReadInputBinarySerializationOptions(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputBinarySerializationOptions value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputBinarySerializationOptions ReadInputBinarySerializationOptions(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            bool isFile = false;
            bool? isText = null;
            IReadOnlyList<string>? contentTypes = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadBoolean("isFile", ref isFile)
                    || reader.TryReadNullableBoolean("isText", ref isText)
                    || reader.TryReadComplexType("contentTypes", options, ref contentTypes);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            return new InputBinarySerializationOptions(isFile, isText, contentTypes);
        }
    }
}

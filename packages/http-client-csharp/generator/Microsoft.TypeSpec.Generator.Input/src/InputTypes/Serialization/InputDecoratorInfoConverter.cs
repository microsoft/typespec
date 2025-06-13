// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.TypeSpec.Generator.Input;

namespace AutoRest.CSharp.Common.Input
{
    internal class InputDecoratorInfoConverter : JsonConverter<InputDecoratorInfo>
    {
        public InputDecoratorInfoConverter()
        {
        }

        public override InputDecoratorInfo? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => CreateDecoratorInfo(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputDecoratorInfo value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputDecoratorInfo? CreateDecoratorInfo(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            string? name = null;
            IReadOnlyDictionary<string, BinaryData>? arguments = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadStringBinaryDataDictionary("arguments", ref arguments);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }
            reader.Read();
            var decoratorInfo = new InputDecoratorInfo(name ?? throw new JsonException("InputDecoratorInfo must have name"), arguments);

            return decoratorInfo;
        }
    }
}

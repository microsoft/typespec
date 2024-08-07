// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Generator.CSharp.Input;

namespace AutoRest.CSharp.Common.Input
{
    internal class TypeSpecInputDecoratorInfoConverter : JsonConverter<InputDecoratorInfo>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputDecoratorInfoConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputDecoratorInfo? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            bool isFirstProperty = true;
            string? id = null;
            string? name = null;
            IReadOnlyDictionary<string, BinaryData>? arguments = null;
            reader.Read();
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputDecoratorInfo.Name).ToLower(), ref name)
                    || reader.TryReadStringBinaryDataDictionary(nameof(InputDecoratorInfo.Arguments).ToLower(), ref arguments);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }
            reader.Read();

            var decoratorInfo = new InputDecoratorInfo(name ?? throw new JsonException("InputDecoratorInfo must have name"), arguments);

            if (id != null)
            {
                _referenceHandler.CurrentResolver.AddReference(id, decoratorInfo);
            }
            return decoratorInfo;
        }

        public override void Write(Utf8JsonWriter writer, InputDecoratorInfo value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");
    }
}

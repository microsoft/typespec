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
            => reader.ReadReferenceAndResolve<InputDecoratorInfo>(_referenceHandler.CurrentResolver) ?? CreateDecoratorInfo(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputDecoratorInfo value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputDecoratorInfo? CreateDecoratorInfo(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            string? name = null;
            IReadOnlyDictionary<string, BinaryData>? arguments = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString("name", ref name)
                    || reader.TryReadStringBinaryDataDictionary("arguments", ref arguments);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }
            reader.Read();
            var decoratorInfo = new InputDecoratorInfo(name ?? throw new JsonException("InputDecoratorInfo must have name"), arguments);

            if (id != null)
            {
                resolver.AddReference(id, decoratorInfo);
            }
            return decoratorInfo;
        }
    }
}

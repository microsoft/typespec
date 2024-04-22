﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputListTypeConverter : JsonConverter<InputList>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputListTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputList? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputList>(_referenceHandler.CurrentResolver) ?? CreateListType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputList value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputList CreateListType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null && name == null;
            bool isNullable = false;
            InputType? elementType = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputList.Name), ref name)
                    || reader.TryReadBoolean(nameof(InputList.IsNullable), ref isNullable)
                    || reader.TryReadWithConverter(nameof(InputList.ElementType), options, ref elementType);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            elementType = elementType ?? throw new JsonException("List must have element type");
            var listType = new InputList(name ?? "List", elementType, false, isNullable);
            if (id != null)
            {
                resolver.AddReference(id, listType);
            }
            return listType;
        }
    }
}

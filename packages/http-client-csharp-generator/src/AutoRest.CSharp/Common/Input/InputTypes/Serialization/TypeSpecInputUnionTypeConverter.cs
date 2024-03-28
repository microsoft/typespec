// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.CodeAnalysis;

namespace AutoRest.CSharp.Common.Input
{
    internal class TypeSpecInputUnionTypeConverter : JsonConverter<InputUnionType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;
        public TypeSpecInputUnionTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputUnionType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputUnionType>(_referenceHandler.CurrentResolver) ?? CreateInputUnionType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputUnionType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputUnionType CreateInputUnionType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null;
            bool isNullable = false;
            var unionItemTypes = new List<InputType>();
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputUnionType.Name), ref name)
                    || reader.TryReadBoolean(nameof(InputUnionType.IsNullable), ref isNullable);

                if (isKnownProperty)
                {
                    continue;
                }

                if (reader.GetString() == nameof(InputUnionType.UnionItemTypes))
                {
                    reader.Read();
                    CreateUnionItemTypes(ref reader, unionItemTypes, options);
                }
                else
                {
                    reader.SkipProperty();
                }
            }

            name = name ?? throw new JsonException($"{nameof(InputLiteralType)} must have a name.");
            if (unionItemTypes == null || unionItemTypes.Count == 0)
            {
                throw new JsonException("Union must have a least one union type");
            }

            var unionType = new InputUnionType(name, unionItemTypes, isNullable);
            if (id != null)
            {
                resolver.AddReference(id, unionType);
            }
            return unionType;
        }

        private static void CreateUnionItemTypes(ref Utf8JsonReader reader, ICollection<InputType> itemTypes, JsonSerializerOptions options)
        {
            if (reader.TokenType != JsonTokenType.StartArray)
            {
                throw new JsonException();
            }
            reader.Read();

            while (reader.TokenType != JsonTokenType.EndArray)
            {
                var type = reader.ReadWithConverter<InputType>(options);
                itemTypes.Add(type ?? throw new JsonException($"null {nameof(InputType)} isn't allowed"));
            }
            reader.Read();
        }
    }
}

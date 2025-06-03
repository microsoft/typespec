// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputPathParameterConverter : JsonConverter<InputPathParameter>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputPathParameterConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputPathParameter Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputPathParameter>(_referenceHandler.CurrentResolver) ?? ReadInputPathParameter(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputPathParameter value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        internal static InputPathParameter ReadInputPathParameter(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            // create an empty model property to resolve circular references
            var property = new InputPathParameter(
                name: null!,
                summary: null,
                doc: null,
                type: null!,
                isRequired: false,
                isReadOnly: false,
                access: null,
                allowReserved: false,
                serializedName: null!);
            resolver.AddReference(id, property);

            string? kind = null;
            string? summary = null;
            string? doc = null;
            string? serializedName = null;
            InputType? type = null;
            bool isReadOnly = false;
            bool isOptional = false;
            string? access = null;
            bool allowReserved = false;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref id)
                    || reader.TryReadString("name", ref name)
                    || reader.TryReadString("kind", ref kind)
                    || reader.TryReadString("summary", ref summary)
                    || reader.TryReadString("doc", ref doc)
                    || reader.TryReadComplexType("type", options, ref type)
                    || reader.TryReadBoolean("readOnly", ref isReadOnly)
                    || reader.TryReadBoolean("optional", ref isOptional)
                    || reader.TryReadString("access", ref access)
                    || reader.TryReadBoolean("allowReserved", ref allowReserved)
                    || reader.TryReadString("serializedName", ref serializedName)
                    || reader.TryReadComplexType("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            property.Name = name ?? throw new JsonException($"{nameof(InputPathParameter)} must have a name.");
            property.Summary = summary;
            property.Doc = doc;
            property.Type = type ?? throw new JsonException($"{nameof(InputPathParameter)} must have a type.");
            property.IsRequired = !isOptional;
            property.IsReadOnly = isReadOnly;
            property.Access = access;
            property.AllowReserved = allowReserved;
            property.Decorators = decorators ?? [];
            property.SerializedName = serializedName ?? throw new JsonException($"{nameof(InputPathParameter)} must have a serializedName.");
            return property;
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputBodyParameterConverter : JsonConverter<InputBodyParameter>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputBodyParameterConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputBodyParameter Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputBodyParameter>(_referenceHandler.CurrentResolver) ?? ReadInputBodyParameter(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputBodyParameter value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        internal static InputBodyParameter ReadInputBodyParameter(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            // create an empty model property to resolve circular references
            var property = new InputBodyParameter(
                name: null!,
                summary: null,
                doc: null,
                type: null!,
                isRequired: false,
                isReadOnly: false,
                access: null,
                serializedName: null!,
                contentTypes: null!,
                defaultContentType: null!);
            resolver.AddReference(id, property);

            string? kind = null;
            string? summary = null;
            string? doc = null;
            string? serializedName = null;
            InputType? type = null;
            bool isReadOnly = false;
            bool isOptional = false;
            string? access = null;
            IReadOnlyList<string>? contentTypes = null;
            string? defaultContentType = null;
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
                    || reader.TryReadString("serializedName", ref serializedName)
                    || reader.TryReadComplexType("contentTypes",options, ref contentTypes)
                    || reader.TryReadComplexType("defaultContentType", options, ref defaultContentType)
                    || reader.TryReadComplexType("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            property.Name = name ?? throw new JsonException($"{nameof(InputBodyParameter)} must have a name.");
            property.Summary = summary;
            property.Doc = doc;
            property.Type = type ?? throw new JsonException($"{nameof(InputBodyParameter)} must have a type.");
            property.IsRequired = !isOptional;
            property.IsReadOnly = isReadOnly;
            property.Access = access;
            property.Decorators = decorators ?? [];
            property.SerializedName = serializedName ?? throw new JsonException($"{nameof(InputBodyParameter)} must have a serializedName.");
            property.ContentTypes = contentTypes ?? throw new JsonException($"{nameof(InputBodyParameter)} must have a contentTypes.");
            property.DefaultContentType = defaultContentType ?? throw new JsonException($"{nameof(InputBodyParameter)} must have a defaultContentType.");
            return property;
        }
    }
}

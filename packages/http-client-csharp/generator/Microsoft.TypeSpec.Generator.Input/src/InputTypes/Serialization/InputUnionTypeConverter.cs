// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputUnionTypeConverter : JsonConverter<InputUnionType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;
        public InputUnionTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputUnionType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputUnionType>(_referenceHandler.CurrentResolver) ?? CreateInputUnionType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputUnionType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputUnionType CreateInputUnionType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            // create an empty model to resolve circular references
            var union = new InputUnionType(null!, null!);
            resolver.AddReference(id, union);

            IReadOnlyList<InputType>? variantTypes = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            InputExternalTypeMetadata? external = null;
            InputExperimentalDetails? experimental = null;
            string? @namespace = null;
            InputModelType? baseModel = null;
            string? discriminatorPropertyName = null;
            string? envelopePropertyName = null;
            IReadOnlyDictionary<string, InputModelType>? discriminatedSubtypes = null;
            bool isExactName = false;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadString("namespace", ref @namespace)
                    || reader.TryReadComplexType("variantTypes", options, ref variantTypes)
                    || reader.TryReadComplexType("baseModel", options, ref baseModel)
                    || reader.TryReadString("discriminatorPropertyName", ref discriminatorPropertyName)
                    || reader.TryReadString("envelopePropertyName", ref envelopePropertyName)
                    || reader.TryReadComplexType("discriminatedSubtypes", options, ref discriminatedSubtypes)
                    || reader.TryReadComplexType("decorators", options, ref decorators)
                    || reader.TryReadComplexType("external", options, ref external)
                    || reader.TryReadComplexType("experimental", options, ref experimental)
                    || reader.TryReadBoolean("isExactName", ref isExactName);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            union.Name = name ?? throw new JsonException($"{nameof(InputLiteralType)} must have a name.");
            if (variantTypes == null || variantTypes.Count == 0)
            {
                throw new JsonException("Union must have a least one union type");
            }
            union.VariantTypes = variantTypes;
            union.Namespace = @namespace ?? string.Empty;
            union.BaseModel = baseModel;
            union.DiscriminatorPropertyName = discriminatorPropertyName;
            union.EnvelopePropertyName = envelopePropertyName;
            union.DiscriminatedSubtypes = discriminatedSubtypes;
            union.Decorators = decorators ?? [];
            union.External = external;
            union.Experimental = experimental;
            union.IsExactName = isExactName;
            return union;
        }
    }
}

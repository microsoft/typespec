// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecInputModelTypeConverter : JsonConverter<InputModelType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputModelTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputModelType? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputModelType>(_referenceHandler.CurrentResolver) ?? CreateModelType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputModelType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputModelType CreateModelType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            // create an empty model to resolve circular references
            var model = new InputModelType(
                name: name!,
                crossLanguageDefinitionId: null!,
                access: null,
                deprecation: null,
                description: null,
                usage: InputModelTypeUsage.None,
                properties: [],
                baseModel: null,
                derivedModels: [],
                discriminatorValue: null,
                discriminatorProperty: null,
                discriminatedSubtypes: null!,
                additionalProperties: null,
                modelAsStruct: false);
            resolver.AddReference(id, model);

            string? crossLanguageDefinitionId = null;
            string? accessibility = null;
            string? deprecation = null;
            string? description = null;
            string? usageString = null;
            InputModelProperty? discriminatorProperty = null;
            string? discriminatorValue = null;
            InputType? additionalProperties = null;
            InputModelType? baseModel = null;
            IReadOnlyList<InputModelProperty>? properties = null;
            IReadOnlyDictionary<string, InputModelType>? discriminatedSubtypes = null;
            bool modelAsStruct = false;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;

            // read all possible properties and throw away the unknown properties
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadString("crossLanguageDefinitionId", ref crossLanguageDefinitionId)
                    || reader.TryReadString("access", ref accessibility)
                    || reader.TryReadString("deprecation", ref deprecation)
                    || reader.TryReadString("description", ref description)
                    || reader.TryReadString("usage", ref usageString)
                    || reader.TryReadWithConverter("discriminatorProperty", options, ref discriminatorProperty)
                    || reader.TryReadString("discriminatorValue", ref discriminatorValue)
                    || reader.TryReadWithConverter("additionalProperties", options, ref additionalProperties)
                    || reader.TryReadWithConverter("baseModel", options, ref baseModel)
                    || reader.TryReadWithConverter("properties", options, ref properties)
                    || reader.TryReadWithConverter("discriminatedSubtypes", options, ref discriminatedSubtypes)
                    || reader.TryReadWithConverter("decorators", options, ref decorators)
                    || reader.TryReadBoolean(nameof(InputModelType.ModelAsStruct), ref modelAsStruct); // TODO -- change this to fetch from the decorator list instead when the decorator is ready

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            model.Name = name ?? throw new JsonException("InputModelType must have name");
            model.CrossLanguageDefinitionId = crossLanguageDefinitionId ?? string.Empty;
            model.Access = accessibility;
            model.Deprecation = deprecation;
            model.Description = description;
            var parsedUsage = Enum.TryParse<InputModelTypeUsage>(usageString, ignoreCase: true, out var usage) ? usage : InputModelTypeUsage.None;
            // TO-DO: Manually add JSON usage flag for now until support for parsing this is added to the TSP https://github.com/microsoft/typespec/issues/3392
            parsedUsage |= InputModelTypeUsage.Json;
            model.Usage = parsedUsage;
            model.DiscriminatorValue = discriminatorValue;
            model.DiscriminatorProperty = discriminatorProperty;
            model.AdditionalProperties = additionalProperties;
            model.BaseModel = baseModel;
            if (properties != null)
            {
                model.Properties = properties;
            }
            if (discriminatedSubtypes != null)
            {
                model.DiscriminatedSubtypes = discriminatedSubtypes;
            }
            model.ModelAsStruct = modelAsStruct;
            if (decorators != null)
            {
                model.Decorators = decorators;
            }

            // if this model has a base, it means this model is a derived model of the base model, add it into the list.
            if (baseModel != null)
            {
                baseModel.AddDerivedModel(model);
            }

            return model;
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputModelTypeConverter : JsonConverter<InputModelType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputModelTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputModelType? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputModelType>(_referenceHandler.CurrentResolver) ?? CreateModelType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputModelType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        internal static InputModelType CreateModelType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            // create an empty model to resolve circular references
            var model = new InputModelType(
                name: name!,
                @namespace: null!,
                crossLanguageDefinitionId: null!,
                access: null,
                deprecation: null,
                summary: null,
                doc: null,
                usage: InputModelTypeUsage.None,
                properties: [],
                baseModel: null,
                derivedModels: [],
                discriminatorValue: null,
                discriminatorProperty: null,
                discriminatedSubtypes: null!,
                additionalProperties: null,
                modelAsStruct: false,
                serializationOptions: null!);
            resolver.AddReference(id, model);

            string? @namespace = null;
            string? crossLanguageDefinitionId = null;
            string? accessibility = null;
            string? deprecation = null;
            string? summary = null;
            string? doc = null;
            string? usageString = null;
            InputModelProperty? discriminatorProperty = null;
            string? discriminatorValue = null;
            InputType? additionalProperties = null;
            InputModelType? baseModel = null;
            IReadOnlyList<InputModelProperty>? properties = null;
            IReadOnlyDictionary<string, InputModelType>? discriminatedSubtypes = null;
            bool modelAsStruct = false;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            InputSerializationOptions? serializationOptions = null;

            // read all possible properties and throw away the unknown properties
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadString("namespace", ref @namespace)
                    || reader.TryReadString("crossLanguageDefinitionId", ref crossLanguageDefinitionId)
                    || reader.TryReadString("access", ref accessibility)
                    || reader.TryReadString("deprecation", ref deprecation)
                    || reader.TryReadString("summary", ref doc)
                    || reader.TryReadString("doc", ref doc)
                    || reader.TryReadString("usage", ref usageString)
                    || reader.TryReadComplexType("discriminatorProperty", options, ref discriminatorProperty)
                    || reader.TryReadString("discriminatorValue", ref discriminatorValue)
                    || reader.TryReadComplexType("additionalProperties", options, ref additionalProperties)
                    || reader.TryReadComplexType("baseModel", options, ref baseModel)
                    || reader.TryReadComplexType("properties", options, ref properties)
                    || reader.TryReadComplexType("discriminatedSubtypes", options, ref discriminatedSubtypes)
                    || reader.TryReadComplexType("decorators", options, ref decorators)
                    || reader.TryReadComplexType("serializationOptions", options, ref serializationOptions)
                    || reader.TryReadBoolean(nameof(InputModelType.ModelAsStruct), ref modelAsStruct); // TODO -- change this to fetch from the decorator list instead when the decorator is ready

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            model.Name = name ?? throw new JsonException("InputModelType must have name");
            model.Namespace = @namespace ?? string.Empty;
            model.CrossLanguageDefinitionId = crossLanguageDefinitionId ?? string.Empty;
            model.Access = accessibility;
            model.Deprecation = deprecation;
            model.Summary = summary;
            model.Doc = doc;
            var parsedUsage = Enum.TryParse<InputModelTypeUsage>(usageString, ignoreCase: true, out var usage) ? usage : InputModelTypeUsage.None;
            model.Usage = parsedUsage;
            model.DiscriminatorValue = discriminatorValue;
            model.DiscriminatorProperty = discriminatorProperty;
            model.AdditionalProperties = additionalProperties;
            model.BaseModel = baseModel;
            model.SerializationOptions = serializationOptions ?? new();
            if (properties != null)
            {
                model.Properties = properties;
            }
            if (discriminatedSubtypes != null)
            {
                model.DiscriminatedSubtypes = discriminatedSubtypes;
            }
            else if (model.DiscriminatorProperty != null)
            {
                model.DiscriminatedSubtypes = new Dictionary<string, InputModelType>();
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

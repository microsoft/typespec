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

            // skip every other property until we have a name
            while (name == null)
            {
                var hasName = reader.TryReadString(nameof(InputModelType.Name), ref name);
                if (!hasName)
                {
                    reader.SkipProperty();
                }
            }
            name = name ?? throw new JsonException("Model must have name");

            var derivedModels = new List<InputModelType>();
            bool isNullable = false;
            string? ns = null;
            string? accessibility = null;
            string? deprecated = null;
            string? description = null;
            string? usageString = null;
            string? discriminatorPropertyName = null;
            string? discriminatorValue = null;
            InputDictionary? inheritedDictionaryType = null;
            InputModelType? baseModel = null;
            IReadOnlyList<InputModelProperty>? properties = null;
            // create an empty model to resolve circular references
            var model = new InputModelType(name, null, null, null, null, InputModelTypeUsage.None, null!, null, derivedModels, null, null, null, false);
            resolver.AddReference(id, model);
            resolver.AddReference($"{model.Name}.{nameof(InputModelType.DerivedModels)}", derivedModels); // TODO we could move the derived model deserialization to the deserialization of input namespace where all models are in place.

            // read all possible properties and throw away the unknown properties
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadBoolean(nameof(InputModelType.IsNullable), ref isNullable)
                    || reader.TryReadString(nameof(InputModelType.Namespace), ref ns)
                    || reader.TryReadString(nameof(InputModelType.Accessibility), ref accessibility)
                    || reader.TryReadString(nameof(InputModelType.Deprecated), ref deprecated)
                    || reader.TryReadString(nameof(InputModelType.Description), ref description)
                    || reader.TryReadString(nameof(InputModelType.Usage), ref usageString)
                    || reader.TryReadString(nameof(InputModelType.DiscriminatorPropertyName), ref discriminatorPropertyName)
                    || reader.TryReadString(nameof(InputModelType.DiscriminatorValue), ref discriminatorValue)
                    || reader.TryReadWithConverter(nameof(InputModelType.InheritedDictionaryType), options, ref inheritedDictionaryType)
                    || reader.TryReadWithConverter(nameof(InputModelType.BaseModel), options, ref baseModel)
                    || reader.TryReadWithConverter(nameof(InputModelType.Properties), options, ref properties);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            model.Namespace = ns;
            model.Accessibility = accessibility;
            model.Deprecated = deprecated;
            model.Description = description;
            model.Usage = Enum.TryParse<InputModelTypeUsage>(usageString, ignoreCase: true, out var usage) ? usage : InputModelTypeUsage.None; // TODO -- refine later
            model.DiscriminatorValue = discriminatorValue;
            model.DiscriminatorPropertyName = discriminatorPropertyName;
            model.InheritedDictionaryType = inheritedDictionaryType;
            model.IsNullable = isNullable;
            model.BaseModel = baseModel;
            model.Properties = properties ?? Array.Empty<InputModelProperty>();

            if (baseModel is not null)
            {
                var baseModelDerived = (List<InputModelType>)resolver.ResolveReference($"{baseModel.Name}.{nameof(InputModelType.DerivedModels)}");
                baseModelDerived.Add(model);
            }

            return model;
        }

        private static InputModelType CreateInputModelTypeInstance(string? id, string? name, string? ns, string? accessibility, string? deprecated, string? description, string? usageString, string? discriminatorValue, string? discriminatorPropertyValue, InputModelType? baseModel, IReadOnlyList<InputModelProperty> properties, InputDictionary? inheritedDictionaryType, bool isNullable, ReferenceResolver resolver)
        {
            name = name ?? throw new JsonException("Model must have name");
            InputModelTypeUsage usage = InputModelTypeUsage.None;
            if (usageString != null)
            {
                Enum.TryParse(usageString, ignoreCase: true, out usage);
            }

            var derivedModels = new List<InputModelType>();
            var model = new InputModelType(name, ns, accessibility, deprecated, description, usage, properties, baseModel, derivedModels, discriminatorValue, discriminatorPropertyValue, inheritedDictionaryType, isNullable: isNullable);

            if (id is not null)
            {
                resolver.AddReference(id, model);
                resolver.AddReference($"{model.Name}.{nameof(InputModelType.DerivedModels)}", derivedModels);
            }

            if (baseModel is not null)
            {
                var baseModelDerived = (List<InputModelType>)resolver.ResolveReference($"{baseModel.Name}.{nameof(InputModelType.DerivedModels)}");
                baseModelDerived.Add(model);
            }

            return model;
        }

        private static void CreateProperties(ref Utf8JsonReader reader, ICollection<InputModelProperty> properties, JsonSerializerOptions options)
        {
            if (reader.TokenType != JsonTokenType.StartArray)
            {
                throw new JsonException();
            }
            reader.Read();

            while (reader.TokenType != JsonTokenType.EndArray)
            {
                var property = reader.ReadWithConverter<InputModelProperty>(options);
                properties.Add(property ?? throw new JsonException($"null {nameof(InputModelProperty)} is not allowed"));
            }
            reader.Read();
        }
    }
}

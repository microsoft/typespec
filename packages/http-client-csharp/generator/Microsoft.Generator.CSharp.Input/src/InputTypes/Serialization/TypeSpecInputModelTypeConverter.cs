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
            var model = new InputModelType(name!, null, null, null, null, InputModelTypeUsage.None, null!, null, new List<InputModelType>(), null, null, null, false);
            resolver.AddReference(id, model);

            bool isNullable = false;
            string? ns = null;
            string? accessibility = null;
            string? deprecated = null;
            string? description = null;
            string? usageString = null;
            string? discriminatorPropertyName = null;
            string? discriminatorValue = null;
            InputDictionaryType? inheritedDictionaryType = null;
            InputModelType? baseModel = null;
            IReadOnlyList<InputModelProperty>? properties = null;

            // read all possible properties and throw away the unknown properties
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString(nameof(InputModelType.Name), ref name)
                    || reader.TryReadBoolean(nameof(InputModelType.IsNullable), ref isNullable)
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

            model.Name = name ?? throw new JsonException("InputModelType must have name");
            model.Namespace = ns;
            model.Accessibility = accessibility;
            model.Deprecated = deprecated;
            model.Description = description;
            var parsedUsage = Enum.TryParse<InputModelTypeUsage>(usageString, ignoreCase: true, out var usage) ? usage : InputModelTypeUsage.None;
            // TO-DO: Manually add JSON usage flag for now until support for parsing this is added to the TSP https://github.com/microsoft/typespec/issues/3392
            parsedUsage |= InputModelTypeUsage.Json;
            model.Usage = parsedUsage;
            model.DiscriminatorValue = discriminatorValue;
            model.DiscriminatorPropertyName = discriminatorPropertyName;
            model.InheritedDictionaryType = inheritedDictionaryType;
            model.IsNullable = isNullable;
            model.BaseModel = baseModel;
            model.Properties = properties ?? Array.Empty<InputModelProperty>();

            return model;
        }
    }
}

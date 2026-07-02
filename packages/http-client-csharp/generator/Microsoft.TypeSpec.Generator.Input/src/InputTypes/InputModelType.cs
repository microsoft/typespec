// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.TypeSpec.Generator.Input.Extensions;

namespace Microsoft.TypeSpec.Generator.Input
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public class InputModelType : InputType
    {
        private const string UnknownDiscriminatorValue = "unknown";
        private IReadOnlyList<InputModelProperty> _properties = [];
        private IList<InputModelType> _derivedModels = [];

        // TODO: Follow up issue https://github.com/microsoft/typespec/issues/3619. After https://github.com/Azure/typespec-azure/pull/966 is completed, update this type and remove the "modelAsStruct" parameter.
        public InputModelType(string name, string @namespace, string crossLanguageDefinitionId, string? access, string? deprecation, string? summary, string? doc, InputModelTypeUsage usage, IReadOnlyList<InputModelProperty> properties, InputModelType? baseModel, IReadOnlyList<InputModelType> derivedModels, string? discriminatorValue, InputModelProperty? discriminatorProperty, IReadOnlyDictionary<string, InputModelType> discriminatedSubtypes, InputType? additionalProperties, bool modelAsStruct, InputSerializationOptions serializationOptions, bool isDynamicModel)
            : base(name)
        {
            Namespace = @namespace;
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            Access = access;
            Deprecation = deprecation;
            Summary = summary;
            Doc = doc;
            Usage = usage;
            Properties = properties;
            BaseModel = baseModel;
            foreach (var model in derivedModels)
            {
                AddDerivedModel(model);
            }
            IsDynamicModel = isDynamicModel;
            if (discriminatedSubtypes is not null)
            {
                foreach (var model in discriminatedSubtypes.Values)
                {
                    AddDerivedModel(model);
                }
            }
            DiscriminatorValue = discriminatorValue;
            DiscriminatorProperty = discriminatorProperty;
            DiscriminatedSubtypes = discriminatedSubtypes!;
            AdditionalProperties = additionalProperties;
            IsUnknownDiscriminatorModel = DiscriminatorValue == UnknownDiscriminatorValue;
            IsPropertyBag = false;
            ModelAsStruct = modelAsStruct;
            SerializationOptions = serializationOptions;
        }

        public string Namespace { get; internal set; }
        public string CrossLanguageDefinitionId { get; internal set; }
        public string? Access { get; internal set; }
        public string? Deprecation { get; internal set; }
        public string? Summary { get; internal set; }
        public string? Doc { get; internal set; }
        public InputModelTypeUsage Usage { get; internal set; }

        public IReadOnlyList<InputModelProperty> Properties
        {
            get => _properties;
            internal set
            {
                foreach (var property in value)
                {
                    property.EnclosingType = this;
                }

                _properties = value;
            }
        }

        public bool ModelAsStruct { get; internal set; }
        public InputModelType? BaseModel { get; internal set; }
        public IReadOnlyList<InputModelType> DerivedModels => _derivedModels.AsReadOnly();
        internal void AddDerivedModel(InputModelType model)
        {
            model.BaseModel = this;
            _derivedModels.Add(model);
            // If this base model is dynamic, the derived model should also be dynamic
            if (IsDynamicModel && !model.IsDynamicModel)
            {
                model.IsDynamicModel = true;
            }
        }
        public string? DiscriminatorValue { get; internal set; }
        public InputModelProperty? DiscriminatorProperty { get; internal set; }
        private Dictionary<string, InputModelType>? _discriminatedSubtypes;
        public IReadOnlyDictionary<string, InputModelType> DiscriminatedSubtypes
        {
            get => _discriminatedSubtypes ??= new Dictionary<string, InputModelType>();
            internal set
            {
                if (value is null || DiscriminatorProperty == null || DiscriminatorValue == UnknownDiscriminatorValue)
                    return;

                _discriminatedSubtypes = new Dictionary<string, InputModelType>(value);

                InputModelTypeUsage usage = Usage;
                if (!usage.HasFlag(InputModelTypeUsage.Xml))
                {
                    usage |= InputModelTypeUsage.Json;
                }
                var cleanBaseName = Name.ToIdentifierName();

                _discriminatedSubtypes.Add(UnknownDiscriminatorValue,
                new InputModelType(
                    $"Unknown{cleanBaseName}",
                    Namespace,
                    $"Unknown{cleanBaseName}",
                    "internal",
                    null,
                    null,
                    $"Unknown variant of {cleanBaseName}",
                    usage,
                    [],
                    this,
                    [],
                    UnknownDiscriminatorValue,
                    DiscriminatorProperty,
                    new Dictionary<string, InputModelType>(),
                    null,
                    false,
                    SerializationOptions,
                    IsDynamicModel)
                );
            }
        }
        public InputType? AdditionalProperties { get; internal set; }
        public bool IsUnknownDiscriminatorModel { get; init; }
        public bool IsPropertyBag { get; init; }
        public bool IsDynamicModel { get; internal set; }
        public bool IsFileType { get; internal set; }
        public InputSerializationOptions SerializationOptions { get; internal set; }

        public IEnumerable<InputModelType> GetSelfAndBaseModels() => EnumerateBase(this);

        public IEnumerable<InputModelType> GetAllBaseModels() => EnumerateBase(BaseModel);

        public IReadOnlyList<InputModelType> GetAllDerivedModels()
        {
            var list = new List<InputModelType>(DerivedModels);
            for (var i = 0; i < list.Count; i++)
            {
                list.AddRange(list[i].DerivedModels);
            }

            return list;
        }

        private static IEnumerable<InputModelType> EnumerateBase(InputModelType? model)
        {
            while (model != null)
            {
                yield return model;
                model = model.BaseModel;
            }
        }

        /// <summary>
        /// Updates the properties of the input model type.
        /// </summary>
        /// <param name="name">The new name for the model.</param>
        /// <param name="namespace">The new namespace for the model.</param>
        /// <param name="crossLanguageDefinitionId">The new cross-language definition ID for the model.</param>
        /// <param name="access">The new access modifier for the model.</param>
        /// <param name="deprecation">The new deprecation message for the model.</param>
        /// <param name="summary">The new summary for the model.</param>
        /// <param name="doc">The new documentation for the model.</param>
        /// <param name="usage">The new usage for the model.</param>
        /// <param name="properties">The new properties for the model.</param>
        /// <param name="baseModel">The new base model for the model.</param>
        /// <param name="discriminatorValue">The new discriminator value for the model.</param>
        /// <param name="discriminatorProperty">The new discriminator property for the model.</param>
        /// <param name="additionalProperties">The new additional properties type for the model.</param>
        /// <param name="modelAsStruct">The new value indicating whether the model should be generated as a struct.</param>
        /// <param name="serializationOptions">The new serialization options for the model.</param>
        /// <param name="isDynamicModel">The new value indicating whether the model is dynamic.</param>
        public void Update(
            string? name = null,
            string? @namespace = null,
            string? crossLanguageDefinitionId = null,
            string? access = null,
            string? deprecation = null,
            string? summary = null,
            string? doc = null,
            InputModelTypeUsage? usage = null,
            IEnumerable<InputModelProperty>? properties = null,
            InputModelType? baseModel = null,
            string? discriminatorValue = null,
            InputModelProperty? discriminatorProperty = null,
            InputType? additionalProperties = null,
            bool? modelAsStruct = null,
            InputSerializationOptions? serializationOptions = null,
            bool? isDynamicModel = null)
        {
            if (name != null)
            {
                Name = name;
            }

            if (@namespace != null)
            {
                Namespace = @namespace;
            }

            if (crossLanguageDefinitionId != null)
            {
                CrossLanguageDefinitionId = crossLanguageDefinitionId;
            }

            if (access != null)
            {
                Access = access;
            }

            if (deprecation != null)
            {
                Deprecation = deprecation;
            }

            if (summary != null)
            {
                Summary = summary;
            }

            if (doc != null)
            {
                Doc = doc;
            }

            if (usage.HasValue)
            {
                Usage = usage.Value;
            }

            if (properties != null)
            {
                Properties = [.. properties];
            }

            if (baseModel != null)
            {
                BaseModel = baseModel;
            }

            if (discriminatorValue != null)
            {
                DiscriminatorValue = discriminatorValue;
            }

            if (discriminatorProperty != null)
            {
                DiscriminatorProperty = discriminatorProperty;
            }

            if (additionalProperties != null)
            {
                AdditionalProperties = additionalProperties;
            }

            if (modelAsStruct.HasValue)
            {
                ModelAsStruct = modelAsStruct.Value;
            }

            if (serializationOptions != null)
            {
                SerializationOptions = serializationOptions;
            }

            if (isDynamicModel.HasValue)
            {
                IsDynamicModel = isDynamicModel.Value;
            }
        }

        private string GetDebuggerDisplay()
        {
            return $"Model (Name: {Name})";
        }
    }
}

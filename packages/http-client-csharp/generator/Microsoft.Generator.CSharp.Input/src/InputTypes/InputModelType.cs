// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;

namespace Microsoft.Generator.CSharp.Input
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public class InputModelType : InputType
    {
        private const string UnknownDiscriminatorValue = "unknown";
        private IReadOnlyList<InputModelProperty> _properties = [];
        private IList<InputModelType> _derivedModels = [];

        // TODO: Follow up issue https://github.com/microsoft/typespec/issues/3619. After https://github.com/Azure/typespec-azure/pull/966 is completed, update this type and remove the "modelAsStruct" parameter.
        public InputModelType(string name, string crossLanguageDefinitionId, string? access, string? deprecation, string? summary, string? doc, InputModelTypeUsage usage, IReadOnlyList<InputModelProperty> properties, InputModelType? baseModel, IReadOnlyList<InputModelType> derivedModels, string? discriminatorValue, InputModelProperty? discriminatorProperty, IReadOnlyDictionary<string, InputModelType> discriminatedSubtypes, InputType? additionalProperties, bool modelAsStruct)
            : base(name)
        {
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
        }

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

                var cleanBaseName = Name.ToCleanName();
                _discriminatedSubtypes.Add(UnknownDiscriminatorValue,
                new InputModelType(
                    $"Unknown{cleanBaseName}",
                    $"Unknown{cleanBaseName}",
                    "internal",
                    null,
                    null,
                    $"Unknown variant of {cleanBaseName}",
                    Usage | InputModelTypeUsage.Json,
                    [],
                    this,
                    [],
                    UnknownDiscriminatorValue,
                    new InputModelProperty(
                        DiscriminatorProperty!.Name,
                        DiscriminatorProperty.SerializedName,
                        DiscriminatorProperty.Summary,
                        DiscriminatorProperty.Doc,
                        DiscriminatorProperty.Type,
                        DiscriminatorProperty.IsRequired,
                        DiscriminatorProperty.IsReadOnly,
                        DiscriminatorProperty.IsDiscriminator),
                    new Dictionary<string, InputModelType>(),
                    null,
                    false)
                );
            }
        }
        public InputType? AdditionalProperties { get; internal set; }
        public bool IsUnknownDiscriminatorModel { get; init; }
        public bool IsPropertyBag { get; init; }

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

        private string GetDebuggerDisplay()
        {
            return $"Model (Name: {Name})";
        }
    }
}

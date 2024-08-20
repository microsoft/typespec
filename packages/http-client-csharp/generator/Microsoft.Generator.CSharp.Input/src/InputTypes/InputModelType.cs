// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;

namespace Microsoft.Generator.CSharp.Input
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public class InputModelType : InputType
    {
        // TODO: Follow up issue https://github.com/microsoft/typespec/issues/3619. After https://github.com/Azure/typespec-azure/pull/966 is completed, update this type and remove the "modelAsStruct" parameter.
        public InputModelType(string name, string crossLanguageDefinitionId, string? access, string? deprecation, string? description, InputModelTypeUsage usage, IReadOnlyList<InputModelProperty> properties, InputModelType? baseModel, IReadOnlyList<InputModelType> derivedModels, string? discriminatorValue, InputModelProperty? discriminatorProperty, IReadOnlyDictionary<string, InputModelType> discriminatedSubtypes, InputType? additionalProperties, bool modelAsStruct)
            : base(name)
        {
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            Access = access;
            Deprecation = deprecation;
            Description = description;
            Usage = usage;
            Properties = properties;
            BaseModel = baseModel;
            DerivedModelsInternal = [.. derivedModels];
            DiscriminatorValue = discriminatorValue;
            DiscriminatorProperty = discriminatorProperty;
            DiscriminatedSubtypes = discriminatedSubtypes;
            AdditionalProperties = additionalProperties;
            IsUnknownDiscriminatorModel = false;
            IsPropertyBag = false;
            ModelAsStruct = modelAsStruct;
        }

        public string CrossLanguageDefinitionId { get; internal set; }
        public string? Access { get; internal set; }
        public string? Deprecation { get; internal set; }
        public string? Description { get; internal set; }
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

        private IReadOnlyList<InputModelProperty> _properties = [];
        public bool ModelAsStruct { get; internal set; }
        public InputModelType? BaseModel { get; internal set; }
        public IReadOnlyList<InputModelType> DerivedModels => DerivedModelsInternal;
        internal List<InputModelType> DerivedModelsInternal { get; }
        public string? DiscriminatorValue { get; internal set; }
        public InputModelProperty? DiscriminatorProperty { get; internal set; }
        public IReadOnlyDictionary<string, InputModelType> DiscriminatedSubtypes { get; internal set; }
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

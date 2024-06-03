// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Diagnostics;

namespace Microsoft.Generator.CSharp.Input
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]
    public class InputModelType : InputType
    {
        public InputModelType(string name, string? modelNamespace, string? accessibility, string? deprecated, string? description, InputModelTypeUsage usage, IReadOnlyList<InputModelProperty> properties, InputModelType? baseModel, IReadOnlyList<InputModelType> derivedModels, string? discriminatorValue, string? discriminatorPropertyName, InputDictionaryType? inheritedDictionaryType, bool isNullable)
            : base(name, isNullable)
        {
            Namespace = modelNamespace;
            Accessibility = accessibility;
            Deprecated = deprecated;
            Description = description;
            Usage = usage;
            Properties = properties;
            BaseModel = baseModel;
            DerivedModels = derivedModels;
            DiscriminatorValue = discriminatorValue;
            DiscriminatorPropertyName = discriminatorPropertyName;
            InheritedDictionaryType = inheritedDictionaryType;
            IsUnknownDiscriminatorModel = false;
            IsPropertyBag = false;
        }

        public string? Namespace { get; internal set; }
        public string? Accessibility { get; internal set; }
        public string? Deprecated { get; internal set; }
        public string? Description { get; internal set; }
        public InputModelTypeUsage Usage { get; internal set; }
        public IReadOnlyList<InputModelProperty> Properties { get; internal set; }
        public InputModelType? BaseModel { get; internal set; }
        public IReadOnlyList<InputModelType> DerivedModels { get; internal set; }
        public string? DiscriminatorValue { get; internal set; }
        public string? DiscriminatorPropertyName { get; internal set; }
        public InputDictionaryType? InheritedDictionaryType { get; internal set; }
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
            return $"Model (Name: {Name}, {Namespace})";
        }
    }
}

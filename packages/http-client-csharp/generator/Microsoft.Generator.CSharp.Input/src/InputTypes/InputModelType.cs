// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputModelType : InputType
    {
        public InputModelType(string name, string? modelNamespace, string? accessibility, string? deprecated, string? description, InputModelTypeUsage usage, IReadOnlyList<InputModelProperty> properties, InputModelType? baseModel, IReadOnlyList<InputModelType> derivedModels, string? discriminatorValue, string? discriminatorPropertyName, InputDictionary? inheritedDictionaryType, bool isNullable)
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

        public string? Namespace { get; }
        public string? Accessibility { get; }
        public string? Deprecated { get; }
        public string? Description { get; }
        public InputModelTypeUsage Usage { get; }
        public IReadOnlyList<InputModelProperty> Properties { get; }
        public InputModelType? BaseModel { get; private set; }
        public IReadOnlyList<InputModelType> DerivedModels { get; }
        public string? DiscriminatorValue { get; }
        public string? DiscriminatorPropertyName { get; }
        public InputDictionary? InheritedDictionaryType { get; }
        public bool IsUnknownDiscriminatorModel { get; init; }
        public bool IsPropertyBag { get; init; }

        internal void SetBaseModel(InputModelType? baseModel, [CallerFilePath] string filepath = "", [CallerMemberName] string caller = "")
        {
            Debug.Assert(filepath.EndsWith($"{nameof(TypeSpecInputModelTypeConverter)}.cs"), $"This method is only allowed to be called in `TypeSpecInputModelTypeConverter.cs`");
            Debug.Assert(caller == nameof(TypeSpecInputModelTypeConverter.CreateModelType), $"This method is only allowed to be called in `TypeSpecInputModelTypeConverter.CreateModelType`");
            BaseModel = baseModel;
        }

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

        internal InputModelType ReplaceProperty(InputModelProperty property, InputType inputType)
        {
            return new InputModelType(
                Name,
                Namespace,
                Accessibility,
                Deprecated,
                Description,
                Usage,
                GetNewProperties(property, inputType),
                BaseModel,
                DerivedModels,
                DiscriminatorValue,
                DiscriminatorPropertyName,
                InheritedDictionaryType,
                IsNullable);
        }

        private IReadOnlyList<InputModelProperty> GetNewProperties(InputModelProperty property, InputType inputType)
        {
            List<InputModelProperty> properties = new List<InputModelProperty>();
            foreach (var myProperty in Properties)
            {
                if (myProperty.Equals(property))
                {
                    properties.Add(new InputModelProperty(
                        myProperty.Name,
                        myProperty.SerializedName,
                        myProperty.Description,
                        myProperty.Type.GetCollectionEquivalent(inputType),
                        myProperty.IsRequired,
                        myProperty.IsReadOnly,
                        myProperty.IsDiscriminator));
                }
                else
                {
                    properties.Add(myProperty);
                }
            }
            return properties;
        }

        public bool Equals(InputType other, bool handleCollections)
        {
            if (!handleCollections)
                return Equals(other);

            switch (other)
            {
                case InputDictionary otherDictionary:
                    return Equals(otherDictionary.ValueType);
                case InputList otherList:
                    return Equals(otherList.ElementType);
                default:
                    return Equals(other);
            }
        }

        internal InputModelProperty? GetProperty(InputModelType key)
        {
            foreach (var property in Properties)
            {
                if (key.Equals(property.Type, true))
                    return property;
            }
            return null;
        }
    }
}

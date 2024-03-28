// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.CompilerServices;

namespace AutoRest.CSharp.Common.Input
{
    internal record InputModelType(string Name, string? Namespace, string? Accessibility, string? Deprecated, string? Description, InputModelTypeUsage Usage, IReadOnlyList<InputModelProperty> Properties, InputModelType? BaseModel, IReadOnlyList<InputModelType> DerivedModels, string? DiscriminatorValue, string? DiscriminatorPropertyName, InputDictionaryType? InheritedDictionaryType, bool IsNullable)
        : InputType(Name, IsNullable)
    {
        /// <summary>
        /// Indicates if this model is the Unknown derived version of a model with discriminator
        /// </summary>
        public bool IsUnknownDiscriminatorModel { get; init; } = false;
        /// <summary>
        /// Indicates if this model is a property bag
        /// </summary>
        public bool IsPropertyBag { get; init; } = false;

        public InputModelType? BaseModel { get; private set; } = BaseModel;
        /** In some case, its base model will have a propety whose type is the model, in tspCodeModel.json, the property type is a reference,
         * during descerializing, we need to create the model and add it to the referernce map before load base model, otherwise, the deserialization crash.
         * Then we need to set the BaseModel to the model instance after the base model is loaded. That is BaseModel is settable.
         * This function is to set the BaseModel to an existing model instance.
         */
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
                case InputDictionaryType otherDictionary:
                    return Equals(otherDictionary.ValueType);
                case InputListType otherList:
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

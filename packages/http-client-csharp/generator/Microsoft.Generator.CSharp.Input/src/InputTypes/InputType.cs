// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Input.InputTypes;

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// Represents an input type to the generator.
    /// </summary>
    public abstract class InputType
    {
        /// <summary>
        /// Construct a new <see cref="InputType"/> instance
        /// </summary>
        /// <param name="name">The name of the input type.</param>
        protected InputType(string name)
        {
            Name = name;
        }

        public string Name { get; internal set; }

        internal InputType GetCollectionEquivalent(InputType inputType)
        {
            switch (this)
            {
                case InputListType listType:
                    return new InputListType(
                        listType.Name,
                        listType.ElementType.GetCollectionEquivalent(inputType),
                        listType.IsEmbeddingsVector);
                case InputDictionaryType dictionaryType:
                    return new InputDictionaryType(
                        dictionaryType.Name,
                        dictionaryType.KeyType,
                        dictionaryType.ValueType.GetCollectionEquivalent(inputType));
                default:
                    return inputType;
            }
        }
        public InputType WithNullable(bool isNullable)
        {
            if (isNullable)
                return new InputNullableType(this);
            return this;
        }
        public InputType GetImplementType() => this switch
        {
            InputNullableType nullableType => nullableType.Type,
            _ => this
        };
    }
}

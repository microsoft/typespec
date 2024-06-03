// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
        /// <param name="isNullable">Flag to determine if the type is nullable.</param>
        protected InputType(string name, bool isNullable)
        {
            Name = name;
            IsNullable = isNullable;
        }

        public string Name { get; internal set; }
        public bool IsNullable { get; internal set; }

        internal InputType GetCollectionEquivalent(InputType inputType)
        {
            switch (this)
            {
                case InputListType listType:
                    return new InputListType(
                        listType.Name,
                        listType.ElementType.GetCollectionEquivalent(inputType),
                        listType.IsEmbeddingsVector,
                        listType.IsNullable);
                case InputDictionaryType dictionaryType:
                    return new InputDictionaryType(
                        dictionaryType.Name,
                        dictionaryType.KeyType,
                        dictionaryType.ValueType.GetCollectionEquivalent(inputType),
                        dictionaryType.IsNullable);
                default:
                    return inputType;
            }
        }
    }
}

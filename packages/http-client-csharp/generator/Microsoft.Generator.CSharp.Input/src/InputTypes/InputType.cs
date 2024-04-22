// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// Represents an input type to the generator.
    /// </summary>
    /// <param name="Name">The name of the input type.</param>
    /// <param name="IsNullable">Flag to determine if the type is nullable.</param>
    public abstract class InputType
    {
        protected InputType(string name, bool isNullable)
        {
            Name = name;
            IsNullable = isNullable;
        }

        public string Name { get; }
        public bool IsNullable { get; }

        internal InputType GetCollectionEquivalent(InputType inputType)
        {
            switch (this)
            {
                case InputList listType:
                    return new InputList(
                        listType.Name,
                        listType.ElementType.GetCollectionEquivalent(inputType),
                        listType.IsEmbeddingsVector,
                        listType.IsNullable);
                case InputDictionary dictionaryType:
                    return new InputDictionary(
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

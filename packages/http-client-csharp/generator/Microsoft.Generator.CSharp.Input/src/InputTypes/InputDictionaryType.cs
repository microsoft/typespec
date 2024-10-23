// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// Represents an input dictionary type.
    /// </summary>
    public sealed class InputDictionaryType : InputType
    {
        /// <summary>Creates an instance of <see cref="InputDictionaryType"/>.</summary>
        /// <param name="name">The name of the dictionary.</param>
        /// <param name="keyType">The key's <see cref="InputType"/>.</param>
        /// <param name="valueType">The value's <see cref="InputType"/>.</param>
        /// <param name="isNullable">Flag used to determine if the input dictionary type is nullable.</param>
        public InputDictionaryType(string name, InputType keyType, InputType valueType) : base(name)
        {
            KeyType = keyType;
            ValueType = valueType;
        }

        public InputType KeyType { get; }
        public InputType ValueType { get; }
    }
}

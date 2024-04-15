// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// Represents an input dictionary type.
    /// </summary>
    public sealed class InputDictionary : InputType
    {
        /// <summary>Creates an intance of <see cref="InputDictionary"/>.</summary>
        /// <param name="name">The name of the dictionary.</param>
        /// <param name="keyType">The key's <see cref="InputType"/>.</param>
        /// <param name="valueType">The value's <see cref="InputType"/>.</param>
        /// <param name="isNullable">Flag used to determine if the input dictionary type is nullable.</param>
        public InputDictionary(string name, InputType keyType, InputType valueType, bool isNullable) : base(name, isNullable)
        {
            KeyType = keyType;
            ValueType = valueType;
        }

        public InputType KeyType { get; }
        public InputType ValueType { get; }
    }
}

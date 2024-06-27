// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// Represents an input list type.
    /// </summary>
    public sealed class InputArrayType : InputType
    {
        /// <summary>Creates an instance of <see cref="InputArrayType"/>.</summary>
        /// <param name="Name">The name of the list type.</param>
        /// <param name="ElementType">The element's <see cref="InputType"/>.</param>
        /// <param name="IsEmbeddingsVector">Flag used to determine if the input list type is embedding vector.</param>
        /// <param name="IsNullable">Flag used to determine if the input list type is nullable.</param>
        public InputArrayType(string name, InputType valueType, bool isEmbeddingsVector) : base(name)
        {
            ValueType = valueType;
            IsEmbeddingsVector = isEmbeddingsVector;
        }

        public InputType ValueType { get; }
        public bool IsEmbeddingsVector { get; }
    }
}

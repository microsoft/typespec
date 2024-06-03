// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// Represents an input list type.
    /// </summary>
    public sealed class InputListType : InputType
    {
        /// <summary>Creates an instance of <see cref="InputListType"/>.</summary>
        /// <param name="Name">The name of the list type.</param>
        /// <param name="ElementType">The element's <see cref="InputType"/>.</param>
        /// <param name="IsEmbeddingsVector">Flag used to determine if the input list type is embedding vector.</param>
        /// <param name="IsNullable">Flag used to determine if the input list type is nullable.</param>
        public InputListType(string name, InputType elementType, bool isEmbeddingsVector, bool isNullable) : base(name, isNullable)
        {
            ElementType = elementType;
            IsEmbeddingsVector = isEmbeddingsVector;
        }

        public InputType ElementType { get; }
        public bool IsEmbeddingsVector { get; }
    }
}

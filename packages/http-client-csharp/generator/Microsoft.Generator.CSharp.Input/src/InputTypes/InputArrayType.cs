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
        /// <param name="name">The name of the list type.</param>
        /// <param name="crossLanguageDefinitionId">The crossLanguageDefinitionId of the list type. For a builtin array, it should be `TypeSpec.Array`.</param>
        /// <param name="valueType">The element's <see cref="InputType"/>.</param>
        public InputArrayType(string name, string crossLanguageDefinitionId, InputType valueType) : base(name)
        {
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            ValueType = valueType;
        }

        public string CrossLanguageDefinitionId { get; }
        public InputType ValueType { get; }
    }
}

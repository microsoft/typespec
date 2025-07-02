// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    public sealed class InputArrayType : InputType
    {        public InputArrayType(string name, string crossLanguageDefinitionId, InputType valueType) : base(name)
        {
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            ValueType = valueType;
        }

        public string CrossLanguageDefinitionId { get; }
        public InputType ValueType { get; }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    public sealed class InputDictionaryType : InputType
    {        public InputDictionaryType(string name, InputType keyType, InputType valueType) : base(name)
        {
            KeyType = keyType;
            ValueType = valueType;
        }

        public InputType KeyType { get; }
        public InputType ValueType { get; }
    }
}

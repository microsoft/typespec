// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputEnumTypeIntegerValue : InputEnumTypeValue
    {
        public InputEnumTypeIntegerValue(string name, int integerValue, InputPrimitiveType valueType, InputEnumType enumType, string? summary, string? doc) : base(name, integerValue, valueType, enumType, summary, doc)
        {
            IntegerValue = integerValue;
        }

        public int IntegerValue { get; }
    }
}

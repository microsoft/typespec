// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputEnumTypeIntegerValue : InputEnumTypeValue
    {
        public InputEnumTypeIntegerValue(string name, int integerValue, InputPrimitiveType valueType, string? summary, string? doc, InputEnumType? enumType = default)
            : base(name, integerValue, valueType, summary, doc, enumType)
        {
            IntegerValue = integerValue;
        }

        public int IntegerValue { get; }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputEnumTypeFloatValue : InputEnumTypeValue
    {
        public InputEnumTypeFloatValue(string name, float floatValue, InputPrimitiveType valueType, string? summary, string? doc, InputEnumType? enumType = default)
            : base(name, floatValue, valueType, summary, doc, enumType)
        {
            FloatValue = floatValue;
        }

        public float FloatValue { get; }
    }
}

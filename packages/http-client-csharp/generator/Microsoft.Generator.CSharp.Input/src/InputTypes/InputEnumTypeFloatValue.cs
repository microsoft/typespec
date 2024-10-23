// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    internal class InputEnumTypeFloatValue : InputEnumTypeValue
    {
        public InputEnumTypeFloatValue(string name, float floatValue, InputPrimitiveType valueType, string? description) : base(name, floatValue, valueType, description)
        {
            FloatValue = floatValue;
        }

        public float FloatValue { get; }
    }
}

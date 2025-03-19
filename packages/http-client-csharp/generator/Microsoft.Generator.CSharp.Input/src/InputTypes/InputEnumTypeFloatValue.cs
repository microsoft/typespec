// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    internal class InputEnumTypeFloatValue : InputEnumTypeValue
    {
        public InputEnumTypeFloatValue(string name, float floatValue, InputPrimitiveType valueType, string? summary, string? doc) : base(name, floatValue, valueType, summary, doc)
        {
            FloatValue = floatValue;
        }

        public float FloatValue { get; }
    }
}

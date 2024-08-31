// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace TypeSpec.Generator.Input
{
    internal class InputEnumTypeFloatValue : InputEnumTypeValue
    {
        public InputEnumTypeFloatValue(string name, float floatValue, string? description) : base(name, floatValue, description)
        {
            FloatValue = floatValue;
        }

        public float FloatValue { get; }
    }
}

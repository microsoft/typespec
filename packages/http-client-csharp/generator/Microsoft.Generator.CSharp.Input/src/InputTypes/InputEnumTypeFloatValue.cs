// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    internal class InputEnumTypeFloatValue : InputEnumTypeValue<float>
    {
        public InputEnumTypeFloatValue(string name, float floatValue, string? description) : base(name, floatValue, description)
        {
            FloatValue = floatValue;
        }

        public float FloatValue { get; }
    }
}

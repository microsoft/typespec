﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    internal class InputEnumTypeIntegerValue : InputEnumTypeValue
    {
        public InputEnumTypeIntegerValue(string name, int integerValue, string? description) : base(name, integerValue, description)
        {
            IntegerValue = integerValue;
        }

        public int IntegerValue { get; }
    }
}

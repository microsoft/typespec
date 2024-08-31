// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace TypeSpec.Generator.Input
{
    internal class InputEnumTypeStringValue : InputEnumTypeValue
    {
        public InputEnumTypeStringValue(string name, string stringValue, string? description) : base(name, stringValue, description)
        {
            StringValue = stringValue;
        }

        public string StringValue { get; }
    }
}

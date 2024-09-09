// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    internal class InputEnumTypeStringValue : InputEnumTypeValue
    {
        public InputEnumTypeStringValue(string name, string stringValue, InputPrimitiveType valueType, string? description) : base(name, stringValue, valueType, description)
        {
            StringValue = stringValue;
        }

        public string StringValue { get; }
    }
}

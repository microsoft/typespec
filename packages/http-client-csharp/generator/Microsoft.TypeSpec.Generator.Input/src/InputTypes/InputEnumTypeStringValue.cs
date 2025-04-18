// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputEnumTypeStringValue : InputEnumTypeValue
    {
        public InputEnumTypeStringValue(string name, string stringValue, InputPrimitiveType valueType, InputEnumType enumType, string? summary, string? doc) : base(name, stringValue, valueType, enumType, summary, doc)
        {
            StringValue = stringValue;
        }

        public string StringValue { get; }
    }
}

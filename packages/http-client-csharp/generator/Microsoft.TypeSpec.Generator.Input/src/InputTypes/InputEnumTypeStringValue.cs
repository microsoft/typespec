// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputEnumTypeStringValue : InputEnumTypeValue
    {
        public InputEnumTypeStringValue(string name, string stringValue, InputPrimitiveType valueType, string? summary, string? doc, InputEnumType? enumType = default)
            : base(name, stringValue, valueType, summary, doc, enumType)
        {
            StringValue = stringValue;
        }

        public string StringValue { get; }
    }
}

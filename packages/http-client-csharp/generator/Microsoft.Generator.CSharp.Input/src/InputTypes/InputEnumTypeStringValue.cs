// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    internal class InputEnumTypeStringValue : InputEnumTypeValue
    {
        public InputEnumTypeStringValue(string name, string stringValue, InputPrimitiveType valueType, string? summary, string? doc) : base(name, stringValue, valueType, summary, doc)
        {
            StringValue = stringValue;
        }

        public string StringValue { get; }
    }
}

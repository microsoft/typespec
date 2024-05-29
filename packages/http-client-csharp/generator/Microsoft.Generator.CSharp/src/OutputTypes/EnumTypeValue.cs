// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp
{
    public class EnumTypeValue
    {
        public EnumTypeValue(string name, FieldDeclaration field, object value)
        {
            Name = name;
            Field = field;
            Value = value;
        }

        public string Name { get; }

        public FieldDeclaration Field { get; }

        public object Value { get; }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp
{
    public class EnumTypeMember
    {
        public EnumTypeMember(string name, FieldDeclaration field, object value)
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

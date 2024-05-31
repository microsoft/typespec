// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp
{
    public class EnumTypeMember
    {
        public EnumTypeMember(string name, FieldProvider field, object value)
        {
            Name = name;
            Field = field;
            Value = value;
        }

        public string Name { get; }

        public FieldProvider Field { get; }

        public object Value { get; }
    }
}

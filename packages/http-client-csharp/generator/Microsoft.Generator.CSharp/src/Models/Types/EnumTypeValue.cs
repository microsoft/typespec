// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp
{
    public class EnumTypeValue
    {
        public EnumTypeValue(InputEnumTypeValue value)
        {
            Name = value.Name.ToCleanName();
            Value = value.Value;
            Description = value.Description;
        }

        public string Name { get; }

        public object Value { get; }

        public string? Description { get; }
    }
}

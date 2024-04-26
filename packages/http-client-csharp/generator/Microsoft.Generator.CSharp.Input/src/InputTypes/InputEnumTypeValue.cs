// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputEnumTypeValue
    {
        public InputEnumTypeValue(string name, object value, string? description)
        {
            Name = name;
            Value = value;
            Description = description;
        }

        public string Name { get; internal set; }
        public object Value { get; internal set; }
        public string? Description { get; internal set; }

        public virtual string GetJsonValueString() => GetValueString();
        public string GetValueString() => (Value.ToString() ?? string.Empty);
    }
}

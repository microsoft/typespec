// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

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

        public string Name { get; }
        public object Value { get; }
        public string? Description { get; }
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; } = new List<InputDecoratorInfo>();

        public virtual string GetJsonValueString() => GetValueString();
        public string GetValueString() => Value.ToString() ?? string.Empty;
    }
}

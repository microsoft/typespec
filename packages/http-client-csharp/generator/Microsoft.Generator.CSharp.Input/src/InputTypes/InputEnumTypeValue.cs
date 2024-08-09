// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputEnumTypeValue
    {
        public InputEnumTypeValue(string name, object value, string? description, IReadOnlyList<InputDecoratorInfo>? decorators = null)
        {
            Name = name;
            Value = value;
            Description = description;
            Decorators = decorators ?? [];
        }

        public string Name { get; }
        public object Value { get; }
        public string? Description { get; }
        public IReadOnlyList<InputDecoratorInfo> Decorators { get; internal set; }

        public virtual string GetJsonValueString() => GetValueString();
        public string GetValueString() => Value.ToString() ?? string.Empty;
    }
}

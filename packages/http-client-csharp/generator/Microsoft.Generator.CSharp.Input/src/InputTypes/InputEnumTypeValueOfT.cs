// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
#pragma warning disable SA1649 // File name should match first type name
    public class InputEnumTypeValue<T> : InputEnumTypeValue where T : notnull
#pragma warning restore SA1649 // File name should match first type name
    {
        public InputEnumTypeValue(string name, T value, string? description)
            : base(name, description)
        {
            Value = value;
        }

        public T Value { get; }

        public virtual string GetJsonValueString() => GetValueString();
        public string GetValueString() => Value.ToString() ?? string.Empty;
    }
}

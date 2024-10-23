// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputConstant
    {
        public InputConstant(object? value, InputType type)
        {
            Value = value;
            Type = type;
        }

        public object? Value { get; }
        public InputType Type { get; }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputExampleRawValue : InputExampleValue
    {
        public InputExampleRawValue(InputType type, object? rawValue) : base(type)
        {
            RawValue = rawValue;
        }

        public object? RawValue { get; }
    }
}

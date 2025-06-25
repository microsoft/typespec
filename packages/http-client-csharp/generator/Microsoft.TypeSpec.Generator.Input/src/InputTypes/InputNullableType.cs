// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputNullableType : InputType
    {
        public InputNullableType(InputType type) : base("nullable")
        {
            Type = type;
        }

        public InputType Type { get; internal set; }
    }
}

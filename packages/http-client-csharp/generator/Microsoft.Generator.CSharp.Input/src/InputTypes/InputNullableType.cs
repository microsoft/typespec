// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.Input
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

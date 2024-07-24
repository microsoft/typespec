// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Input.InputTypes;

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputNullableType : InputType
    {
        public InputNullableType(InputType type, IReadOnlyList<InputDecoratorInfo> decorators) : base("nullable", decorators)
        {
            Type = type;
        }

        public InputType Type { get; internal set; }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputNullableType : InputType
    {
        public InputNullableType(InputType type, IReadOnlyList<InputDecoratorInfo>? decorators = null) : base("nullable", decorators)
        {
            Type = type;
        }

        public InputType Type { get; internal set; }
    }
}

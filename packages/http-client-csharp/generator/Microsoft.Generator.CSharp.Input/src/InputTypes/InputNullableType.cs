// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class InputNullableType : InputType
    {
        public InputNullableType(InputType type) : this(type, Array.Empty<InputDecoratorInfo>())
        {
        }
        public InputNullableType(InputType type, IReadOnlyList<InputDecoratorInfo> decorators) : base("nullable", decorators)
        {
            Type = type;
        }

        public InputType Type { get; internal set; }
    }
}

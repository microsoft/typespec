// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputGenericType : InputType
    {
        public InputGenericType(Type type, IReadOnlyList<InputType> arguments, bool isNullable) : base(type.Name, isNullable)
        {
            Type = type;
            Arguments = arguments;
        }

        public Type Type { get; }
        public IReadOnlyList<InputType> Arguments { get; }
    }
}

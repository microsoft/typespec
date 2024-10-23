// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Primitives
{
    [Flags]
    public enum FieldModifiers
    {
        Public = 1 << 0,
        Internal = 1 << 1,
        Protected = 1 << 2,
        Private = 1 << 3,
        Static = 1 << 4,
        ReadOnly = 1 << 5,
        Const = 1 << 6
    }
}

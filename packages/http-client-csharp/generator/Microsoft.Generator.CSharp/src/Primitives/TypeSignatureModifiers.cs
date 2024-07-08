// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Primitives
{
    [Flags]
    public enum TypeSignatureModifiers
    {
        None = 0,
        // accessability modifiers
        Public = 1 << 0,
        Internal = 1 << 1,
        Private = 1 << 2,
        Protected = 1 << 3,
        // type modifiers
        Class = 1 << 4,
        Struct = 1 << 5,
        Enum = 1 << 6,
        Interface = 1 << 7,
        // other modifiers
        Static = 1 << 8,
        Partial = 1 << 9,
        Sealed = 1 << 10,
        Abstract = 1 << 11,
        ReadOnly = 1 << 12,
    }
}

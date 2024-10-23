// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Primitives
{
    [Flags]
    public enum MethodSignatureModifiers
    {
        None = 0,
        Public = 1,
        Internal = 2,
        Protected = 4,
        Private = 8,
        Static = 16,
        Extension = 32,
        Virtual = 64,
        Async = 128,
        New = 256,
        Override = 512,
        Operator = 1024,
        Explicit = 2048,
        Implicit = 4096
    }
}

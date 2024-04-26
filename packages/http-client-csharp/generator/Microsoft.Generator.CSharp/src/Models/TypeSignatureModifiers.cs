// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp
{
    [Flags]
    public enum TypeSignatureModifiers
    {
        None = 0,
        Public = 1,
        Internal = 2,
        Private = 8,
        Static = 16,
        Partial = 32,
        Sealed = 64,
        Abstract = 128,
    }
}

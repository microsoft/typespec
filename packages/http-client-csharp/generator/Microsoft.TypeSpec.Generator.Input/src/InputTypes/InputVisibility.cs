// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>HTTP lifecycle visibility flags, matching TypeSpec.Http.Visibility.</summary>
    [Flags]
    public enum InputVisibility
    {
        None = 0,
        Read = 1,
        Create = 2,
        Update = 4,
        Delete = 8,
        Query = 16,
        All = Read | Create | Update | Delete | Query
    }
}

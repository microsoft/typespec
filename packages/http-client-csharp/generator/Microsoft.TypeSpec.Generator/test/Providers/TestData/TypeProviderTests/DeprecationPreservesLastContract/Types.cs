// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics.CodeAnalysis;

namespace Sample.Models
{
    public class StableModel { }

    [Obsolete("Previous message")]
    public class ObsoleteModel { }

    [Experimental("PREVIEW001")]
    public class PreviewModel { }

    public enum StableEnum { One }

    [Obsolete("Previous message")]
    public enum ObsoleteEnum { One }

    public readonly partial struct StableChoice { }

    [Obsolete("Previous message")]
    public readonly partial struct ObsoleteChoice { }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Sample.Models
{
    [Obsolete("Use Current instead.", DiagnosticId = "OBS001")]
    public partial class Legacy
    {
    }

    [Obsolete("Use CurrentChoice instead.", DiagnosticId = "OBS001")]
    public readonly partial struct LegacyChoice
    {
    }
}

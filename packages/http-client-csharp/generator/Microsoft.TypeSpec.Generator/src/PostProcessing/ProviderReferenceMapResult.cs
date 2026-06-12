// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.CodeAnalysis;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed record ProviderReferenceMapResult(
        ProjectId ProjectId,
        HashSet<string> InternalizeCandidates,
        HashSet<string> RemoveCandidates)
    {
    }
}

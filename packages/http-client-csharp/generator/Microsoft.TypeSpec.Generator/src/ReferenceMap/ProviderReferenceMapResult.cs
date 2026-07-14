// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed record ProviderReferenceMapResult(
        HashSet<string> InternalizeCandidates,
        HashSet<string> PublicCandidates,
        HashSet<string> RemoveCandidates,
        HashSet<string> Nodes)
    {
    }
}

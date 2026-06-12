// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed record ProviderReferenceMapShadowResult(
        HashSet<string> InternalizeCandidates,
        HashSet<string> RemoveCandidates)
    {
        public static ProviderReferenceMapShadowResult Empty { get; } = new([], []);
    }
}

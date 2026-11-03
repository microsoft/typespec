// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    // Producer references are dependencies. Authorization must never be keyed by their equality/hash.
    internal sealed record SourceOccurrenceId(Guid Generation, string File, string MemberPath, string RootRole, int RootIndex, string EdgePath);
}

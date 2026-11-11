// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Immutable;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    // Traversal evidence only. A receipt is not a source-edit/selection/publication certificate.
    internal sealed record SourceConsumptionReceipt(Guid Generation, string File, int RootCount,
        ImmutableArray<SourceOccurrenceId> Consumed, bool WasCurrentAtEndOfWrite);
}

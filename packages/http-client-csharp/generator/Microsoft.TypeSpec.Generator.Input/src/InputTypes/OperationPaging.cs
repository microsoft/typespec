// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class OperationPaging
    {
        public IReadOnlyList<string> ItemPropertySegments { get; internal set; }
        public NextLink? NextLink { get; internal set; }
        public ContinuationToken? ContinuationToken { get; internal set; }

        public OperationPaging(IReadOnlyList<string> itemPropertySegments, NextLink? nextLink, ContinuationToken? continuationToken)
        {
            ItemPropertySegments = itemPropertySegments;
            NextLink = nextLink;
            ContinuationToken = continuationToken;
        }
    }
}

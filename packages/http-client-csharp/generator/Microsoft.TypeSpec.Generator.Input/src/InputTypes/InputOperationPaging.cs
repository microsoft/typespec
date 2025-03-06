// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Input
{
    public sealed class InputOperationPaging
    {
        public IReadOnlyList<string> ItemPropertySegments { get; internal set; }
        public InputNextLink? NextLink { get; internal set; }
        public InputContinuationToken? ContinuationToken { get; internal set; }

        public InputOperationPaging(IReadOnlyList<string> itemPropertySegments, InputNextLink? nextLink, InputContinuationToken? continuationToken)
        {
            ItemPropertySegments = itemPropertySegments;
            NextLink = nextLink;
            ContinuationToken = continuationToken;
        }
    }
}

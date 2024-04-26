// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class OperationPaging
    {
        public OperationPaging(string? nextLinkName = null, string? itemName = null)
        {
            NextLinkName = nextLinkName;
            ItemName = itemName;
        }

        public string? NextLinkName { get; internal set; }
        public string? ItemName { get; internal set; }
        internal Func<InputOperation>? NextLinkOperationRef { get; init; }
        internal InputOperation? NextLinkOperation => NextLinkOperationRef?.Invoke() ?? null;
    }
}

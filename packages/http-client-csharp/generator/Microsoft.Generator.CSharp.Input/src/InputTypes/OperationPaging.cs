// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    public sealed class OperationPaging
    {
        public OperationPaging(string? nextLinkName = null, string? itemName = null)
        {
            NextLinkName = nextLinkName;
            ItemName = itemName;
        }

        public string? NextLinkName { get; }
        public string? ItemName { get; }
        internal Func<InputOperation>? NextLinkOperationRef { get; init; }
        internal InputOperation? NextLinkOperation => NextLinkOperationRef?.Invoke() ?? null;
    }
}

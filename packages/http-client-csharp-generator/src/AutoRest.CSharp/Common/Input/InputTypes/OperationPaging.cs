// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace AutoRest.CSharp.Common.Input;

internal record OperationPaging(string? NextLinkName, string? ItemName)
{
    public InputOperation? NextLinkOperation => NextLinkOperationRef?.Invoke() ?? null;
    public Func<InputOperation>? NextLinkOperationRef { get; init; }
    public OperationPaging() : this(null, null) { }
}

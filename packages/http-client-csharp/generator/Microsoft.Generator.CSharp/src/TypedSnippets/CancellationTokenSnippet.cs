// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record CancellationTokenSnippet(ValueExpression Expression) : TypedSnippet<CancellationToken>(Expression)
    {
        public BoolSnippet CanBeCanceled => new(Property(nameof(CancellationToken.CanBeCanceled)));
    }
}

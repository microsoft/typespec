// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record CancellationTokenExpression(ValueExpression Untyped) : TypedValueExpression<CancellationToken>(Untyped)
    {
        public BoolExpression CanBeCanceled => new(Property(nameof(CancellationToken.CanBeCanceled)));
    }
}

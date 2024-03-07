// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Output.Models.Shared;
using Azure;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure
{
    internal sealed record RequestContextExpression(ValueExpression Untyped) : TypedValueExpression<RequestContext>(Untyped)
    {
        public static RequestContextExpression FromCancellationToken()
            => new(new InvokeStaticMethodExpression(null, "FromCancellationToken", new ValueExpression[] { KnownParameters.CancellationTokenParameter }));
    }
}

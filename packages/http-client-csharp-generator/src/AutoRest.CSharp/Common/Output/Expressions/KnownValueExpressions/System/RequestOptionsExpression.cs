// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.System
{
    internal sealed record RequestOptionsExpression(ValueExpression Untyped) : TypedValueExpression<RequestOptions>(Untyped)
    {
        public static RequestOptionsExpression FromCancellationToken()
            => new(new InvokeStaticMethodExpression(null, "FromCancellationToken", new ValueExpression[] { KnownParameters.CancellationTokenParameter }));
    }
}

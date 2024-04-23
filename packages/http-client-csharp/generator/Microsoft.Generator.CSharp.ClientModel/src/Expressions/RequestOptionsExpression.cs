// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using Microsoft.Generator.CSharp.Expressions;


namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal sealed record RequestOptionsExpression(ValueExpression Untyped) : TypedValueExpression<RequestOptions>(Untyped)
    {
        public static RequestOptionsExpression FromCancellationToken()
            => new(new InvokeStaticMethodExpression(null, nameof(FromCancellationToken), new ValueExpression[] { KnownParameters.CancellationTokenParameter }));
    }
}

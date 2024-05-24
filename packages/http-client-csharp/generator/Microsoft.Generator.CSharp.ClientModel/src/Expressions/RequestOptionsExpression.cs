// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal sealed record RequestOptionsExpression(ValueExpression Untyped) : TypedSnippet<RequestOptions>(Untyped)
    {
        public static RequestOptionsExpression FromCancellationToken()
            => new(new InvokeStaticMethodExpression(null, "FromCancellationToken", new ValueExpression[] { KnownParameters.CancellationTokenParameter }));

        public ValueExpression ErrorOptions => Property(nameof(RequestOptions.ErrorOptions));
    }
}

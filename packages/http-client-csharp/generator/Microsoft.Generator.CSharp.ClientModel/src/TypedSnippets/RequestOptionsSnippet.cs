// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record RequestOptionsSnippet(ValueExpression Untyped) : TypedSnippet<RequestOptions>(Untyped)
    {
        public static RequestOptionsSnippet FromCancellationToken()
            => new(new InvokeStaticMethodExpression(null, "FromCancellationToken", new ValueExpression[] { KnownParameters.CancellationTokenParameter }));

        public ValueExpression ErrorOptions => Property(nameof(RequestOptions.ErrorOptions));
    }
}

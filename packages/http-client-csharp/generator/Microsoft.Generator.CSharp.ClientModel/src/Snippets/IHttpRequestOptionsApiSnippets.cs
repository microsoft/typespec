// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class IHttpRequestOptionsApiSnippets
    {
        public static ScopedApi<IHttpRequestOptionsApi> FromCancellationToken(ValueExpression cancellationToken)
            => new TernaryConditionalExpression(
                cancellationToken.Property(nameof(CancellationToken.CanBeCanceled)),
                New.Instance(
                    ClientModelPlugin.Instance.TypeFactory.HttpRequestOptionsApi.HttpRequestOptionsType,
                    arguments: [],
                    properties: new Dictionary<ValueExpression, ValueExpression>
                        { { new MemberExpression(null, nameof(RequestOptions.CancellationToken)), cancellationToken } },
                    useSingleLineForPropertyInitialization: true),
                    Null).As<IHttpRequestOptionsApi>();

        public static ValueExpression ErrorOptions(this ScopedApi<IHttpRequestOptionsApi> requestOptions) => requestOptions.Property(nameof(RequestOptions.ErrorOptions));
    }
}

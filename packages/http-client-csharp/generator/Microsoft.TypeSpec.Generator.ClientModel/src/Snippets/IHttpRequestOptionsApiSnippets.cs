// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class IHttpRequestOptionsApiSnippets
    {
        public static ScopedApi<IHttpRequestOptionsApi> FromCancellationToken(ValueExpression cancellationToken)
            => new TernaryConditionalExpression(
                cancellationToken.Property(nameof(CancellationToken.CanBeCanceled)),
                New.Instance(
                    ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestOptionsApi.HttpRequestOptionsType,
                    arguments: [],
                    properties: new Dictionary<ValueExpression, ValueExpression>
                        { { new MemberExpression(null, nameof(RequestOptions.CancellationToken)), cancellationToken } },
                    useSingleLineForPropertyInitialization: true),
                    Null).As<IHttpRequestOptionsApi>();

        public static ValueExpression ErrorOptions(this ScopedApi<IHttpRequestOptionsApi> requestOptions) => requestOptions.Property(nameof(RequestOptions.ErrorOptions));
    }
}

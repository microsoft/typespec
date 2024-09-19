// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal static class ValueExpressionExtensions
    {
        public static T ToApi<T>(this ValueExpression valueExpression) where T : ScopedApi
        {
            switch (typeof(T).Name)
            {
                case nameof(ClientResponseApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.CreateClientResponse(valueExpression);
                case nameof(HttpResponseApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.CreateHttpResponse(valueExpression);
                default:
                    throw new InvalidOperationException("Invalid type");
            }
        }
    }
}

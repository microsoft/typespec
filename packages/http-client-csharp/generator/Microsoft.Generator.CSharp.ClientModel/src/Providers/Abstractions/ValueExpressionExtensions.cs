// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal static class ValueExpressionExtensions
    {
        public static T ToApi<T>(this ValueExpression valueExpression) where T : ScopedApi
        {
            switch (typeof(T).Name)
            {
                case nameof(ClientResponseApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.ClientResponseApi.FromExpression(valueExpression);
                case nameof(HttpResponseApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpResponseApi.FromExpression(valueExpression);
                case nameof(HttpRequestOptionsApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpRequestOptionsApi.FromExpression(valueExpression);
                case nameof(HttpMessageApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpMessageApi.FromExpression(valueExpression);
                case nameof(HttpRequestApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpRequestApi.FromExpression(valueExpression);
                case nameof(ClientPipelineApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.FromExpression(valueExpression);
                case nameof(StatusCodeClassifierApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.StatusCodeClassifierApi.FromExpression(valueExpression);
                case nameof(RequestContentApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.RequestContentApi.FromExpression(valueExpression);
                default:
                    throw new InvalidOperationException($"Invalid type {typeof(T)}");
            }
        }

        public static T ToApi<T>(this ParameterProvider valueExpression) where T : ScopedApi
        {
            switch (typeof(T).Name)
            {
                case nameof(ClientResponseApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.ClientResponseApi.FromExpression(valueExpression);
                case nameof(HttpResponseApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpResponseApi.FromExpression(valueExpression);
                case nameof(HttpRequestOptionsApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpRequestOptionsApi.FromExpression(valueExpression);
                case nameof(HttpMessageApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpMessageApi.FromExpression(valueExpression);
                case nameof(HttpRequestApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpRequestApi.FromExpression(valueExpression);
                case nameof(ClientPipelineApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.FromExpression(valueExpression);
                case nameof(StatusCodeClassifierApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.StatusCodeClassifierApi.FromExpression(valueExpression);
                case nameof(RequestContentApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.RequestContentApi.FromExpression(valueExpression);
                default:
                    throw new InvalidOperationException($"Invalid type {typeof(T)}");
            }
        }

        public static T ToApi<T>(this PropertyProvider valueExpression) where T : ScopedApi
        {
            switch (typeof(T).Name)
            {
                case nameof(ClientResponseApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.ClientResponseApi.FromExpression(valueExpression);
                case nameof(HttpResponseApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpResponseApi.FromExpression(valueExpression);
                case nameof(HttpRequestOptionsApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpRequestOptionsApi.FromExpression(valueExpression);
                case nameof(HttpMessageApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpMessageApi.FromExpression(valueExpression);
                case nameof(HttpRequestApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.HttpRequestApi.FromExpression(valueExpression);
                case nameof(ClientPipelineApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.ClientPipelineApi.FromExpression(valueExpression);
                case nameof(StatusCodeClassifierApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.StatusCodeClassifierApi.FromExpression(valueExpression);
                case nameof(RequestContentApi):
                    return (T)(object)ClientModelPlugin.Instance.TypeFactory.RequestContentApi.FromExpression(valueExpression);
                default:
                    throw new InvalidOperationException($"Invalid type {typeof(T)}");
            }
        }
    }
}

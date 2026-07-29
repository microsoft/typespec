// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public static class ValueExpressionExtensions
    {
        public static T ToApi<T>(this ValueExpression valueExpression) where T : ScopedApi
        {
            switch (typeof(T).Name)
            {
                case nameof(ClientResponseApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.FromExpression(valueExpression);
                case nameof(HttpResponseApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpResponseApi.FromExpression(valueExpression);
                case nameof(HttpRequestOptionsApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestOptionsApi.FromExpression(valueExpression);
                case nameof(HttpMessageApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpMessageApi.FromExpression(valueExpression);
                case nameof(HttpRequestApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestApi.FromExpression(valueExpression);
                case nameof(ClientPipelineApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.FromExpression(valueExpression);
                case nameof(StatusCodeClassifierApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.StatusCodeClassifierApi.FromExpression(valueExpression);
                case nameof(RequestContentApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.FromExpression(valueExpression);
                default:
                    throw new InvalidOperationException($"Invalid type {typeof(T)}");
            }
        }

        public static T ToApi<T>(this ParameterProvider valueExpression) where T : ScopedApi
        {
            switch (typeof(T).Name)
            {
                case nameof(ClientResponseApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.FromExpression(valueExpression);
                case nameof(HttpResponseApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpResponseApi.FromExpression(valueExpression);
                case nameof(HttpRequestOptionsApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestOptionsApi.FromExpression(valueExpression);
                case nameof(HttpMessageApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpMessageApi.FromExpression(valueExpression);
                case nameof(HttpRequestApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestApi.FromExpression(valueExpression);
                case nameof(ClientPipelineApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.FromExpression(valueExpression);
                case nameof(StatusCodeClassifierApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.StatusCodeClassifierApi.FromExpression(valueExpression);
                case nameof(RequestContentApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.FromExpression(valueExpression);
                default:
                    throw new InvalidOperationException($"Invalid type {typeof(T)}");
            }
        }

        public static T ToApi<T>(this PropertyProvider valueExpression) where T : ScopedApi
        {
            switch (typeof(T).Name)
            {
                case nameof(ClientResponseApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.ClientResponseApi.FromExpression(valueExpression);
                case nameof(HttpResponseApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpResponseApi.FromExpression(valueExpression);
                case nameof(HttpRequestOptionsApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestOptionsApi.FromExpression(valueExpression);
                case nameof(HttpMessageApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpMessageApi.FromExpression(valueExpression);
                case nameof(HttpRequestApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestApi.FromExpression(valueExpression);
                case nameof(ClientPipelineApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.ClientPipelineApi.FromExpression(valueExpression);
                case nameof(StatusCodeClassifierApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.StatusCodeClassifierApi.FromExpression(valueExpression);
                case nameof(RequestContentApi):
                    return (T)(object)ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.FromExpression(valueExpression);
                default:
                    throw new InvalidOperationException($"Invalid type {typeof(T)}");
            }
        }
    }
}

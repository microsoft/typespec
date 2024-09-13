// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.IO;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record ClientResponseApi : ScopedApi
    {
        protected ClientResponseApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract HttpResponseApi GetRawResponse();

        public abstract ClientResponseApi FromValue<T>(ValueExpression valueExpression, HttpResponseApi value);
    }

#pragma warning disable SA1402 // File may only contain a single type
    public abstract record HttpResponseApi : ScopedApi
#pragma warning restore SA1402 // File may only contain a single type
    {
        protected HttpResponseApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract ScopedApi<Stream> ContentStream();

        public abstract ScopedApi<BinaryData> Content();
    }

#pragma warning disable SA1402 // File may only contain a single type
    internal record PipelineResponseProvider : HttpResponseApi
#pragma warning restore SA1402 // File may only contain a single type
    {
        public PipelineResponseProvider(ValueExpression pipelineResponse) : base(typeof(PipelineResponse), pipelineResponse)
        {
        }

        public override ScopedApi<Stream> ContentStream()
            => Original.Property(nameof(HttpResponseApi.ContentStream)).As<Stream>();

        public override ScopedApi<BinaryData> Content()
            => Original.Property(nameof(HttpResponseApi.Content)).As<BinaryData>();
    }

#pragma warning disable SA1402 // File may only contain a single type
    internal record ClientResultProvider : ClientResponseApi
#pragma warning restore SA1402 // File may only contain a single type
    {
        public ClientResultProvider(ValueExpression clientResult) : base(typeof(ClientResult), clientResult)
        {
        }

        public override ClientResponseApi FromValue<ValueType>(ValueExpression valueExpression, HttpResponseApi response)
            => ClientResponseApiSnippets.FromValue<ValueType>(valueExpression, response);

        public override HttpResponseApi GetRawResponse()
            => new PipelineResponseProvider(GetRawResponseExpression());

        private ScopedApi<PipelineResponse> GetRawResponseExpression()
            => Original.Invoke(nameof(ClientResponseApi.GetRawResponse)).As<PipelineResponse>();
    }

#pragma warning disable SA1402 // File may only contain a single type
    internal static class HttpResponseApiSnippets {
#pragma warning restore SA1402 // File may only contain a single type
        public static ScopedApi<Stream> ContentStream(this HttpResponseApi httpResponse)
            => httpResponse.Property(nameof(HttpResponseApi.ContentStream)).As<Stream>();

        public static ScopedApi<BinaryData> Content(this HttpResponseApi httpResponse)
            => httpResponse.Property(nameof(HttpResponseApi.Content)).As<BinaryData>();
    }

#pragma warning disable SA1402 // File may only contain a single type
    internal static class ClientResponseApiSnippets
#pragma warning restore SA1402 // File may only contain a single type
    {
        public static ScopedApi<HttpResponseApi> GetRawResponse(this ClientResponseApi clientResponse)
            => clientResponse.Invoke(nameof(ClientResponseApi.GetRawResponse)).As<HttpResponseApi>();

        public static ClientResponseApi FromValue<T>(ValueExpression value, HttpResponseApi response)
        {
            var expression = Snippet.Static(ClientModelPlugin.Instance.TypeFactory.ClientResponseType).Invoke(nameof(ClientResult.FromValue), [value, response], [typeof(T)], false).ToApi<ClientResponseApi>();
            return expression;
        }
    }

#pragma warning disable SA1402 // File may only contain a single type
    internal static class ValueExpressionExtensions
#pragma warning restore SA1402 // File may only contain a single type
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

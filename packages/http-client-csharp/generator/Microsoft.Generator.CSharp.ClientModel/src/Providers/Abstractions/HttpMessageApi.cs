// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record HttpMessageApi : ScopedApi, IHttpMessageApi
    {
        protected HttpMessageApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract HttpRequestApi Request();

        public abstract HttpResponseApi Response();

        public abstract ValueExpression BufferResponse();

        public abstract MethodBodyStatement ApplyResponseClassifier(StatusCodeClassifierApi statusCodeClassifier);

        public abstract MethodBodyStatement ApplyRequestOptions(HttpRequestOptionsApi options);

        public abstract MethodBodyStatement[] ExtractResponse();

        public abstract HttpMessageApi FromExpression(ValueExpression original);

        public abstract HttpMessageApi ToExpression();

        public abstract CSharpType HttpMessageType { get; }
    }
}

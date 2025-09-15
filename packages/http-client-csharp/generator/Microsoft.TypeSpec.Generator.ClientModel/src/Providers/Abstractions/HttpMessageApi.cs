// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public abstract record HttpMessageApi : ScopedApi, IHttpMessageApi
    {
        protected HttpMessageApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract HttpRequestApi Request();

        public abstract HttpResponseApi Response();

        public abstract ValueExpression BufferResponse();

        public abstract MethodBodyStatement ApplyRequestOptions(HttpRequestOptionsApi options);

        public abstract HttpMessageApi FromExpression(ValueExpression original);

        public abstract HttpMessageApi ToExpression();

        public abstract CSharpType HttpMessageType { get; }
    }
}

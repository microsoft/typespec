// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record HttpMessageApi : ScopedApi
    {
        protected HttpMessageApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract HttpRequestApi Request();

        public abstract HttpResponseApi Response();

        public abstract ValueExpression BufferResponse();

        public abstract ValueExpression ResponseClassifier();

        public abstract MethodBodyStatement Apply(ValueExpression options);

        public abstract MethodBodyStatement[] ExtractResponse();
    }
}

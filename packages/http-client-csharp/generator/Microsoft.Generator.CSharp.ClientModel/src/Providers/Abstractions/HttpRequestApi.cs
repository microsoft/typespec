// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record HttpRequestApi : ScopedApi, IExpressionApi<HttpRequestApi>
    {
        protected HttpRequestApi(CSharpType type, ValueExpression original) : base(type, original)
        {
        }

        public abstract Type UriBuilderType { get; }
        public abstract MethodBodyStatement SetMethod(string httpMethod);
        public abstract MethodBodyStatement SetUri(ValueExpression uri);
        public abstract MethodBodyStatement SetHeaders(IReadOnlyList<ValueExpression> arguments);

        public abstract ValueExpression Content();
        public abstract HttpRequestApi FromExpression(ValueExpression original);
        public abstract HttpRequestApi ToExpression();
    }
}

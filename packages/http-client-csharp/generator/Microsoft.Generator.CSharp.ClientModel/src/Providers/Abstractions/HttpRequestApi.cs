// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record HttpRequestApi : ScopedApi, IExpressionApi<HttpRequestApi>
    {
        protected HttpRequestApi(CSharpType type, ValueExpression original) : base(type, original)
        {
        }

        public abstract AssignmentExpression SetMethod(string httpMethod);

        public abstract AssignmentExpression SetUri(ValueExpression uri);

        public abstract InvokeMethodExpression SetHeaders(IReadOnlyList<ValueExpression> arguments);

        public abstract ValueExpression Content();
        public abstract HttpRequestApi FromExpression(ValueExpression original);
        public abstract HttpRequestApi ToExpression();
    }
}

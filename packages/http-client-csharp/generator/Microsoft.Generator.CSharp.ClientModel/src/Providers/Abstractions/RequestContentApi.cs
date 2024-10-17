// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record RequestContentApi : ScopedApi, IRequestContentApi
    {
        protected RequestContentApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract CSharpType RequestContentType { get; }

        public abstract RequestContentApi FromExpression(ValueExpression original);
        public abstract RequestContentApi ToExpression();
        public abstract MethodBodyStatement[] Create(ValueExpression argument);
    }
}

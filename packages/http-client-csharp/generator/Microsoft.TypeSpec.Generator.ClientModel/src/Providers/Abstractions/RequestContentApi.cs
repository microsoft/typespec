// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
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

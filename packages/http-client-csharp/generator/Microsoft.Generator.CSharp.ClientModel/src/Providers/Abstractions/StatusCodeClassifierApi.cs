// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record StatusCodeClassifierApi : ScopedApi, IStatusCodeClassifierApi
    {
        public StatusCodeClassifierApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract CSharpType ResponseClassifierType { get; }

        public abstract ValueExpression Create(int code);
        public abstract StatusCodeClassifierApi FromExpression(ValueExpression original);
        public abstract StatusCodeClassifierApi ToExpression();
    }
}

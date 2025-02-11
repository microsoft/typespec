// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public abstract record StatusCodeClassifierApi : ScopedApi, IStatusCodeClassifierApi
    {
        public StatusCodeClassifierApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract CSharpType ResponseClassifierType { get; }

        public abstract ValueExpression Create(int code);
        public abstract ValueExpression Create(IEnumerable<int> codes);
        public abstract StatusCodeClassifierApi FromExpression(ValueExpression original);
        public abstract StatusCodeClassifierApi ToExpression();
    }
}

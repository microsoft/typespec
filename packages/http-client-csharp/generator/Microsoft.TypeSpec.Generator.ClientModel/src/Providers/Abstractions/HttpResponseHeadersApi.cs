// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public abstract record HttpResponseHeadersApi : ScopedApi, IHttpResponseHeadersApi
    {
        protected HttpResponseHeadersApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract ScopedApi<bool> TryGetHeader(string name, out ScopedApi<string>? value);

        public abstract CSharpType HttpResponseHeadersType { get; }

        public abstract HttpResponseHeadersApi FromExpression(ValueExpression original);

        public abstract HttpResponseHeadersApi ToExpression();
    }
}

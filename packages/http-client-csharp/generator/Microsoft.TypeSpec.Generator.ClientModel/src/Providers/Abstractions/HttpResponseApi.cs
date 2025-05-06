// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public abstract record HttpResponseApi : ScopedApi, IHttpResponseApi
    {
        protected HttpResponseApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract ScopedApi<Stream> ContentStream();

        public abstract ScopedApi<BinaryData> Content();

        public abstract ScopedApi<bool> IsError();

        public abstract ScopedApi<bool> TryGetHeader(string name, out ScopedApi<string>? value);

        public abstract CSharpType HttpResponseType { get; }

        public abstract HttpResponseApi FromExpression(ValueExpression original);

        public abstract HttpResponseApi ToExpression();
    }
}

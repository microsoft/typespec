// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record HttpResponseApi : ScopedApi
    {
        protected HttpResponseApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract ScopedApi<Stream> ContentStream();

        public abstract ScopedApi<BinaryData> Content();

        public abstract ScopedApi<bool> IsError();
    }
}

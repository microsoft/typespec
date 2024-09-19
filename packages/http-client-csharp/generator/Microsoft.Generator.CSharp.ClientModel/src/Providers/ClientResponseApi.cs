// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record ClientResponseApi : ScopedApi
    {
        protected ClientResponseApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract HttpResponseApi GetRawResponse();
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record HttpRequestOptionsApi : ScopedApi
    {
        public HttpRequestOptionsApi(CSharpType type, ValueExpression original) : base(type, original)
        {
        }

        public abstract ValueExpression ErrorOptions();

        public abstract ValueExpression NoThrow();
    }
}

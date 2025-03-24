// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public abstract record HttpRequestOptionsApi : ScopedApi, IHttpRequestOptionsApi
    {
        public HttpRequestOptionsApi(CSharpType type, ValueExpression original) : base(type, original)
        {
        }

        public abstract ValueExpression ErrorOptions();

        public abstract HttpRequestOptionsApi FromExpression(ValueExpression original);

        public abstract ValueExpression NoThrow();

        public abstract HttpRequestOptionsApi ToExpression();

        public abstract CSharpType HttpRequestOptionsType { get; }
        public abstract string ParameterName { get; }
    }
}

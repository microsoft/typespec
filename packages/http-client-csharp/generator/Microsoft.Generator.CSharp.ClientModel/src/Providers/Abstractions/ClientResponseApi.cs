// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public abstract record ClientResponseApi : ScopedApi, IClientResponseApi
    {
        protected ClientResponseApi(Type type, ValueExpression original) : base(type, original)
        {
        }

        public abstract HttpResponseApi GetRawResponse();

        public abstract ValueExpression FromValue(ValueExpression valueExpression, HttpResponseApi response);

        public abstract ValueExpression FromValue<ValueType>(ValueExpression valueExpression, HttpResponseApi response);

        public abstract ValueExpression FromResponse(ValueExpression valueExpression);

        public abstract ValueExpression CreateAsync(HttpResponseApi response);

        public abstract ClientResponseApi FromExpression(ValueExpression original);

        public abstract ClientResponseApi ToExpression();

        public abstract CSharpType ClientResponseType { get; }

        public abstract CSharpType ClientResponseOfTType { get; }

        public abstract CSharpType ClientResponseExceptionType { get; }
    }
}

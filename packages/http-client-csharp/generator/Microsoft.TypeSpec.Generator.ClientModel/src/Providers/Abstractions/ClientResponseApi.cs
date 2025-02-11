// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
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

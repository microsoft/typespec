// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public interface IHttpResponseApi
    {
        CSharpType HttpResponseType { get; }

        HttpResponseApi FromExpression(ValueExpression original);

        HttpResponseApi ToExpression();
    }
}

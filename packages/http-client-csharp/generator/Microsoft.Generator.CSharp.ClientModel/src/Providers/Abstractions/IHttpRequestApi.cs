// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public interface IHttpRequestApi
    {
        HttpRequestApi FromExpression(ValueExpression original);
        HttpRequestApi ToExpression();
    }
}

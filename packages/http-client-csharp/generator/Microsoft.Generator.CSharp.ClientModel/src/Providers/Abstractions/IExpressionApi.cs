// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public interface IExpressionApi<T> where T : ScopedApi
    {
        T FromExpression(ValueExpression original);

        T ToExpression();
    }
}

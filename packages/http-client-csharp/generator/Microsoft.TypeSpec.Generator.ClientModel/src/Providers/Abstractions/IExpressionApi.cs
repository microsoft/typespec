// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public interface IExpressionApi<T> where T : ScopedApi
    {
        T FromExpression(ValueExpression original);

        T ToExpression();
    }
}

// Copyright(c) Microsoft Corporation.All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record DictionaryInitializerExpression(IReadOnlyList<(ValueExpression Key, ValueExpression Value)>? Values = null) : InitializerExpression;
}

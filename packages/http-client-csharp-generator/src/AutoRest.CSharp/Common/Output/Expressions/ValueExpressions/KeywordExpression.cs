// Copyright(c) Microsoft Corporation.All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record KeywordExpression(string Keyword, ValueExpression? Expression) : ValueExpression;
}

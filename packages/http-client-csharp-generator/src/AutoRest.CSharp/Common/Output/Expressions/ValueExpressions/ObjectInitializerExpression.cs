// Copyright(c) Microsoft Corporation.All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record ObjectInitializerExpression(IReadOnlyDictionary<string, ValueExpression>? Parameters = null, bool UseSingleLine = true) : InitializerExpression;
}

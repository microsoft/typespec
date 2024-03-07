// Copyright(c) Microsoft Corporation.All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record NewInstanceExpression(CSharpType Type, IReadOnlyList<ValueExpression> Parameters, ObjectInitializerExpression? InitExpression = null) : ValueExpression;
}

// Copyright(c) Microsoft Corporation.All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record ConstantExpression(Constant Constant) : TypedValueExpression(Constant.Type, new FormattableStringToExpression(Constant.GetConstantFormattable()));
}

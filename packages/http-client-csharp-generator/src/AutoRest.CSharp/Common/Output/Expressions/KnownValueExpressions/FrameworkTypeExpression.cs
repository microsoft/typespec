// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    /// <summary>
    /// Represents expression which has a return value of a framework type
    /// </summary>
    /// <param name="FrameworkType">Framework type</param>
    /// <param name="Untyped"></param>
    internal sealed record FrameworkTypeExpression(Type FrameworkType, ValueExpression Untyped) : TypedValueExpression(FrameworkType, Untyped);
}

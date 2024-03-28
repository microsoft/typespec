// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record IntExpression(ValueExpression Untyped) : TypedValueExpression<int>(Untyped)
    {
        public static IntExpression MaxValue => new(StaticProperty(nameof(int.MaxValue)));
    }
}

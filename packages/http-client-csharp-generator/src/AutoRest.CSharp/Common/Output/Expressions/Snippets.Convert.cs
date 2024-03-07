// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Common.Output.Models
{
    internal static partial class Snippets
    {
        public static ValueExpression GetConversion(this ValueExpression expression, CSharpType from, CSharpType to)
        {
            if (TypeFactory.RequiresToList(from, to))
            {
                if (from.IsNullable)
                    expression = new NullConditionalExpression(expression);
                return new InvokeStaticMethodExpression(typeof(Enumerable), nameof(Enumerable.ToList), new[] { expression }, CallAsExtension: true);
            }

            return expression;
        }

        internal static MethodBodyStatement Increment(ValueExpression value) => new UnaryOperatorStatement(new UnaryOperatorExpression("++", value, true));

        public static class InvokeConvert
        {
            public static ValueExpression ToDouble(StringExpression value) => new InvokeStaticMethodExpression(typeof(Convert), nameof(Convert.ToDouble), Arguments: new[] { value });
            public static ValueExpression ToInt32(StringExpression value) => new InvokeStaticMethodExpression(typeof(Convert), nameof(Convert.ToInt32), Arguments: new[] { value });
        }
    }
}

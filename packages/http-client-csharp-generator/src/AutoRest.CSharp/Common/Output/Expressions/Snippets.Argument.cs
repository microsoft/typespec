// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Common.Output.Models
{
    internal static partial class Snippets
    {
        internal class Argument
        {
            public static MethodBodyStatement AssertNotNull(ValueExpression variable)
            {
                return new IfStatement(Equal(variable, Null))
                {
                    new ThrowStatement(ThrowExpression(New.ArgumentNullException(variable)))
                };
            }

            public static MethodBodyStatement AssertNotNullOrEmpty(ValueExpression variable)
            {
                return new List<MethodBodyStatement>()
                {
                    AssertNotNull(variable),
                    new IfStatement(Equal(new MemberExpression(variable, "Length"), Literal(0)))
                    {
                        new ThrowStatement(ThrowExpression(New.ArgumentException(variable)))
                    }
                };
            }

            public static MethodBodyStatement ValidateParameter(Parameter parameter)
            {
                return parameter.Validation switch
                {
                    ValidationType.AssertNotNullOrEmpty => AssertNotNullOrEmpty(parameter),
                    ValidationType.AssertNotNull => AssertNotNull(parameter),
                    _ => EmptyStatement
                };
            }
        }
    }
}

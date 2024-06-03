// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static partial class Snippet
    {
        public class Argument
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
                        new ThrowStatement(ThrowExpression(New.ArgumentException(variable, string.Empty)))
                    }
                };
            }

            public static MethodBodyStatement ValidateParameter(Parameter parameter)
            {
                return parameter.Validation switch
                {
                    ParameterValidationType.AssertNotNullOrEmpty => AssertNotNullOrEmpty(parameter),
                    ParameterValidationType.AssertNotNull => AssertNotNull(parameter),
                    _ => EmptyStatement
                };
            }
        }
    }
}

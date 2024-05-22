// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public static partial class Snippets
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
                    ValidationType.AssertNotNullOrEmpty => AssertNotNullOrEmpty(parameter),
                    ValidationType.AssertNotNull => AssertNotNull(parameter),
                    _ => EmptyStatement
                };
            }
        }
    }
}

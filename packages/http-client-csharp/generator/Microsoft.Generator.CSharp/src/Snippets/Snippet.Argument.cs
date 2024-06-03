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
                return ArgumentProvider.Instance.AssertNotNull(variable);
            }

            public static MethodBodyStatement AssertNotNullOrEmpty(ValueExpression variable)
            {
                return ArgumentProvider.Instance.AssertNotNullOrEmpty(variable);
            }

            public static MethodBodyStatement AssertNotNullOrWhiteSpace(ValueExpression variable)
            {
                return ArgumentProvider.Instance.AssertNotNullOrWhiteSpace(variable);
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

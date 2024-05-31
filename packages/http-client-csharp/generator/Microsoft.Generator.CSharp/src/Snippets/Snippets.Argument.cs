// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public static partial class Snippets
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
                    ValidationType.AssertNotNullOrEmpty => AssertNotNullOrEmpty(parameter),
                    ValidationType.AssertNotNull => AssertNotNull(parameter),
                    _ => EmptyStatement
                };
            }
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public class ArgumentSnippets
    {
        private const string AssertNotNullMethodName = "AssertNotNull";
        private const string AssertNotNullOrEmptyMethodName = "AssertNotNullOrEmpty";
        private const string AssertNotNullOrWhiteSpaceMethodName = "AssertNotNullOrWhiteSpace";

        public static MethodBodyStatement AssertNotNull(ValueExpression variable, ValueExpression? name = null)
        {
            return Static<ArgumentDefinition>().Invoke(AssertNotNullMethodName, [variable, name ?? Nameof(variable)]).Terminate();
        }

        public static MethodBodyStatement AssertNotNullOrEmpty(ValueExpression variable, ValueExpression? name = null)
        {
            return Static<ArgumentDefinition>().Invoke(AssertNotNullOrEmptyMethodName, [variable, name ?? Nameof(variable)]).Terminate();
        }

        public static MethodBodyStatement AssertNotNullOrWhiteSpace(ValueExpression variable, ValueExpression? name = null)
        {
            return Static<ArgumentDefinition>().Invoke(AssertNotNullOrWhiteSpaceMethodName, [variable, name ?? Nameof(variable)]).Terminate();
        }

        public static MethodBodyStatement ValidateParameter(ParameterProvider parameter) => parameter.Validation switch
        {
            ParameterValidationType.AssertNotNullOrEmpty => AssertNotNullOrEmpty(parameter),
            ParameterValidationType.AssertNotNull => AssertNotNull(parameter),
            _ => MethodBodyStatement.Empty
        };
    }
}

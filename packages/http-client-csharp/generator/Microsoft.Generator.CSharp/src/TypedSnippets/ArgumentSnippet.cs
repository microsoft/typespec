// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    internal sealed record ArgumentSnippet(ValueExpression Untyped) : TypedSnippet<ArgumentProvider>(Untyped)
    {
        private const string AssertNotNullMethodName = "AssertNotNull";
        private const string AssertNotNullOrEmptyMethodName = "AssertNotNullOrEmpty";
        private const string AssertNotNullOrWhiteSpaceMethodName = "AssertNotNullOrWhiteSpace";

        private static ArgumentProvider? _provider;
        private static ArgumentProvider Provider => _provider ??= new();

        public static MethodBodyStatement AssertNotNull(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodExpression(Provider.Type, AssertNotNullMethodName, [variable, name ?? Snippet.Nameof(variable)]).Terminate();
        }

        public static MethodBodyStatement AssertNotNullOrEmpty(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodExpression(Provider.Type, AssertNotNullOrEmptyMethodName, [variable, name ?? Snippet.Nameof(variable)]).Terminate();
        }

        public static MethodBodyStatement AssertNotNullOrWhiteSpace(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodExpression(Provider.Type, AssertNotNullOrWhiteSpaceMethodName, [variable, name ?? Snippet.Nameof(variable)]).Terminate();
        }

        public static MethodBodyStatement ValidateParameter(ParameterProvider parameter) => parameter.Validation switch
        {
            ParameterValidationType.AssertNotNullOrEmpty => AssertNotNullOrEmpty(parameter),
            ParameterValidationType.AssertNotNull => AssertNotNull(parameter),
            _ => Snippet.EmptyStatement
        };
    }
}

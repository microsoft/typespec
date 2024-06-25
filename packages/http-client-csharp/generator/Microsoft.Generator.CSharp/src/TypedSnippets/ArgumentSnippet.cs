// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Xml.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record ArgumentSnippet(ValueExpression Untyped) : TypedSnippet<ArgumentProvider>(Untyped)
    {
        private static ArgumentProvider? _provider;
        private static ArgumentProvider Provider => _provider ??= new();

        public static MethodBodyStatement AssertNotNull(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodStatement(Provider.Type, ArgumentProvider.AssertNotNullMethodName, variable, name ?? Snippet.Nameof(variable));
        }

        public static MethodBodyStatement AssertNotNullOrEmpty(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodStatement(Provider.Type, ArgumentProvider.AssertNotNullOrEmptyMethodName, variable, name ?? Snippet.Nameof(variable));
        }

        public static MethodBodyStatement AssertNotNullOrWhiteSpace(ValueExpression variable, ValueExpression? name = null)
        {
            return new InvokeStaticMethodStatement(Provider.Type, ArgumentProvider.AssertNotNullOrEmptyMethodName, variable, name ?? Snippet.Nameof(variable));
        }

        public static MethodBodyStatement ValidateParameter(ParameterProvider parameter) => parameter.Validation switch
        {
            ParameterValidationType.AssertNotNullOrEmpty => AssertNotNullOrEmpty(parameter),
            ParameterValidationType.AssertNotNull => AssertNotNull(parameter),
            _ => Snippet.EmptyStatement
        };
    }
}

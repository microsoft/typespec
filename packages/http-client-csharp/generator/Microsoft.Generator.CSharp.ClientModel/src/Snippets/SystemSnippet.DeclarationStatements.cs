// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static partial class SystemSnippet
    {
        public static MethodBodyStatement UsingDeclare(string name, JsonDocumentSnippet value, out JsonDocumentSnippet variable)
            => UsingDeclare(name, value, d => new JsonDocumentSnippet(d), out variable);

        public static MethodBodyStatement UsingVar(string name, JsonDocumentSnippet value, out JsonDocumentSnippet variable)
            => UsingDeclare(name, value, d => new JsonDocumentSnippet(d), out variable);

        private static MethodBodyStatement UsingDeclare<T>(string name, T value, Func<ValueExpression, T> factory, out T variable) where T : TypedSnippet
        {
            var declaration = new CodeWriterDeclaration(name);
            var variableExpression = new VariableExpression(value.Type, declaration);
            variable = factory(variableExpression);
            return Snippet.UsingDeclare(variableExpression, value);
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static partial class Snippet
    {
        public static MethodBodyStatement UsingDeclare(string name, CSharpType type, ValueExpression value, out VariableExpression variable)
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = new VariableExpression(type, declaration);
            return UsingDeclare(variable, value);
        }

        public static MethodBodyStatement UsingDeclare(string name, StreamSnippet value, out StreamSnippet variable)
            => UsingDeclare(name, value, d => new StreamSnippet(d), out variable);

        public static MethodBodyStatement UsingDeclare(VariableExpression variable, ValueExpression value)
            => new DeclarationExpression(variable, false, true).Assign(value).Terminate();

        public static MethodBodyStatement Declare(CSharpType variableType, string name, ValueExpression value, out VariableExpression variable)
        {
            var variableRef = new VariableExpression(variableType, name);
            variable = variableRef;
            return Declare(variableRef, value);
        }

        public static MethodBodyStatement Declare(string name, BinaryDataSnippet value, out BinaryDataSnippet variable)
            => Declare(name, value, d => new BinaryDataSnippet(d), out variable);

        public static MethodBodyStatement Declare(string name, DictionarySnippet value, out DictionarySnippet variable)
            => Declare(name, value, d => new DictionarySnippet(value.KeyType, value.ValueType, d), out variable);

        public static MethodBodyStatement Declare(string name, EnumerableSnippet value, out EnumerableSnippet variable)
            => Declare(name, value, d => new EnumerableSnippet(value.ItemType, d), out variable);

        public static MethodBodyStatement Declare(string name, ListSnippet value, out ListSnippet variable)
            => Declare(name, value, d => new ListSnippet(value.ItemType, d), out variable);

        public static MethodBodyStatement Declare(string name, StringSnippet value, out StringSnippet variable)
            => Declare(name, value, d => new StringSnippet(d), out variable);

        public static MethodBodyStatement Declare(string name, StreamReaderSnippet value, out StreamReaderSnippet variable)
            => Declare(name, value, d => new StreamReaderSnippet(d), out variable);

        public static MethodBodyStatement Declare(string name, TypedSnippet value, out VariableExpression variable)
        {
            var declaration = new VariableExpression(value.Type, name);
            variable = declaration;
            return Declare(declaration, value);
        }

        public static MethodBodyStatement Declare(VariableExpression variable, ValueExpression value)
            => new DeclarationExpression(variable).Assign(value).Terminate();

        private static MethodBodyStatement UsingDeclare<T>(string name, T value, Func<ValueExpression, T> factory, out T variable) where T : TypedSnippet
        {
            var declaration = new CodeWriterDeclaration(name);
            var variableExpression = new VariableExpression(value.Type, declaration);
            variable = factory(variableExpression);
            return UsingDeclare(variableExpression, value);
        }

        private static MethodBodyStatement Declare<T>(string name, T value, Func<ValueExpression, T> factory, out T variable) where T : TypedSnippet
        {
            var declaration = new CodeWriterDeclaration(name);
            var variableExpression = new VariableExpression(value.Type, declaration);
            variable = factory(variableExpression);
            return new DeclarationExpression(variableExpression).Assign(value).Terminate();
        }
    }
}

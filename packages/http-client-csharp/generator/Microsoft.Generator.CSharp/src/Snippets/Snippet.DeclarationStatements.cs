// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static partial class Snippet
    {
        public static MethodBodyStatement UsingDeclare(string name, CSharpType type, ValueExpression value, out VariableReferenceSnippet variable)
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = new VariableReferenceSnippet(type, declaration);
            return new UsingDeclareVariableStatement(type, declaration, value);
        }

        public static MethodBodyStatement UsingDeclare(string name, JsonDocumentSnippet value, out JsonDocumentSnippet variable)
            => UsingDeclare(name, value, d => new JsonDocumentSnippet(d), out variable);

        public static MethodBodyStatement UsingDeclare(string name, StreamSnippet value, out StreamSnippet variable)
            => UsingDeclare(name, value, d => new StreamSnippet(d), out variable);

        public static MethodBodyStatement UsingDeclare(VariableReferenceSnippet variable, ValueExpression value)
            => new UsingDeclareVariableStatement(variable.Type, variable.Declaration, value);

        public static MethodBodyStatement Declare(CSharpType variableType, string name, ValueExpression value, out TypedSnippet variable)
        {
            var variableRef = new VariableReferenceSnippet(variableType, name);
            variable = variableRef;
            return Declare(variableRef, value);
        }

        public static MethodBodyStatement Declare(string name, BinaryDataSnippet value, out BinaryDataSnippet variable)
            => Declare(name, value, d => new BinaryDataSnippet(d), out variable);

        public static MethodBodyStatement Declare(string name, DictionarySnippet value, out DictionarySnippet variable)
            => Declare(name, value, d => new DictionarySnippet(value.KeyType, value.ValueType, d), out variable);

        public static MethodBodyStatement Declare(string name, EnumerableSnippet value, out EnumerableSnippet variable)
            => Declare(name, value, d => new EnumerableSnippet(value.ItemType, d), out variable);

        public static MethodBodyStatement Declare(string name, JsonElementSnippet value, out JsonElementSnippet variable)
            => Declare(name, value, d => new JsonElementSnippet(d), out variable);

        public static MethodBodyStatement Declare(string name, ListSnippet value, out ListSnippet variable)
            => Declare(name, value, d => new ListSnippet(value.ItemType, d), out variable);

        public static MethodBodyStatement Declare(string name, StreamReaderSnippet value, out StreamReaderSnippet variable)
            => Declare(name, value, d => new StreamReaderSnippet(d), out variable);

        public static MethodBodyStatement Declare(string name, TypedSnippet value, out TypedSnippet variable)
        {
            var declaration = new VariableReferenceSnippet(value.Type, name);
            variable = declaration;
            return Declare(declaration, value);
        }

        public static MethodBodyStatement Declare(VariableReferenceSnippet variable, ValueExpression value)
            => new DeclareVariableStatement(variable.Type, variable.Declaration, value);

        public static MethodBodyStatement UsingVar(string name, JsonDocumentSnippet value, out JsonDocumentSnippet variable)
            => UsingVar(name, value, d => new JsonDocumentSnippet(d), out variable);

        public static MethodBodyStatement Var(string name, DictionarySnippet value, out DictionarySnippet variable)
            => Var(name, value, d => new DictionarySnippet(value.KeyType, value.ValueType, d), out variable);

        public static MethodBodyStatement Var(string name, ListSnippet value, out ListSnippet variable)
            => Var(name, value, d => new ListSnippet(value.ItemType, d), out variable);

        public static MethodBodyStatement Var(string name, StringSnippet value, out StringSnippet variable)
            => Var(name, value, d => new StringSnippet(d), out variable);

        public static MethodBodyStatement Var(string name, Utf8JsonWriterSnippet value, out Utf8JsonWriterSnippet variable)
            => Var(name, value, d => new Utf8JsonWriterSnippet(d), out variable);

        public static MethodBodyStatement Var(string name, TypedSnippet value, out TypedSnippet variable)
        {
            var reference = new VariableReferenceSnippet(value.Type, name);
            variable = reference;
            return Var(reference, value);
        }

        public static MethodBodyStatement Var(VariableReferenceSnippet variable, ValueExpression value)
            => new DeclareVariableStatement(null, variable.Declaration, value);

        private static MethodBodyStatement UsingDeclare<T>(string name, T value, Func<ValueExpression, T> factory, out T variable) where T : TypedSnippet
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = factory(new VariableReferenceSnippet(value.Type, declaration));
            return new UsingDeclareVariableStatement(value.Type, declaration, value);
        }

        private static MethodBodyStatement UsingVar<T>(string name, T value, Func<ValueExpression, T> factory, out T variable) where T : TypedSnippet
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = factory(new VariableReferenceSnippet(value.Type, declaration));
            return new UsingDeclareVariableStatement(null, declaration, value);
        }

        private static MethodBodyStatement Declare<T>(string name, T value, Func<ValueExpression, T> factory, out T variable) where T : TypedSnippet
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = factory(new VariableReferenceSnippet(value.Type, declaration));
            return new DeclareVariableStatement(value.Type, declaration, value);
        }

        private static MethodBodyStatement Var<T>(string name, T value, Func<ValueExpression, T> factory, out T variable) where T : TypedSnippet
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = factory(new VariableReferenceSnippet(value.Type, declaration));
            return new DeclareVariableStatement(null, declaration, value);
        }
    }
}

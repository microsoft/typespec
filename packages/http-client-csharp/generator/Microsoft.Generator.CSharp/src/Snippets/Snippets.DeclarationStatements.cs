// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Expressions
{
    public static partial class Snippets
    {
        public static MethodBodyStatement UsingDeclare(string name, CSharpType type, ValueExpression value, out VariableReference variable)
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = new VariableReference(type, declaration);
            return new UsingDeclareVariableStatement(type, declaration, value);
        }

        public static MethodBodyStatement UsingDeclare(string name, JsonDocumentExpression value, out JsonDocumentExpression variable)
            => UsingDeclare(name, value, d => new JsonDocumentExpression(d), out variable);

        public static MethodBodyStatement UsingDeclare(string name, StreamExpression value, out StreamExpression variable)
            => UsingDeclare(name, value, d => new StreamExpression(d), out variable);

        public static MethodBodyStatement UsingDeclare(VariableReference variable, ValueExpression value)
            => new UsingDeclareVariableStatement(variable.Type, variable.Declaration, value);

        public static MethodBodyStatement Declare(CSharpType variableType, string name, ValueExpression value, out TypedValueExpression variable)
        {
            var variableRef = new VariableReference(variableType, name);
            variable = variableRef;
            return Declare(variableRef, value);
        }

        public static MethodBodyStatement Declare(string name, BinaryDataExpression value, out BinaryDataExpression variable)
            => Declare(name, value, d => new BinaryDataExpression(d), out variable);

        public static MethodBodyStatement Declare(string name, DictionaryExpression value, out DictionaryExpression variable)
            => Declare(name, value, d => new DictionaryExpression(value.KeyType, value.ValueType, d), out variable);

        public static MethodBodyStatement Declare(string name, EnumerableExpression value, out EnumerableExpression variable)
            => Declare(name, value, d => new EnumerableExpression(value.ItemType, d), out variable);

        public static MethodBodyStatement Declare(string name, JsonElementExpression value, out JsonElementExpression variable)
            => Declare(name, value, d => new JsonElementExpression(d), out variable);

        public static MethodBodyStatement Declare(string name, ListExpression value, out ListExpression variable)
            => Declare(name, value, d => new ListExpression(value.ItemType, d), out variable);

        public static MethodBodyStatement Declare(string name, StreamReaderExpression value, out StreamReaderExpression variable)
            => Declare(name, value, d => new StreamReaderExpression(d), out variable);

        public static MethodBodyStatement Declare(string name, TypedValueExpression value, out TypedValueExpression variable)
        {
            var declaration = new VariableReference(value.Type, name);
            variable = declaration;
            return Declare(declaration, value);
        }

        public static MethodBodyStatement Declare(VariableReference variable, ValueExpression value)
            => new DeclareVariableStatement(variable.Type, variable.Declaration, value);

        public static MethodBodyStatement UsingVar(string name, JsonDocumentExpression value, out JsonDocumentExpression variable)
            => UsingVar(name, value, d => new JsonDocumentExpression(d), out variable);

        public static MethodBodyStatement Var(string name, DictionaryExpression value, out DictionaryExpression variable)
            => Var(name, value, d => new DictionaryExpression(value.KeyType, value.ValueType, d), out variable);

        public static MethodBodyStatement Var(string name, ListExpression value, out ListExpression variable)
            => Var(name, value, d => new ListExpression(value.ItemType, d), out variable);

        public static MethodBodyStatement Var(string name, StringExpression value, out StringExpression variable)
            => Var(name, value, d => new StringExpression(d), out variable);

        public static MethodBodyStatement Var(string name, Utf8JsonWriterExpression value, out Utf8JsonWriterExpression variable)
            => Var(name, value, d => new Utf8JsonWriterExpression(d), out variable);

        public static MethodBodyStatement Var(string name, TypedValueExpression value, out TypedValueExpression variable)
        {
            var reference = new VariableReference(value.Type, name);
            variable = reference;
            return Var(reference, value);
        }

        public static MethodBodyStatement Var(VariableReference variable, ValueExpression value)
            => new DeclareVariableStatement(null, variable.Declaration, value);

        private static MethodBodyStatement UsingDeclare<T>(string name, T value, Func<ValueExpression, T> factory, out T variable) where T : TypedValueExpression
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = factory(new VariableReference(value.Type, declaration));
            return new UsingDeclareVariableStatement(value.Type, declaration, value);
        }

        private static MethodBodyStatement UsingVar<T>(string name, T value, Func<ValueExpression, T> factory, out T variable) where T : TypedValueExpression
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = factory(new VariableReference(value.Type, declaration));
            return new UsingDeclareVariableStatement(null, declaration, value);
        }

        private static MethodBodyStatement Declare<T>(string name, T value, Func<ValueExpression, T> factory, out T variable) where T : TypedValueExpression
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = factory(new VariableReference(value.Type, declaration));
            return new DeclareVariableStatement(value.Type, declaration, value);
        }

        private static MethodBodyStatement Var<T>(string name, T value, Func<ValueExpression, T> factory, out T variable) where T : TypedValueExpression
        {
            var declaration = new CodeWriterDeclaration(name);
            variable = factory(new VariableReference(value.Type, declaration));
            return new DeclareVariableStatement(null, declaration, value);
        }
    }
}

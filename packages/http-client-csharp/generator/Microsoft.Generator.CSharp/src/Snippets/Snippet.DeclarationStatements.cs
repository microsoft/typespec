// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
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

        public static MethodBodyStatement UsingDeclare(VariableExpression variable, ValueExpression value)
            => new DeclarationExpression(variable, false, true).Assign(value).Terminate();

        public static MethodBodyStatement Declare(string name, CSharpType variableType, ValueExpression value, out VariableExpression variable)
        {
            var variableRef = new VariableExpression(variableType, name);
            variable = variableRef;
            return Declare(variableRef, value);
        }

        public static MethodBodyStatement Declare(string name, DictionaryExpression value, out DictionaryExpression variable)
        {
            var declaration = new CodeWriterDeclaration(name);
            var variableExpression = new VariableExpression(value.Type, declaration);
            variable = variableExpression.AsDictionary(value.KeyType, value.ValueType);
            return new DeclarationExpression(variableExpression).Assign(value).Terminate();
        }

        public static MethodBodyStatement Declare(string name, ScopedApi value, out ScopedApi variable)
        {
            var declaration = new CodeWriterDeclaration(name);
            var variableExpression = new VariableExpression(TypeReferenceExpression.GetTypeFromDefinition(value.Type)!, declaration);
            variable = variableExpression.As(value.Type);
            return Declare(variableExpression, value);
        }

        public static MethodBodyStatement Declare(VariableExpression variable, ValueExpression value)
            => new DeclarationExpression(variable).Assign(value).Terminate();

        public static MethodBodyStatement UsingDeclare<T>(string name, ScopedApi<T> value, out ScopedApi<T> variable)
        {
            var declaration = new CodeWriterDeclaration(name);
            var variableExpression = new VariableExpression(TypeReferenceExpression.GetTypeFromDefinition(value.Type)!, declaration);
            variable = variableExpression.As<T>();
            return UsingDeclare(variableExpression, value);
        }

        public static MethodBodyStatement UsingDeclare<T>(string name, T value, out T variable) where T : ScopedApi
        {
            var declaration = new CodeWriterDeclaration(name);
            var variableExpression = new VariableExpression(TypeReferenceExpression.GetTypeFromDefinition(value.Type)!, declaration);

            // TODO: need to constraint that subtype should have the corresponding constructor
            variable = (T)Activator.CreateInstance(value.GetType(), variableExpression)!;
            return UsingDeclare(variableExpression, value);
        }

        public static MethodBodyStatement Declare<T>(string name, T value, out T variable) where T : ScopedApi
        {
            var declaration = new CodeWriterDeclaration(name);
            var variableExpression = new VariableExpression(TypeReferenceExpression.GetTypeFromDefinition(value.Type)!, declaration);

            // TODO: need to constraint that subtype should have the corresponding constructor
            variable = (T)Activator.CreateInstance(value.GetType(), variableExpression)!;
            return new DeclarationExpression(variableExpression).Assign(value).Terminate();
        }

        public static MethodBodyStatement Declare<T>(string name, ScopedApi<T> value, out ScopedApi<T> variable)
        {
            var declaration = new CodeWriterDeclaration(name);
            var variableExpression = new VariableExpression(TypeReferenceExpression.GetTypeFromDefinition(value.Type)!, declaration);
            variable = variableExpression.As<T>();
            return new DeclarationExpression(variableExpression).Assign(value).Terminate();
        }

        public static DeclarationExpression Declare<T>(string name, out ScopedApi<T> variable)
        {
            var variableExpression = new VariableExpression(typeof(T), name);
            variable = variableExpression.As<T>();
            return new DeclarationExpression(variableExpression);
        }

        public static DeclarationExpression Declare(string name, CSharpType variableType, out VariableExpression variable)
        {
            var variableRef = new VariableExpression(variableType, name);
            variable = variableRef;
            return new DeclarationExpression(variableRef);
        }
    }
}

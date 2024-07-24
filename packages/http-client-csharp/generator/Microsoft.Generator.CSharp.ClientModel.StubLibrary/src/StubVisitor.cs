// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace StubPlugin
{
    internal class StubVisitor : OutputLibraryVisitor
    {
        private readonly ValueExpression ThrowNull = ThrowExpression(Null);
        private readonly XmlDocProvider _emptyDocs = new();

        protected override TypeProvider? Visit(TypeProvider typeProvider)
        {
            if (typeProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
            {
                typeProvider.Update(xmlDocs: _emptyDocs);
                return typeProvider;
            }

            return null;
        }

        protected override ConstructorProvider? Visit(TypeProvider typeProvider, ConstructorProvider constructorProvider)
        {
            if (!ShouldKeep(constructorProvider.Signature.Modifiers))
            {
                return null;
            }

            constructorProvider.Update(
                bodyStatements: null,
                bodyExpression: ThrowNull,
                xmlDocs: _emptyDocs);

            return constructorProvider;
        }

        protected override FieldProvider? Visit(TypeProvider typeProvider, FieldProvider fieldProvider)
        {
            return fieldProvider.Modifiers.HasFlag(FieldModifiers.Public) ? fieldProvider : null;
        }

        protected override MethodProvider? Visit(TypeProvider typeProvider, MethodProvider methodProvider)
        {
            if (methodProvider.Signature.ExplicitInterface is null && !ShouldKeep(methodProvider.Signature.Modifiers))
            {
                return null;
            }

            methodProvider.Signature.Update(modifiers: methodProvider.Signature.Modifiers & ~MethodSignatureModifiers.Async);

            methodProvider.Update(
                bodyStatements: null,
                bodyExpression: ThrowNull,
                xmlDocProvider: _emptyDocs);

            return methodProvider;
        }

        protected override PropertyProvider? Visit(TypeProvider typeProvider, PropertyProvider propertyProvider)
        {
            if (!ShouldKeep(propertyProvider.Modifiers))
            {
                return null;
            }

            var propetybody = new ExpressionPropertyBody(ThrowNull, propertyProvider.Body.HasSetter ? ThrowNull : null);

            propertyProvider.Update(
                body: propetybody,
                xmlDocs: _emptyDocs);

            return propertyProvider;
        }

        private bool ShouldKeep(MethodSignatureModifiers modifiers)
        {
            if (modifiers.HasFlag(MethodSignatureModifiers.Public))
                return true;

            if (modifiers.HasFlag(MethodSignatureModifiers.Protected) && !modifiers.HasFlag(MethodSignatureModifiers.Private))
                return true;

            return false;
        }
    }
}

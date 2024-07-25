// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.StubLibrary
{
    internal class StubVisitor : OutputLibraryVisitor
    {
        private readonly ValueExpression _throwNull = ThrowExpression(Null);
        private readonly XmlDocProvider _emptyDocs = new();

        protected override TypeProvider? Visit(TypeProvider typeProvider)
        {
            if (!typeProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                return null;

            typeProvider.Update(xmlDocs: _emptyDocs);
            return typeProvider;
        }

        protected override ConstructorProvider? Visit(TypeProvider typeProvider, ConstructorProvider constructorProvider)
        {
            if (!ShouldKeep(constructorProvider.Signature.Modifiers))
                return null;

            constructorProvider.Update(
                bodyStatements: null,
                bodyExpression: _throwNull,
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
                return null;

            methodProvider.Signature.Update(modifiers: methodProvider.Signature.Modifiers & ~MethodSignatureModifiers.Async);

            methodProvider.Update(
                bodyStatements: null,
                bodyExpression: _throwNull,
                xmlDocProvider: _emptyDocs);

            return methodProvider;
        }

        protected override PropertyProvider? Visit(TypeProvider typeProvider, PropertyProvider propertyProvider)
        {
            if (!ShouldKeep(propertyProvider.Modifiers))
                return null;

            var propertyBody = new ExpressionPropertyBody(_throwNull, propertyProvider.Body.HasSetter ? _throwNull : null);

            propertyProvider.Update(
                body: propertyBody,
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

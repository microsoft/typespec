// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.StubLibrary
{
    internal class StubLibraryVisitor : ScmLibraryVisitor
    {
        private readonly ValueExpression _throwNull = ThrowExpression(Null);
        private readonly XmlDocProvider _emptyDocs = new();

        protected override TypeProvider? Visit(TypeProvider type)
        {
            if (!type.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                return null;

            type.Update(xmlDocs: _emptyDocs);
            return type;
        }

        protected override TypeProvider? PostVisit(TypeProvider type)
        {
            if (type is RestClientProvider &&
                type.Methods.Count == 0 &&
                type.Constructors.Count == 0 &&
                type.Properties.Count == 0 &&
                type.Fields.Count == 0)
            {
                return null;
            }

            return type;
        }

        protected override ConstructorProvider? Visit(ConstructorProvider constructor)
        {
            if (!ShouldKeep(constructor.Signature.Modifiers))
                return null;

            constructor.Update(
                bodyStatements: null,
                bodyExpression: _throwNull,
                xmlDocs: _emptyDocs);

            return constructor;
        }

        protected override FieldProvider? Visit(FieldProvider field)
        {
            return field.Modifiers.HasFlag(FieldModifiers.Public) ? field : null;
        }

        protected override MethodProvider? Visit(MethodProvider method)
        {
            if (method.Signature.ExplicitInterface is null && !ShouldKeep(method.Signature.Modifiers))
                return null;

            method.Signature.Update(modifiers: method.Signature.Modifiers & ~MethodSignatureModifiers.Async);

            method.Update(
                bodyStatements: null,
                bodyExpression: _throwNull,
                xmlDocProvider: _emptyDocs);

            return method;
        }

        protected override PropertyProvider? Visit(PropertyProvider property)
        {
            if (!ShouldKeep(property.Modifiers))
                return null;

            var propertyBody = new ExpressionPropertyBody(_throwNull, property.Body.HasSetter ? _throwNull : null);

            property.Update(
                body: propertyBody,
                xmlDocs: _emptyDocs);

            return property;
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

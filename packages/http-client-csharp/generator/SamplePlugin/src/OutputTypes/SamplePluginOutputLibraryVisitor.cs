// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace SamplePlugin
{
    public class SamplePluginOutputLibraryVisitor : OutputLibraryVisitor
    {
        public override TypeProvider Visit(TypeProvider typeProvider)
        {
            return typeProvider;
        }

        public override MethodProvider Visit(TypeProvider typeProvider, MethodProvider methodProvider)
        {
            if (methodProvider is not ScmMethodProvider)
            {
                return methodProvider;
            }
            var newSig = new MethodSignature(
                $"Foo{methodProvider.Signature.Name}",
                methodProvider.Signature.Description,
                methodProvider.Signature.Modifiers,
                methodProvider.Signature.ReturnType,
                methodProvider.Signature is MethodSignature signature ? signature.ReturnDescription : null,
                methodProvider.Signature.Parameters,
                methodProvider.Signature.Attributes,
                methodProvider.Signature is MethodSignature argSig ? argSig.GenericArguments : null,
                methodProvider.Signature is MethodSignature genSig ? genSig.GenericParameterConstraints : null,
                methodProvider.Signature is MethodSignature exp ? exp.ExplicitInterface : null,
                methodProvider.Signature.NonDocumentComment);
            methodProvider.Signature.Replace(newSig);

            return
                methodProvider.BodyStatements != null
                    ? new MethodProvider(newSig, methodProvider.BodyStatements, typeProvider, methodProvider.XmlDocs)
                    : new MethodProvider(newSig, methodProvider.BodyExpression!, typeProvider, methodProvider.XmlDocs);
        }
    }
}

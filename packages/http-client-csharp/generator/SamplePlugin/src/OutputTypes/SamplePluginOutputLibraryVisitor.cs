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

            methodProvider.Signature.Update(name: $"Foo{methodProvider.Signature.Name}");
            return methodProvider;
        }
    }
}

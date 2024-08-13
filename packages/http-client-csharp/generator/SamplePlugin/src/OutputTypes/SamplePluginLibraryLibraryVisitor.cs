// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp;
using Microsoft.Generator.CSharp.ClientModel;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using SamplePlugin.Providers;

namespace SamplePlugin
{
    public class SamplePluginLibraryLibraryVisitor : ScmLibraryVisitor
    {
        protected override MethodProvider Visit(TypeProvider typeProvider, MethodProvider methodProvider)
        {
            if (methodProvider is not ScmMethodProvider)
            {
                return methodProvider;
            }

            methodProvider.Signature.Update(name: $"Foo{methodProvider.Signature.Name}");
            return methodProvider;
        }

        protected override PropertyProvider Visit(InputModelProperty property, PropertyProvider? propertyProvider)
        {
            return new SamplePluginPropertyProvider(property);
        }

        protected override MethodProviderCollection Visit(InputOperation operation,
            TypeProvider enclosingType,
            MethodProviderCollection? methodProvider)
        {
            return new SamplePluginMethodProviderCollection(operation, enclosingType);
        }
    }
}

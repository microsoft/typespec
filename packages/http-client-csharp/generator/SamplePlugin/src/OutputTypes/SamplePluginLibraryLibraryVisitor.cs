// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using SamplePlugin.Providers;

namespace SamplePlugin
{
    public class SamplePluginLibraryLibraryVisitor : ScmLibraryVisitor
    {
        protected override MethodProvider? Visit(MethodProvider method)
        {
            if (method is not ScmMethodProvider)
            {
                return method;
            }

            Emitter.Instance.Info($"Visiting method {method.Signature.Name} in type {method.EnclosingType.Type}");
            method.Signature.Update(name: $"Foo{method.Signature.Name}");
            return method;
        }

        //protected override PropertyProvider? Visit(PropertyProvider property)
        //{
        //    return new SamplePluginPropertyProvider(property, property.EnclosingType);
        //}

        protected override MethodProviderCollection Visit(InputOperation operation,
            TypeProvider enclosingType,
            MethodProviderCollection? methodProvider)
        {
            return new SamplePluginMethodProviderCollection(operation, enclosingType);
        }
    }
}

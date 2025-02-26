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
    public class SamplePluginLibraryVisitor : ScmLibraryVisitor
    {
        protected override MethodProvider? VisitMethod(MethodProvider method)
        {
            if (method is not ScmMethodProvider)
            {
                return method;
            }

            Emitter.Instance.Info($"Visiting method {method.Signature.Name} in type {method.EnclosingType.Type}");
            method.Signature.Update(name: $"Foo{method.Signature.Name}");
            return method;
        }

        protected override PropertyProvider? PreVisitProperty(InputModelProperty property, PropertyProvider? propertyProvider)
        {
            if (propertyProvider is not null)
            {
                return new SamplePluginPropertyProvider(property, propertyProvider.EnclosingType);
            }
            return null;
        }

        protected override MethodProviderCollection Visit(InputOperation operation,
            TypeProvider enclosingType,
            MethodProviderCollection? methodProvider)
        {
            return new SamplePluginMethodProviderCollection(operation, enclosingType);
        }
    }
}

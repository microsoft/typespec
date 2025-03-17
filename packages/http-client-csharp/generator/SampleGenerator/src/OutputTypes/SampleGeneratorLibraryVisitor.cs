// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using SampleGenerator.Providers;

namespace SampleGenerator
{
    public class SampleGeneratorLibraryVisitor : ScmLibraryVisitor
    {
        protected override MethodProvider? VisitMethod(MethodProvider method)
        {
            SampleCodeModelGenerator.Instance.Emitter.Info($"Visiting method {method.Signature.Name} in type {method.EnclosingType.Type}");
            method.Signature.Update(name: $"Foo{method.Signature.Name}");
            return method;
        }

        protected override PropertyProvider? PreVisitProperty(InputModelProperty property, PropertyProvider? propertyProvider)
        {
            SampleCodeModelGenerator.Instance.Emitter.Info($"PreVisiting property {property.Name} in model {property.EnclosingType?.Name}");
            if (propertyProvider is not null)
            {
                return new SampleGeneratorPropertyProvider(property, propertyProvider.EnclosingType);
            }
            return null;
        }

        protected override MethodProviderCollection Visit(InputOperation operation,
            TypeProvider enclosingType,
            MethodProviderCollection? methodProvider)
        {
            SampleCodeModelGenerator.Instance.Emitter.Info($"Visiting methodProviderCollection for operation {operation.Path} in type {enclosingType.Type.Name}");
            return new SampleGeneratorMethodProviderCollection(operation, enclosingType);
        }
    }
}

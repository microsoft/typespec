// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;

namespace SamplePlugin
{
    internal class SampleTypeFactory : ScmTypeFactory
    {
        protected override PropertyProvider? CreatePropertyCore(InputModelProperty property, TypeProvider enclosingType)
        {
            var originalProperty = base.CreatePropertyCore(property, enclosingType);
            if (originalProperty != null)
            {
                return new SamplePluginPropertyProvider(property, enclosingType);
            }
            return null;
        }
    }
}

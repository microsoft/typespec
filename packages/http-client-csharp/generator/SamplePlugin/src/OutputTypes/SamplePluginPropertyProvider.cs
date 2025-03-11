// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace SamplePlugin
{
    public class SamplePluginPropertyProvider : PropertyProvider
    {
        public SamplePluginPropertyProvider(InputModelProperty inputProperty, TypeProvider enclosingType) : base(inputProperty, enclosingType)
        {
        }

        protected override bool PropertyHasSetter(CSharpType type, InputModelProperty inputProperty)
        {
            return type.IsCollection || base.PropertyHasSetter(type, inputProperty);
        }
    }
}

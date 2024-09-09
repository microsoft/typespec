// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace SamplePlugin
{
    public class SamplePluginPropertyProvider(InputModelProperty inputModel) : PropertyProvider(inputModel)
    {
        protected override bool PropertyHasSetter(CSharpType type, InputModelProperty inputProperty)
        {
            return type.IsCollection || base.PropertyHasSetter(type, inputProperty);
        }
    }
}

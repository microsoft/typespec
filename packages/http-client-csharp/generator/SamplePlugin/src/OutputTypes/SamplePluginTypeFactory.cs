// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using SamplePlugin.Providers;

namespace SamplePlugin
{
    public class SamplePluginTypeFactory : TypeFactory
    {
        private readonly Dictionary<InputOperation, MethodProviderCollection?> _operations = new Dictionary<InputOperation, MethodProviderCollection?>();

        /// <summary>
        /// Creates a <see cref="MethodProviderCollection"/> for the given operation. If the operation is a <see cref="InputOperationKinds.DefaultValue"/> operation,
        /// a method collection will be created. Otherwise, <c>null</c> will be returned.
        /// </summary>
        /// <param name="operation">The input operation to create methods for.</param>
        /// <param name="enclosingType">The enclosing type of the operation.</param>
        public override MethodProviderCollection CreateMethodProviders(InputOperation operation, TypeProvider enclosingType) => new SamplePluginMethodProviderCollection(operation, enclosingType);

        public override PropertyProvider CreatePropertyProvider(InputModelProperty inputModel) => new PluginPropertyProvider(inputModel);
    }

#pragma warning disable SA1402
    internal class PluginPropertyProvider : PropertyProvider
#pragma warning restore SA1402
    {
        public PluginPropertyProvider(InputModelProperty inputModel) : base(inputModel)
        {
        }

        protected override bool PropertyHasSetter(CSharpType type, InputModelProperty inputProperty)
        {
            return type.IsCollection || base.PropertyHasSetter(type, inputProperty);
        }
    }
}

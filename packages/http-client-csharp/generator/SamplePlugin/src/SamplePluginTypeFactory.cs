// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using SamplePlugin.Providers;

namespace SamplePlugin
{
    public class SamplePluginTypeFactory : ScmTypeFactory
    {
        /// <summary>
        /// Creates a <see cref="MethodProviderCollection"/> for the given operation. If the operation is a <see cref="InputOperationKinds.DefaultValue"/> operation,
        /// a method collection will be created. Otherwise, <c>null</c> will be returned.
        /// </summary>
        /// <param name="operation">The input operation to create methods for.</param>
        /// <param name="enclosingType">The enclosing type of the operation.</param>
        public override MethodProviderCollection CreateMethods(InputOperation operation, TypeProvider enclosingType) => new SamplePluginMethodProviderCollection(operation, enclosingType);
    }
}

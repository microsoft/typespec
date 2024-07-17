// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    [Export(typeof(CodeModelPlugin))]
    [ExportMetadata("PluginName", nameof(ClientModelPlugin))]
    [method: ImportingConstructor]
    public class ClientModelPlugin(GeneratorContext context) : CodeModelPlugin(context)
    {
        private ScmOutputLibrary? _scmOutputLibrary;
        public override OutputLibrary OutputLibrary => _scmOutputLibrary ??= new();

        public override ScmTypeFactory TypeFactory { get; } = new();

        public override IReadOnlyList<MetadataReference> AdditionalMetadataReferences => [MetadataReference.CreateFromFile(typeof(ClientResult).Assembly.Location)];

        /// <summary>
        /// Returns the serialization type providers for the given input type.
        /// </summary>
        /// <param name="inputType">The input type.</param>
        public override IReadOnlyList<TypeProvider> GetSerializationTypeProviders(InputType inputType)
        {
            switch (inputType)
            {
                case InputModelType inputModel when inputModel.Usage.HasFlag(InputModelTypeUsage.Json):
                    return [new MrwSerializationTypeDefinition(inputModel)];
                default:
                    return base.GetSerializationTypeProviders(inputType);
            }
        }
    }
}

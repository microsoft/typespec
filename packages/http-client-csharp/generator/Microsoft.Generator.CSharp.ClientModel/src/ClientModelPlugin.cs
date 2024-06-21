// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ClientModelPlugin : CodeModelPlugin
    {
        private static ClientModelPlugin? _instance;
        internal static ClientModelPlugin Instance => _instance ?? throw new InvalidOperationException("ClientModelPlugin is not loaded.");
        public override ApiTypes ApiTypes { get; }

        private ScmOutputLibrary? _scmOutputLibrary;
        public override OutputLibrary OutputLibrary => _scmOutputLibrary ??= new();

        public override TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);

        public override ScmTypeFactory TypeFactory { get; }

        public override ExtensibleSnippets ExtensibleSnippets { get; }

        public override IReadOnlyList<MetadataReference> AdditionalMetadataReferences => [MetadataReference.CreateFromFile(typeof(ClientResult).Assembly.Location)];

        /// <summary>
        /// Returns the serialization type providers for the given model type provider.
        /// </summary>
        /// <param name="provider">The model type provider.</param>
        /// <param name="inputModel">The input model.</param>
        public override IReadOnlyList<TypeProvider> GetSerializationTypeProviders(TypeProvider provider, InputType inputType)
        {
            switch (inputType)
            {
                case InputModelType inputModel:
                    return [new MrwSerializationTypeProvider(provider, inputModel)];
                default:
                    return base.GetSerializationTypeProviders(provider, inputType);
            }
        }

        [ImportingConstructor]
        public ClientModelPlugin(GeneratorContext context)
            : base(context)
        {
            TypeFactory = new ScmTypeFactory();
            ExtensibleSnippets = new SystemExtensibleSnippets();
            ApiTypes = new SystemApiTypes();
            _instance = this;
        }
    }
}

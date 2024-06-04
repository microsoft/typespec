// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ClientModelPlugin : CodeModelPlugin
    {
        private static ClientModelPlugin? _instance;
        internal static ClientModelPlugin Instance => _instance ?? throw new InvalidOperationException("ClientModelPlugin is not loaded.");
        public override ApiTypes ApiTypes { get; }

        private OutputLibrary? _scmOutputLibrary;
        public override OutputLibrary OutputLibrary => _scmOutputLibrary ??= new();

        public override TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);

        public override TypeFactory TypeFactory { get; }

        public override ExtensibleSnippets ExtensibleSnippets { get; }

        /// <summary>
        /// Returns the serialization type providers for the given model type provider.
        /// </summary>
        /// <param name="provider">The model type provider.</param>
        /// <param name="inputModel">The input model.</param>
        public override IReadOnlyList<TypeProvider> GetSerializationTypeProviders(ModelProvider provider, InputModelType inputModel)
        {
            // Add MRW serialization type provider
            return [new MrwSerializationTypeProvider(provider, inputModel)];
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

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition.Hosting;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Base class for code model plugins. This class is exported via MEF and can be implemented by an inherited plugin class.
    /// </summary>
    public class CodeModelPlugin
    {
        public static CodeModelPlugin Instance => _instance ?? throw new InvalidOperationException("CodeModelPlugin is not loaded.");
        private static CodeModelPlugin? _instance;

        public virtual Configuration Configuration { get; }

        /// <summary>
        /// For mocking.
        /// </summary>
        protected CodeModelPlugin()
        {
            _instance = this;
            Configuration = null!;
            ApiTypes = null!;
            TypeFactory = null!;
            ExtensibleSnippets = null!;
            OutputLibrary = null!;
            _inputLibrary = new(() => new InputLibrary(Instance.Configuration.OutputDirectory));
        }

        internal CodeModelPlugin(Configuration configuration)
        {
            Configuration = configuration;
            using DirectoryCatalog directoryCatalog = new(AppContext.BaseDirectory);
            using (CompositionContainer container = new(directoryCatalog))
            {
                ApiTypes = container.GetExportedValueOrDefault<ApiTypes>() ??
                           throw new InvalidOperationException("ApiTypes is not loaded.");
                TypeFactory = container.GetExportedValueOrDefault<TypeFactory>()
                              ?? throw new InvalidOperationException("TypeFactory is not loaded.");
                ExtensibleSnippets = container.GetExportedValueOrDefault<ExtensibleSnippets>()
                                     ?? throw new InvalidOperationException("ExtensibleSnippets is not loaded.");
                OutputLibrary = container.GetExportedValueOrDefault<OutputLibrary>()
                    ?? new OutputLibrary();
                _inputLibrary = new(() => new InputLibrary(Instance.Configuration.OutputDirectory));
            }
        }

        internal static void LoadPlugins(Configuration configuration)
        {
            _instance = new CodeModelPlugin(configuration);
        }

        private Lazy<InputLibrary> _inputLibrary;

        // Extensibility points to be implemented by a plugin
        public virtual ApiTypes ApiTypes { get; }

        public virtual TypeFactory TypeFactory { get; }

        public virtual ExtensibleSnippets ExtensibleSnippets { get; }

        public virtual OutputLibrary OutputLibrary { get; }

        public virtual InputLibrary InputLibrary => _inputLibrary.Value;

        public virtual TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);

        /// <summary>
        /// Returns the serialization type providers for the given model type provider.
        /// </summary>
        /// <param name="provider">The model type provider.</param>
        public virtual IReadOnlyList<TypeProvider> GetSerializationTypeProviders(ModelProvider provider) => Array.Empty<TypeProvider>();
        public virtual string LicenseString => string.Empty;
    }
}

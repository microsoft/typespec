// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Writers;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Base class for code model plugins. This class is exported via MEF and can be implemented by an inherited plugin class.
    /// </summary>
    [InheritedExport]
    public class CodeModelPlugin
    {
        public static CodeModelPlugin Instance { get; } = _instance ?? throw new InvalidOperationException("CodeModelPlugin is not loaded.");
        private static CodeModelPlugin? _instance;

        public Configuration Configuration { get; }

        internal CodeModelPlugin(Configuration configuration)
        {
            _instance = this;
            _inputLibrary = new(() => new InputLibrary(Instance.Configuration.OutputDirectory));

            using DirectoryCatalog directoryCatalog = new(AppContext.BaseDirectory);
            using (CompositionContainer container = new(directoryCatalog))
            {
                Configuration = configuration;
                ApiTypes = container.GetExportedValueOrDefault<ApiTypes>()
                           ?? throw new InvalidOperationException("ApiTypes is not loaded.");
                TypeFactory = container.GetExportedValueOrDefault<TypeFactory>()
                              ?? throw new InvalidOperationException("TypeFactory is not loaded.");
                CodeWriterExtensionMethods = container.GetExportedValueOrDefault<CodeWriterExtensionMethods>()
                                             ?? throw new InvalidOperationException("CodeWriterExtensionMethods is not loaded.");
                ExtensibleSnippets = container.GetExportedValueOrDefault<ExtensibleSnippets>()
                                     ?? throw new InvalidOperationException("ExtensibleSnippets is not loaded.");
                OutputLibrary = container.GetExportedValueOrDefault<OutputLibrary>()
                                ?? new OutputLibrary();
            }
        }

        internal static void LoadPlugins(Configuration configuration)
        {
            _instance = new(configuration);
        }

        private Lazy<InputLibrary> _inputLibrary;

        // Extensibility points to be implemented by a plugin
        public ApiTypes ApiTypes { get; }

        public CodeWriterExtensionMethods CodeWriterExtensionMethods { get; }

        public TypeFactory TypeFactory { get; }

        public ExtensibleSnippets ExtensibleSnippets { get; }

        public OutputLibrary OutputLibrary { get;}

        public InputLibrary InputLibrary => _inputLibrary.Value;

        public virtual TypeProviderWriter GetWriter(CodeWriter writer, TypeProvider provider) => new(writer, provider);
    }
}

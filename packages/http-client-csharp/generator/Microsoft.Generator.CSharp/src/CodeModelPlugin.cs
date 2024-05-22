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
        public static CodeModelPlugin Instance { get; } = new CodeModelPlugin();

        public Configuration Configuration { get; private set; }

        private CodeModelPlugin()
        {
            _inputLibrary = new(() => new InputLibrary(Instance.Configuration.OutputDirectory));
            Configuration = default!;
            ApiTypes = default!;
            CodeWriterExtensionMethods = default!;
            TypeFactory = default!;
            ExtensibleSnippets = default!;
            OutputLibrary = default!;
        }

        private Lazy<InputLibrary> _inputLibrary;

        // Extensibility points to be implemented by a plugin
        public ApiTypes ApiTypes { get; private set; }

        public CodeWriterExtensionMethods CodeWriterExtensionMethods { get; private set; }

        public TypeFactory TypeFactory { get; private set; }

        public ExtensibleSnippets ExtensibleSnippets { get; private set; }

        public OutputLibrary OutputLibrary { get; private set;}

        public InputLibrary InputLibrary => _inputLibrary.Value;

        public virtual TypeProviderWriter GetWriter(CodeWriter writer, TypeProvider provider) => new(writer, provider);

        internal void LoadPlugins(Configuration configuration)
        {
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
    }
}

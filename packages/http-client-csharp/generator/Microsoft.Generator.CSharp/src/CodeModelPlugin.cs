// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ComponentModel.Composition;
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

        public Configuration Configuration
        {
            get => _configuration ?? throw new InvalidOperationException("Configuration is not loaded.");
            internal set => _configuration = value;
        }
        private Configuration? _configuration;

        private CodeModelPlugin()
        {
            _inputLibrary = new(() => new InputLibrary(Instance.Configuration!.OutputDirectory));
        }

        private Lazy<InputLibrary> _inputLibrary;

        // Extensibility points to be implemented by a plugin
        public ApiTypes ApiTypes
        {
            get => _apiTypes ?? throw new InvalidOperationException("ApiTypes is not loaded.");
            internal set => _apiTypes = value;
        }
        private ApiTypes? _apiTypes;

        public CodeWriterExtensionMethods CodeWriterExtensionMethods
        {
            get => _codeWriterExtensionMethods ?? throw new InvalidOperationException("CodeWriterExtensionMethods is not loaded.");
            internal set => _codeWriterExtensionMethods = value;
        }
        private CodeWriterExtensionMethods? _codeWriterExtensionMethods;

        public TypeFactory TypeFactory
        {
            get => _typeFactory ?? throw new InvalidOperationException("TypeFactory is not loaded.");
            internal set => _typeFactory = value;
        }
        private TypeFactory? _typeFactory;

        public ExtensibleSnippets ExtensibleSnippets
        {
            get => _extensibleSnippets ?? throw new InvalidOperationException("ExtensibleSnippets is not loaded.");
            internal set => _extensibleSnippets = value;
        }
        private ExtensibleSnippets? _extensibleSnippets;

        public OutputLibrary OutputLibrary
        {
            get => _outputLibrary ?? throw new InvalidOperationException("OutputLibrary is not loaded.");
            internal set => _outputLibrary = value;
        }
        private OutputLibrary? _outputLibrary;

        public InputLibrary InputLibrary => _inputLibrary.Value;

        public virtual TypeProviderWriter GetWriter(CodeWriter writer, TypeProvider provider) => new(writer, provider);
    }
}

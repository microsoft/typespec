// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Host.Mef;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Base class for code model plugins. This class is exported via MEF and can be implemented by an inherited plugin class.
    /// </summary>
    [InheritedExport]
    public abstract class CodeModelPlugin
    {
        private static CodeModelPlugin? _instance;
        internal static CodeModelPlugin Instance => _instance ?? throw new InvalidOperationException("CodeModelPlugin is not initialized");

        public Configuration Configuration { get; }

        [ImportingConstructor]
        public CodeModelPlugin(GeneratorContext context)
        {
            _instance = this;
            Configuration = context.Configuration;
            _inputLibrary = new(() => new InputLibrary(Instance.Configuration.OutputDirectory));
        }

        private Lazy<InputLibrary> _inputLibrary;

        // Extensibility points to be implemented by a plugin
        public abstract TypeFactory TypeFactory { get; }
        public virtual string LicenseString => string.Empty;
        public abstract ExtensibleSnippets ExtensibleSnippets { get; }
        public abstract OutputLibrary OutputLibrary { get; }
        public InputLibrary InputLibrary => _inputLibrary.Value;
        public virtual TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);
        public virtual IReadOnlyList<MetadataReference> AdditionalMetadataReferences => Array.Empty<MetadataReference>();

        /// <summary>
        /// Returns the serialization type providers for the given model type provider.
        /// </summary>
        /// <param name="provider">The model type provider.</param>
        /// <param name="inputModel">The input model.</param>
        public virtual IReadOnlyList<TypeProvider> GetSerializationTypeProviders(TypeProvider provider, InputType inputMoedl)
        {
            if (provider is EnumProvider { IsExtensible: true } fixedProvider)
            {
                return [new ExtensibleEnumSerializationProvider(fixedProvider)];
            }
            else if (provider is EnumProvider { IsExtensible: false } extensibleProvider)
            {
                return [new FixedEnumSerializationProvider(extensibleProvider)];
            }
            return Array.Empty<TypeProvider>();
        }
    }
}

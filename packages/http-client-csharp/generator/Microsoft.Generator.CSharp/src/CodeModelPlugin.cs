// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Host.Mef;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Base class for code model plugins. This class is exported via MEF and can be implemented by an inherited plugin class.
    /// </summary>
    [InheritedExport]
    [Export(typeof(CodeModelPlugin))]
    [ExportMetadata("PluginName", nameof(CodeModelPlugin))]
    public abstract class CodeModelPlugin
    {
        private static CodeModelPlugin? _instance;
        internal static CodeModelPlugin Instance
        {
            get
            {
                return _instance ?? throw new InvalidOperationException("CodeModelPlugin is not initialized");
            }
            set
            {
                _instance = value;
            }
        }

        public Configuration Configuration { get; }

        [ImportingConstructor]
        public CodeModelPlugin(GeneratorContext context)
        {
            Configuration = context.Configuration;
            _inputLibrary = new(() => new InputLibrary(Instance.Configuration.OutputDirectory));
        }

        private Lazy<InputLibrary> _inputLibrary;

        // Extensibility points to be implemented by a plugin
        public abstract TypeFactory TypeFactory { get; }
        public virtual string LicenseString => string.Empty;
        public virtual OutputLibrary OutputLibrary { get; } = new();
        public InputLibrary InputLibrary => _inputLibrary.Value;
        public virtual TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);
        public virtual IReadOnlyList<MetadataReference> AdditionalMetadataReferences => Array.Empty<MetadataReference>();

        /// <summary>
        /// Returns the serialization type providers for the given model type provider.
        /// </summary>
        /// <param name="inputType">The input model.</param>
        public virtual IReadOnlyList<TypeProvider> GetSerializationTypeProviders(InputType inputType)
        {
            if (inputType is InputEnumType enumType)
            {
                var provider = Instance.TypeFactory.CreateEnum(enumType);
                if (provider is EnumProvider { IsExtensible: false } enumProvider)
                {
                    return [new FixedEnumSerializationProvider(enumProvider)];
                }
            }

            return [];
        }
    }
}

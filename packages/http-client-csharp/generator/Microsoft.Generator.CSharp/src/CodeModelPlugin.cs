// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Microsoft.CodeAnalysis;
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
        private List<LibraryVisitor> _visitors = new();
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

        public virtual IReadOnlyList<LibraryVisitor> Visitors => _visitors;

        [ImportingConstructor]
        public CodeModelPlugin(GeneratorContext context)
        {
            Configuration = context.Configuration;
            _inputLibrary = new(() => new InputLibrary(Instance.Configuration.OutputDirectory));
            TypeFactory = new TypeFactory();
        }

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected CodeModelPlugin()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        internal bool IsNewProject { get; set; }

        private Lazy<InputLibrary> _inputLibrary;

        // Extensibility points to be implemented by a plugin
        public virtual TypeFactory TypeFactory { get; }
        public virtual string LicenseString => string.Empty;
        public virtual OutputLibrary OutputLibrary { get; } = new();
        public virtual InputLibrary InputLibrary => _inputLibrary.Value;
        public virtual TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);
        public virtual IReadOnlyList<MetadataReference> AdditionalMetadataReferences => [];

        public virtual void Configure()
        {
        }

        public virtual void AddVisitor(LibraryVisitor visitor)
        {
            _visitors.Add(visitor);
        }
    }
}

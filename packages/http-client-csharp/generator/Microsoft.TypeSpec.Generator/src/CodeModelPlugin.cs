// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;

namespace Microsoft.TypeSpec.Generator
{
    /// <summary>
    /// Base class for code model plugins. This class is exported via MEF and can be implemented by an inherited plugin class.
    /// </summary>
    [InheritedExport]
    [Export(typeof(CodeModelPlugin))]
    [ExportMetadata("PluginName", nameof(CodeModelPlugin))]
    public abstract class CodeModelPlugin
    {
        private List<LibraryVisitor> _visitors = [];
        private List<MetadataReference> _additionalMetadataReferences = [];
        private static CodeModelPlugin? _instance;
        private List<string> _sharedSourceDirectories = [];
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

        public IReadOnlyList<LibraryVisitor> Visitors => _visitors;

        [ImportingConstructor]
        public CodeModelPlugin(GeneratorContext context)
        {
            Configuration = context.Configuration;
            _inputLibrary = new InputLibrary(Configuration.OutputDirectory);
            TypeFactory = new TypeFactory();
            Emitter = null!;
        }

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected CodeModelPlugin()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        internal bool IsNewProject { get; set; }
        private InputLibrary _inputLibrary;

        public virtual Emitter Emitter { get; internal set; }

        // Extensibility points to be implemented by a plugin
        public virtual TypeFactory TypeFactory { get; }

        private SourceInputModel? _sourceInputModel;
        public virtual SourceInputModel SourceInputModel
        {
            get => _sourceInputModel ?? throw new InvalidOperationException($"SourceInputModel has not been initialized yet");
            internal set
            {
                _sourceInputModel = value;
            }
        }

        public virtual string LicenseString => string.Empty;
        public virtual OutputLibrary OutputLibrary { get; } = new();
        public virtual InputLibrary InputLibrary => _inputLibrary;
        public virtual TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);
        public IReadOnlyList<MetadataReference> AdditionalMetadataReferences => _additionalMetadataReferences;

        public IReadOnlyList<string> SharedSourceDirectories => _sharedSourceDirectories;

        internal IReadOnlyList<TypeProvider> CustomCodeAttributeProviders { get; } =
        [
            new CodeGenTypeAttributeDefinition(),
            new CodeGenMemberAttributeDefinition(),
            new CodeGenSuppressAttributeDefinition(),
            new CodeGenSerializationAttributeDefinition()
        ];

        public virtual void Configure()
        {
            foreach (var type in CustomCodeAttributeProviders)
            {
                AddTypeToKeep(type);
            }
        }

        public void AddVisitor(LibraryVisitor visitor)
        {
            _visitors.Add(visitor);
        }

        public void AddMetadataReference(MetadataReference reference)
        {
            _additionalMetadataReferences.Add(reference);
        }

        public void AddSharedSourceDirectory(string sharedSourceDirectory)
        {
            _sharedSourceDirectories.Add(sharedSourceDirectory);
        }

        internal HashSet<string> TypesToKeep { get; } = new();

        /// <summary>
        /// Adds a type to the list of types to keep.
        /// </summary>
        /// <param name="typeName">Either a fully qualified type name or simple type name.</param>
        public void AddTypeToKeep(string typeName)
        {
            TypesToKeep.Add(typeName);
        }

        /// <summary>
        /// Adds a type to the list of types to keep.
        /// </summary>
        /// <param name="type">The type provider representing the type.</param>
        public void AddTypeToKeep(TypeProvider type) => AddTypeToKeep(type.Type.FullyQualifiedName);
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;

namespace Microsoft.TypeSpec.Generator
{
    /// <summary>
    /// Base class for code model generators. This class is exported via MEF and can be implemented by an
    /// inherited generator class.
    /// </summary>
    [InheritedExport]
    [Export(typeof(CodeModelGenerator))]
    [ExportMetadata(GeneratorMetadataName, nameof(CodeModelGenerator))]
    public abstract class CodeModelGenerator
    {
        private List<LibraryVisitor> _visitors = [];
        private List<MetadataReference> _additionalMetadataReferences = [];
        private static CodeModelGenerator? _instance;
        private List<string> _sharedSourceDirectories = [];
        /// <summary>
        /// The metadata name used to identify generator implementations.
        /// </summary>
        public const string GeneratorMetadataName = "GeneratorName";
        internal static CodeModelGenerator Instance
        {
            get
            {
                return _instance ?? throw new InvalidOperationException("CodeModelGenerator is not initialized");
            }
            set
            {
                _instance = value;
            }
        }

        /// <summary>
        /// Gets the configuration settings for the code generation process.
        /// </summary>
        public Configuration Configuration { get; }

        /// <summary>
        /// Gets the list of library visitors that process the generated code model.
        /// </summary>
        public IReadOnlyList<LibraryVisitor> Visitors => _visitors;

        /// <summary>
        /// Gets the list of library rewriters that transform the generated code model.
        /// </summary>
        public IReadOnlyList<LibraryRewriter> Rewriters => _rewriters;

        /// <summary>
        /// Initializes a new instance of the <see cref="CodeModelGenerator"/> class with the specified context.
        /// </summary>
        /// <param name="context">The generator context containing configuration and setup information.</param>
        [ImportingConstructor]
        public CodeModelGenerator(GeneratorContext context)
        {
            Configuration = context.Configuration;
            _inputLibrary = new InputLibrary(Configuration.OutputDirectory);
            TypeFactory = new TypeFactory();
            Emitter = new Emitter(Console.OpenStandardOutput());
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="CodeModelGenerator"/> class. Used for mocking purposes.
        /// </summary>
        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected CodeModelGenerator()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        internal bool IsNewProject { get; set; }
        private InputLibrary _inputLibrary;

        /// <summary>
        /// Gets the emitter used for outputting generated code and diagnostics.
        /// </summary>
        public virtual Emitter Emitter { get; }

        /// <summary>
        /// Gets the type factory used for creating and managing type representations.
        /// </summary>
        // Extensibility points to be implemented by a generator
        public virtual TypeFactory TypeFactory { get; }

        private SourceInputModel? _sourceInputModel;
        private List<LibraryRewriter> _rewriters = [];

        /// <summary>
        /// Gets the source input model containing type definitions from external sources.
        /// </summary>
        public virtual SourceInputModel SourceInputModel
        {
            get => _sourceInputModel ?? throw new InvalidOperationException($"SourceInputModel has not been initialized yet");
            internal set
            {
                _sourceInputModel = value;
            }
        }

        /// <summary>
        /// Gets the license header text to be included in generated files.
        /// </summary>
        public string LicenseHeader => Configuration.LicenseInfo?.Header ?? string.Empty;
        /// <summary>
        /// Gets the output library containing the generated types and code.
        /// </summary>
        public virtual OutputLibrary OutputLibrary { get; } = new();
        /// <summary>
        /// Gets the input library containing the source types and metadata.
        /// </summary>
        public virtual InputLibrary InputLibrary => _inputLibrary;
        /// <summary>
        /// Gets a writer for the specified type provider.
        /// </summary>
        /// <param name="provider">The type provider to get a writer for.</param>
        /// <returns>A <see cref="TypeProviderWriter"/> for the specified provider.</returns>
        public virtual TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);
        /// <summary>
        /// Gets additional metadata references for compilation.
        /// </summary>
        public IReadOnlyList<MetadataReference> AdditionalMetadataReferences => _additionalMetadataReferences;

        /// <summary>
        /// Gets the list of shared source directories for compilation.
        /// </summary>
        public IReadOnlyList<string> SharedSourceDirectories => _sharedSourceDirectories;

        internal IReadOnlyList<TypeProvider> CustomCodeAttributeProviders { get; } =
        [
            new CodeGenTypeAttributeDefinition(),
            new CodeGenMemberAttributeDefinition(),
            new CodeGenSuppressAttributeDefinition(),
            new CodeGenSerializationAttributeDefinition()
        ];

        /// <summary>
        /// Configures the code model generator by setting up custom code attributes and other initialization.
        /// </summary>
        protected internal virtual void Configure()
        {
            foreach (var type in CustomCodeAttributeProviders)
            {
                AddTypeToKeep(type);
            }
        }

        /// <summary>
        /// Adds a visitor to the list of library visitors that will process the generated code model.
        /// </summary>
        /// <param name="visitor">The visitor to add.</param>
        public void AddVisitor(LibraryVisitor visitor)
        {
            _visitors.Add(visitor);
        }

        /// <summary>
        /// Adds a rewriter to the list of library rewriters that will transform the generated code model.
        /// </summary>
        /// <param name="rewriter">The rewriter to add.</param>
        public void AddRewriter(LibraryRewriter rewriter)
        {
            _rewriters.Add(rewriter);
        }

        /// <summary>
        /// Adds a metadata reference for compilation.
        /// </summary>
        /// <param name="reference">The metadata reference to add.</param>
        public void AddMetadataReference(MetadataReference reference)
        {
            _additionalMetadataReferences.Add(reference);
        }

        /// <summary>
        /// Adds a shared source directory for compilation.
        /// </summary>
        /// <param name="sharedSourceDirectory">The shared source directory path to add.</param>
        public void AddSharedSourceDirectory(string sharedSourceDirectory)
        {
            _sharedSourceDirectories.Add(sharedSourceDirectory);
        }

        internal HashSet<string> TypesToKeep { get; } = [];

        internal HashSet<string> TypesToKeepPublic { get; } = [];

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

        /// <summary>
        /// Adds a type to the list of types to keep as public.
        /// </summary>
        /// <param name="typeName">The type provider representing the type.</param>
        public void AddTypeToKeepPublic(string typeName) => TypesToKeepPublic.Add(typeName);
    }
}

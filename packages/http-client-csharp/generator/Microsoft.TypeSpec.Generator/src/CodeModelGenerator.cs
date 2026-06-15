// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
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
        public const string GeneratorMetadataName = "GeneratorName";

        /// <summary>
        /// The fixed namespace used for CodeGen customization attributes.
        /// Using a fixed namespace avoids API compatibility failures when the project namespace changes.
        /// </summary>
        internal const string CustomizationAttributeNamespace = "Microsoft.TypeSpec.Generator.Customizations";

        internal Stopwatch Stopwatch { get; } = new Stopwatch();
        public static CodeModelGenerator Instance
        {
            get
            {
                return _instance ?? throw new InvalidOperationException("CodeModelGenerator is not initialized");
            }
            internal set
            {
                _instance = value;
            }
        }

        public Configuration Configuration { get; }

        public IReadOnlyList<LibraryVisitor> Visitors => _visitors;

        public IReadOnlyList<LibraryRewriter> Rewriters => _rewriters;

        [ImportingConstructor]
        public CodeModelGenerator(GeneratorContext context)
        {
            Configuration = context.Configuration;
            _inputLibrary = new InputLibrary(Configuration.OutputDirectory);
            TypeFactory = new TypeFactory();
            Emitter = new Emitter(Console.OpenStandardOutput());
        }

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected CodeModelGenerator()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        internal bool IsNewProject { get; set; }
        private InputLibrary _inputLibrary;

        public virtual Emitter Emitter { get; }

        // Extensibility points to be implemented by a generator
        public virtual TypeFactory TypeFactory { get; }

        private SourceInputModel? _sourceInputModel;
        private List<LibraryRewriter> _rewriters = [];

        public virtual SourceInputModel SourceInputModel
        {
            get => _sourceInputModel ?? throw new InvalidOperationException($"SourceInputModel has not been initialized yet");
            internal set
            {
                _sourceInputModel = value;
            }
        }

        public string LicenseHeader => Configuration.LicenseInfo?.Header ?? string.Empty;
        public virtual OutputLibrary OutputLibrary { get; } = new();
        public virtual InputLibrary InputLibrary => _inputLibrary;
        public virtual TypeProviderWriter GetWriter(TypeProvider provider) => new(provider);
        public IReadOnlyList<MetadataReference> AdditionalMetadataReferences => _additionalMetadataReferences;

        public IReadOnlyList<string> SharedSourceDirectories => _sharedSourceDirectories;

        /// <summary>
        /// The list of <see cref="TypeProvider"/> instances that define custom-code attributes. These attribute
        /// definitions are generated into the SDK project and are made available to the compiler while it compiles
        /// custom code. Derived generators can contribute additional providers via
        /// <see cref="AddCustomCodeAttributeProvider(TypeProvider)"/>.
        /// </summary>
        internal List<TypeProvider> CustomCodeAttributeProviders { get; } =
        [
            new CodeGenTypeAttributeDefinition(),
            new CodeGenMemberAttributeDefinition(),
            new CodeGenSuppressAttributeDefinition(),
            new CodeGenSerializationAttributeDefinition()
        ];

        protected internal virtual void Configure()
        {
            if (string.IsNullOrEmpty(Configuration.PackageName))
            {
                Configuration.PackageName = TypeFactory.PrimaryNamespace;
                Emitter.Info($"'package-name' was not specified. Defaulting to namespace '{Configuration.PackageName}'.");
            }

            foreach (var type in CustomCodeAttributeProviders)
            {
                AddTypeToKeep(type);
            }
        }

        public virtual void AddVisitor(LibraryVisitor visitor)
        {
            _visitors.Add(visitor);
        }

        /// <summary>
        /// Removes all visitors of the specified type from the list of visitors.
        /// </summary>
        /// <typeparam name="T">The type of visitor to remove.</typeparam>
        public virtual void RemoveVisitor<T>() where T : LibraryVisitor
        {
            _visitors.RemoveAll(v => v.GetType() == typeof(T));
        }

        /// <summary>
        /// Removes all visitors whose type name matches the specified name from the list of visitors.
        /// This overload is useful when the visitor type is not publicly accessible.
        /// </summary>
        /// <param name="visitorTypeName">The name of the visitor type to remove.</param>
        public virtual void RemoveVisitor(string visitorTypeName)
        {
            _visitors.RemoveAll(v => v.GetType().Name == visitorTypeName);
        }

        public virtual void AddRewriter(LibraryRewriter rewriter)
        {
            _rewriters.Add(rewriter);
        }

        public virtual void AddMetadataReference(MetadataReference reference)
        {
            _additionalMetadataReferences.Add(reference);
        }

        public virtual void AddSharedSourceDirectory(string sharedSourceDirectory)
        {
            _sharedSourceDirectories.Add(sharedSourceDirectory);
        }

        /// <summary>
        /// Adds a custom-code attribute provider that derived generators can use to contribute
        /// generator-specific attribute definitions. The provider's attribute definition is generated into
        /// the SDK project and made available to the compiler while it compiles custom code.
        /// </summary>
        /// <param name="provider">The <see cref="TypeProvider"/> that defines the custom-code attribute.</param>
        protected void AddCustomCodeAttributeProvider(TypeProvider provider)
        {
            CustomCodeAttributeProviders.Add(provider);
        }

        private record KeptTypesInfo(HashSet<string> TypeNames, HashSet<TypeProvider> TypeProviders);

        private readonly KeptTypesInfo _additionalRootTypeInfo = new([], []);
        private readonly KeptTypesInfo _nonRootTypeInfo = new([], []);

        private HashSet<string>? _additionalRootTypes;
        private HashSet<string>? _nonRootTypes;

        /// <summary>
        /// The set of fully qualified type names to keep as roots. Resolved lazily so that
        /// <see cref="TypeProvider"/> entries added via <see cref="AddTypeToKeep(TypeProvider, bool)"/>
        /// are not forced to materialize their <see cref="TypeProvider.Type"/> at registration time
        /// (which would dispatch virtual <c>Build*</c> methods on partially constructed providers).
        /// </summary>
        internal HashSet<string> AdditionalRootTypes => _additionalRootTypes ??= MaterializeKeepSet(_additionalRootTypeInfo);

        /// <summary>
        /// The set of fully qualified type names to keep as non-roots. Resolved lazily; see
        /// <see cref="AdditionalRootTypes"/> for rationale.
        /// </summary>
        internal HashSet<string> NonRootTypes => _nonRootTypes ??= MaterializeKeepSet(_nonRootTypeInfo);

        private static HashSet<string> MaterializeKeepSet(KeptTypesInfo info)
        {
            if (info.TypeProviders.Count == 0)
            {
                return info.TypeNames;
            }
            var result = new HashSet<string>(info.TypeNames);
            foreach (var provider in info.TypeProviders)
            {
                result.Add(provider.Type.FullyQualifiedName);
            }
            return result;
        }

        /// <summary>
        /// Adds a type to the list of types to keep.
        /// </summary>
        /// <param name="typeName">Either a fully qualified type name or simple type name.</param>
        /// <param name="isRoot">Whether to treat the type as a root type. Any dependencies of root types will
        /// not have their accessibility changed regardless of the 'unreferenced-types-handling' value.</param>
        public void AddTypeToKeep(string typeName, bool isRoot = true)
        {
            if (isRoot)
            {
                if (_additionalRootTypeInfo.TypeNames.Add(typeName))
                {
                    _additionalRootTypes = null;
                }
            }
            else
            {
                if (_nonRootTypeInfo.TypeNames.Add(typeName))
                {
                    _nonRootTypes = null;
                }
            }
        }

        /// <summary>
        /// Adds a type to the list of types to keep.
        /// </summary>
        /// <remarks>
        /// The provider's fully qualified name is resolved lazily, when the keep list is consumed during
        /// post-processing. This makes it safe to call this method from a <see cref="TypeProvider"/>
        /// constructor (including base constructors that run before the derived constructor body), since
        /// it does not force evaluation of <see cref="TypeProvider.Type"/> — which would dispatch virtual
        /// <c>Build*</c> methods on a not-yet-fully-constructed instance.
        /// </remarks>
        /// <param name="type">The type provider representing the type.</param>
        /// <param name="isRoot">Whether to treat the type as a root type. Any dependencies of root types will
        /// not have their accessibility changed regardless of the 'unreferenced-types-handling' value.</param>
        public void AddTypeToKeep(TypeProvider type, bool isRoot = true)
        {
            if (isRoot)
            {
                if (_additionalRootTypeInfo.TypeProviders.Add(type))
                {
                    _additionalRootTypes = null;
                }
            }
            else
            {
                if (_nonRootTypeInfo.TypeProviders.Add(type))
                {
                    _nonRootTypes = null;
                }
            }
        }

        /// <summary>
        /// Writes additional output files (e.g. configuration schemas) after the main code generation is complete.
        /// Override this method to generate non-C# output files.
        /// </summary>
        /// <param name="outputPath">The root output directory.</param>
        public virtual Task WriteAdditionalFiles(string outputPath) => Task.CompletedTask;
    }
}

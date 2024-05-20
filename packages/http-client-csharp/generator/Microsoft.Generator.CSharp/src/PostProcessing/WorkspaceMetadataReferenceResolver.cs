// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.IO;
using System.Runtime.CompilerServices;
using Microsoft.CodeAnalysis;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Resolves metadata references for a workspace.
    /// </summary>
    internal class WorkspaceMetadataReferenceResolver : MetadataReferenceResolver
    {
        // The set of unique directory paths to probe for assemblies.
        private readonly HashSet<string> _probingPaths;

        /// <summary>
        /// Initializes a new instance of the <see cref="WorkspaceMetadataReferenceResolver"/> class
        /// and populates the probing paths with the directories of the trusted assemblies.
        /// </summary>
        internal WorkspaceMetadataReferenceResolver()
        {
            IReadOnlyList<string> trustedAssemblies = ((string?)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES") ?? "").Split(Path.PathSeparator);
            HashSet<string> probingPaths = new();

            foreach (var assembly in trustedAssemblies)
            {
                var directory = Path.GetDirectoryName(assembly);
                if (directory != null)
                {
                    probingPaths.Add(directory);
                }
            }

            _probingPaths = probingPaths;
        }

        internal bool Equals(WorkspaceMetadataReferenceResolver? other)
        {
            return ReferenceEquals(this, other);
        }

        public override bool ResolveMissingAssemblies => true;

        public override bool Equals(object? other) => Equals(other as WorkspaceMetadataReferenceResolver);

        public override int GetHashCode()
        {
            return RuntimeHelpers.GetHashCode(_probingPaths);
        }

        /// <summary>
        /// Attempts to resolve a missing assembly reference for the specified definition and reference identity.
        /// The resolver will attempt to locate the assembly in the probing paths <see cref="ProbingPaths"/>. If the assembly
        /// is found, a <see cref="PortableExecutableReference"/> is created and returned; otherwise, <see langword="null"/> is returned.
        /// </summary>
        public override PortableExecutableReference? ResolveMissingAssembly(MetadataReference definition, AssemblyIdentity referenceIdentity)
        {
            // check the probing paths
            foreach (var path in _probingPaths)
            {
                var assemblyPath = Path.Combine(path, referenceIdentity.Name + ".dll");
                if (FileExists(assemblyPath))
                {
                    return MetadataReference.CreateFromFile(assemblyPath);
                }
            }

            return null;
        }

        public override ImmutableArray<PortableExecutableReference> ResolveReference(string reference, string? baseFilePath, MetadataReferenceProperties properties)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// A wrapper around <see cref="File.Exists(string)"/>.
        /// </summary>
        /// <param name="path">The path to validate for existence.</param>
        /// <returns><c>true</c> if the specified file path exists.</returns>
        internal virtual bool FileExists(string path)
        {
            return File.Exists(path);
        }
    }
}

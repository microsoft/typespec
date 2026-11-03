// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal sealed partial class PreparedFieldTypes
    {
        private readonly Guid _sourceGeneration = Guid.NewGuid();
        private readonly Dictionary<TypeProvider, PreparedSourceFile> _sourceFiles = new(ReferenceEqualityComparer.Instance);
        private Configuration? _sourceConfiguration;
        private bool _sourceDisableXmlDocs;
        private bool _sourceDisposed;
        private IReadOnlyList<TypeProvider>? _sourceRootList;
        private ImmutableArray<TypeProvider> _sourceRootSnapshot;
        internal Guid SourceGeneration => _sourceGeneration;
        internal bool HasSourceFiles => _sourceFiles.Count != 0;
        internal ImmutableArray<PreparedSourceFile> SourceFiles => _sourceFiles.Values.ToImmutableArray();

        private void CaptureSourceFiles(TypeProvider[] files, Compilation compilation, IReadOnlyList<TypeProvider> sourceRoots)
        {
            if (!ContractCollections.TryCopy(sourceRoots, out _sourceRootSnapshot)) { return; }
            _sourceRootList = sourceRoots;
            _sourceConfiguration = CodeModelGenerator.Instance.Configuration;
            _sourceDisableXmlDocs = _sourceConfiguration.DisableXmlDocs;
            foreach (var owner in files)
            {
                // The normal finalized provider path has already materialized the physical file path.
                // Never invoke a lazy builder here to fill a missing source descriptor.
                if (owner.CachedRelativeFilePath is not { } path) { continue; }
                _sourceFiles.Add(owner, new PreparedSourceFile(_sourceGeneration, owner, path, compilation, _sourceDisableXmlDocs));
            }
        }

        internal PreparedSourceFile? GetSourceFile(TypeProvider owner)
        {
            ObserveSourceSnapshot();
            return _sourceFiles.TryGetValue(owner, out var file) ? file : null;
        }

        internal void ObserveSourceSnapshot()
        {
            if (_sourceDisposed || _sourceConfiguration is null) { return; }
            if (!ContractCollections.SameReferences(_sourceRootList, _sourceRootSnapshot) ||
                !ReferenceEquals(_sourceConfiguration, CodeModelGenerator.Instance.Configuration) ||
                _sourceConfiguration.DisableXmlDocs != _sourceDisableXmlDocs || !SourceInputsAreCurrent() ||
                _sourceInputs is not null && !IsPolicyEnabled(CodeModelGenerator.Instance))
            {
                InvalidateSourceFiles();
                return;
            }
            foreach (var file in _sourceFiles.Values) { file.IsCurrent(); }
        }

        private void InvalidateSourceFiles()
        {
            _sourceDisposed = true;
            foreach (var file in _sourceFiles.Values) { file.Invalidate(); }
        }
    }
}

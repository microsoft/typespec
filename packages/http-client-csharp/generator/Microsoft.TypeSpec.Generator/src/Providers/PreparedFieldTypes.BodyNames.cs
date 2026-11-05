// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal sealed partial class PreparedFieldTypes
    {
        private readonly Dictionary<SourceOccurrenceId, PreparedTypeOfNamespacePermission> _typeOfNames = new();
        private readonly Dictionary<TypeProvider, HashSet<string>> _bodyImports = new(ReferenceEqualityComparer.Instance);
        private readonly Dictionary<PreparedSourceFile, HashSet<PreparedTypeOfNamespacePermission>> _usedBodyNames = new(ReferenceEqualityComparer.Instance);
        private int _sharedSnapshotStale;

        private bool HasBodyNameCandidates => _typeOfNames.Count != 0;

        // Capture before the existing root lifetime is published or attached.
        // Merely having source facts does not admit a fieldless preparation.
        private void CaptureBodyNames()
        {
            var parseOptions = _sourceInputs?.ParseOptions ?? CSharpParseOptions.Default;
            foreach (var file in _sourceFiles.Values)
            {
                var imports = new HashSet<string>(System.StringComparer.Ordinal);
                foreach (var leaf in file.Roots.SelectMany(root => root.DescendantsAndSelf()))
                {
                    if (leaf.Producer.GetType() != typeof(TypeOfExpression) && leaf.Producer.GetType() != typeof(DeclarationExpression)) { continue; }
                    var permission = PreparedTypeOfNamespacePermission.TryCapture(this, file, leaf, parseOptions, imports);
                    if (permission is not null) { _typeOfNames.Add(leaf.Id, permission); }
                }
                if (_typeOfNames.Values.Any(permission => ReferenceEquals(permission.File, file)))
                {
                    _bodyImports.Add(file.FileOwner, imports);
                }
            }
        }

        private void ObserveBodyImport(TypeProvider owner, string namespaceName)
        {
            // Exactly the imports registered by the owned standard writer. A late
            // unexpected import stales body permissions, not independent fields.
            if (_bodyImports.TryGetValue(owner, out var imports)) { imports.Add(namespaceName); }
        }

        internal PreparedTypeOfNamespacePermission? GetTypeOfNamePermission(PreparedSourceFile file, PreparedSourceOccurrence occurrence)
        {
            // No new permission means no new environment/currentness callbacks.
            if (!_typeOfNames.TryGetValue(occurrence.Id, out var permission) || !ReferenceEquals(permission.File, file) ||
                !ReferenceEquals(permission.Occurrence, occurrence)) { return null; }
            ObserveSourceSnapshot();
            if (_sourceDisposed || !IsSnapshotCurrent() || !_sourceFiles.TryGetValue(file.FileOwner, out var owned) ||
                !ReferenceEquals(owned, file) || !permission.IsCurrent)
            {
                return null;
            }
            return permission;
        }

        internal void RegisterBodyNameUse(PreparedTypeOfNamespacePermission permission)
        {
            // Record the actual use even if it has just gone stale; commit must
            // then choose the captured qualified alternative, never forget it.
            if (!_usedBodyNames.TryGetValue(permission.File, out var used))
            {
                used = new HashSet<PreparedTypeOfNamespacePermission>(ReferenceEqualityComparer.Instance);
                _usedBodyNames.Add(permission.File, used);
            }
            used.Add(permission);
        }

        internal bool CanCommitBodyNames(CodeFile output)
        {
            var count = output.PreparedBodyNameCount;
            if (count == 0) { return true; }
            ObserveSourceSnapshot();
            if (_sourceDisposed || !IsSnapshotCurrent() || output.SourceConsumption is not { WasCurrentAtEndOfWrite: true } receipt)
            {
                return false;
            }
            var file = _sourceFiles.Values.SingleOrDefault(file => file.Generation == receipt.Generation && file.FilePath == receipt.File);
            return file is not null && receipt.RootCount == file.Roots.Length && file.IsCurrent() &&
                _usedBodyNames.TryGetValue(file, out var used) && used.Count == count &&
                used.All(permission => _typeOfNames.TryGetValue(permission.OccurrenceId, out var captured) &&
                    ReferenceEquals(captured, permission) && receipt.Consumed.Contains(permission.OccurrenceId) && permission.IsCurrent);
        }

        internal bool CanCommitSharedSnapshot()
        {
            ObserveSourceSnapshot();
            return !_sourceDisposed && IsSnapshotCurrent();
        }

        // Shared root/input failure is sticky for BOTH channels. The existing
        // _valid flag can still fail independently for field-only dependencies.
        private bool IsSnapshotCurrent()
        {
            if (System.Threading.Volatile.Read(ref _sharedSnapshotStale) != 0) { return false; }
            if (CheckSnapshotCurrent()) { return true; }
            System.Threading.Interlocked.Exchange(ref _sharedSnapshotStale, 1);
            return false;
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>File view owned by PreparedFieldTypes; no independent lifetime or reduction authority.</summary>
    internal sealed class PreparedSourceFile
    {
        internal Guid Generation { get; }
        internal Compilation Compilation => _compilation;
        internal bool DisableXmlDocs => _disableXmlDocs;
        internal TypeProvider FileOwner { get; }
        internal string FilePath { get; }
        internal ImmutableArray<PreparedSourceOccurrence> Roots => _roots;
        internal bool IsInvalid => System.Threading.Volatile.Read(ref _invalid) != 0;
        internal PreparedSourceObservations? Observations { get; private set; }
        private readonly Compilation _compilation;
        private readonly bool _disableXmlDocs;
        private readonly Func<CSharpType, INamedTypeSymbol?>? _resolveCallType;
        private readonly Func<bool>? _callEnvironmentCurrent;
        private readonly Func<CSharpType, PreparedGeneratedMethodGroup?>? _resolveGeneratedGroup;
        private readonly Func<ITypeSymbol, string, CSharpType?, PreparedReducedExtensionGroup?>? _resolveReducedGroup;
        private readonly bool _allowBaseInitializer;
        private readonly ImmutableArray<PreparedSourceOccurrence> _roots;
        private readonly Dictionary<TypeProvider, Dictionary<(string Role, int Index), PreparedSourceOccurrence>> _byOwner = new(ReferenceEqualityComparer.Instance);
        private readonly List<OwnerSnapshot> _owners = [];
        private int _invalid;
        private bool _started;

        internal PreparedSourceFile(Guid generation, TypeProvider owner, string path, Compilation compilation, bool disableXmlDocs,
            Func<CSharpType, INamedTypeSymbol?>? resolveCallType = null, Func<bool>? callEnvironmentCurrent = null,
            Func<CSharpType, PreparedGeneratedMethodGroup?>? resolveGeneratedGroup = null,
            Func<ITypeSymbol, string, CSharpType?, PreparedReducedExtensionGroup?>? resolveReducedGroup = null, bool allowBaseInitializer = false)
        {
            Generation = generation;
            FileOwner = owner;
            FilePath = path;
            _compilation = compilation;
            _disableXmlDocs = disableXmlDocs;
            _resolveCallType = resolveCallType;
            _callEnvironmentCurrent = callEnvironmentCurrent;
            _resolveGeneratedGroup = resolveGeneratedGroup;
            _resolveReducedGroup = resolveReducedGroup;
            _allowBaseInitializer = allowBaseInitializer;
            var roots = new List<PreparedSourceOccurrence>();
            CaptureOwner(owner, "type", new HashSet<TypeProvider>(ReferenceEqualityComparer.Instance), roots);
            // Freeze even a rejected partial capture; ordering and references are
            // the same ones recorded by the owner map and consumed by the cursor.
            _roots = roots.ToImmutableArray();
        }

        internal static bool HasCommentOnlyLicenseHeader(string header)
        {
            // File headers split/prefix LF and CRLF, not every C# line end.
            // Unconsumed terminators can escape the prefixed line comments.
            for (var index = 0; index < header.Length; index++)
            {
                if (header[index] is '\u0085' or '\u2028' or '\u2029') { return false; }
                if (header[index] == '\r')
                {
                    if (index + 1 >= header.Length || header[index + 1] != '\n') { return false; }
                    index++;
                }
            }
            return true;
        }

        private void CaptureOwner(TypeProvider owner, string path, HashSet<TypeProvider> ancestors, List<PreparedSourceOccurrence> capturedRoots)
        {
            if (!ancestors.Add(owner) || _byOwner.ContainsKey(owner)) { Invalidate(); return; }
            var roots = new Dictionary<(string, int), PreparedSourceOccurrence>();
            _byOwner.Add(owner, roots);
            _owners.Add(new OwnerSnapshot(owner));
            void Add(string role, int index, object node, bool boundary)
            {
                var occurrence = PreparedSourceOccurrence.Capture(new(Generation, FilePath, path, role, index, "$"), node, boundary,
                    _compilation, _disableXmlDocs, _resolveCallType, _callEnvironmentCurrent, _resolveGeneratedGroup, _resolveReducedGroup,
                    _allowBaseInitializer && role == "constructor" && ReferenceEquals(owner, FileOwner));
                roots.Add((role, index), occurrence);
                capturedRoots.Add(occurrence);
            }
            // Type documentation can be lazily built/custom-produced during writing. Preserve it as
            // an opaque boundary, never call XmlDocs/ShouldWriteTypeXmlDocs here to discover it.
            Add("type-documentation", 0, owner, false);
            if (ContractCollections.TryCopy(owner.CachedWriteAttributes, out var attributes))
            { for (int i = 0; i < attributes.Length; i++) { Add("type-attribute", i, attributes[i], true); } }
            if (owner.CachedWhereClause is { } where) { Add("type-constraint", 0, where, true); }
            bool writesMembers = owner.CachedDeclarationModifiers?.HasFlag(TypeSignatureModifiers.Interface) != true;
            bool writesOnlyFields = owner.CachedDeclarationModifiers?.HasFlag(TypeSignatureModifiers.Enum) == true;
            if (writesMembers && ContractCollections.TryCopy(owner.CachedFields, out var fields))
            { for (int i = 0; i < fields.Length; i++) { Add("field", i, fields[i], false); } }
            if (writesMembers && !writesOnlyFields && ContractCollections.TryCopy(owner.CachedConstructors, out var constructors))
            { for (int i = 0; i < constructors.Length; i++) { Add("constructor", i, constructors[i], false); } }
            if (writesMembers && !writesOnlyFields && ContractCollections.TryCopy(owner.CachedProperties, out var properties))
            { for (int i = 0; i < properties.Length; i++) { Add("property", i, properties[i], false); } }
            if (writesMembers && !writesOnlyFields && ContractCollections.TryCopy(owner.CachedMethods, out var methods))
            { for (int i = 0; i < methods.Length; i++) { Add("method", i, methods[i], false); } }
            if (writesMembers && !writesOnlyFields && ContractCollections.TryCopy(owner.CachedNestedTypes, out var nested))
            { for (int i = 0; i < nested.Length; i++) { CaptureOwner(nested[i], $"{path}/nested[{i}]", ancestors, capturedRoots); } }
            ancestors.Remove(owner);
        }

        internal void FinalizeObservations()
        {
            if (_started || Observations is not null) { Invalidate(); return; }
            Observations = new PreparedSourceObservations(Roots, () => IsCurrent() && _callEnvironmentCurrent?.Invoke() == true);
        }

        internal bool IsCurrent()
        {
            if (IsInvalid) { return false; }
            if (_owners.All(o => o.IsCurrent()) && _roots.All(r => r.IsCurrent())) { return true; }
            Invalidate();
            return false;
        }

        internal void Invalidate() => System.Threading.Interlocked.Exchange(ref _invalid, 1);

        internal Cursor Start()
        {
            if (_started) { Invalidate(); }
            _started = true;
            return new Cursor(this);
        }

        internal sealed class Cursor
        {
            private readonly PreparedSourceFile _file;
            private readonly List<SourceOccurrenceId> _consumed = [];
            private readonly HashSet<PreparedSourceOccurrence> _rootsSeen = new(ReferenceEqualityComparer.Instance);
            private ImmutableArray<PreparedSourceOccurrence> _expected = [];
            private int _next;
            private int _nextRoot;
            private int _opaqueDepth;
            private bool _inRoot;
            private PreparedSourceOccurrence? _current;
            internal PreparedSourceOccurrence? Current => _file.IsInvalid ? null : _current;
            internal ImmutableArray<SourceOccurrenceId> Consumed => _consumed.ToImmutableArray();
            internal bool IsCurrent => _file.IsCurrent();
            internal Cursor(PreparedSourceFile file) { _file = file; }

            internal IDisposable BeginRoot(TypeProvider owner, string role, int index)
            {
                if (_inRoot || !_file.IsCurrent() || !_file._byOwner.TryGetValue(owner, out var roots) ||
                    !roots.TryGetValue((role, index), out var root) || _nextRoot >= _file._roots.Length ||
                    !ReferenceEquals(root, _file._roots[_nextRoot]) || !_rootsSeen.Add(root))
                { _file.Invalidate(); return EmptyScope.Instance; }
                _nextRoot++;
                _inRoot = true;
                _next = 0;
                _expected = Boundaries(root).ToImmutableArray();
                _current = root;
                if (!root.EmissionBoundary) { _consumed.Add(root.Id); }
                bool opaqueRoot = root.IsOpaque && !root.EmissionBoundary;
                if (opaqueRoot) { _opaqueDepth++; }
                return new Scope(() =>
                {
                    if (opaqueRoot) { _opaqueDepth--; }
                    if (_next != _expected.Length || !_file.IsCurrent()) { _file.Invalidate(); }
                    _current = null;
                    _inRoot = false;
                });
            }

            private static IEnumerable<PreparedSourceOccurrence> Boundaries(PreparedSourceOccurrence root)
            {
                if (root.EmissionBoundary) { yield return root; }
                if (root.IsOpaque) { yield break; }
                foreach (var child in root.Children)
                {
                    foreach (var boundary in Boundaries(child)) { yield return boundary; }
                }
            }

            internal IDisposable Enter(object producer)
            {
                if (_opaqueDepth > 0) { return EmptyScope.Instance; }
                if (!_inRoot) { return EmptyScope.Instance; } // non-executable writer scaffolding is not a source root
                if (!_file.IsCurrent() || _next >= _expected.Length || !ReferenceEquals(_expected[_next].Producer, producer))
                { _file.Invalidate(); return EmptyScope.Instance; }
                var occurrence = _expected[_next++];
                var previous = _current;
                _current = occurrence;
                _consumed.Add(occurrence.Id);
                if (occurrence.IsOpaque) { _opaqueDepth++; }
                var end = _next + (occurrence.IsOpaque ? 0 : occurrence.Children.Sum(c => Boundaries(c).Count()));
                return new Scope(() =>
                {
                    if (occurrence.IsOpaque) { _opaqueDepth--; }
                    if (_next != end || !_file.IsCurrent()) { _file.Invalidate(); }
                    _current = previous;
                });
            }

            internal bool Complete()
            {
                if (_inRoot || !_file.IsCurrent()) { _file.Invalidate(); }
                if (_nextRoot != _file._roots.Length || _rootsSeen.Count != _file._roots.Length) { _file.Invalidate(); }
                return !_file.IsInvalid;
            }
        }

        internal sealed class EmptyScope : IDisposable
        {
            internal static readonly EmptyScope Instance = new();
            public void Dispose() { }
        }
        private sealed class Scope(Action dispose) : IDisposable
        {
            private Action? _dispose = dispose;
            public void Dispose() { var action = _dispose; _dispose = null; action?.Invoke(); }
        }

        internal sealed class OwnerSnapshot
        {
            private readonly TypeProvider _owner;
            private readonly long _revision;
            private readonly CSharpType? _type;
            private readonly long? _typeRevision;
            private readonly DeclaredTypeSnapshot? _typeSnapshot;
            private readonly ImmutableArray<FieldProvider> _fields;
            private readonly ImmutableArray<PropertyProvider> _properties;
            private readonly ImmutableArray<MethodProvider> _methods;
            private readonly ImmutableArray<ConstructorProvider> _constructors;
            private readonly ImmutableArray<TypeProvider> _nested;
            private readonly ImmutableArray<TypeProvider> _serializations;
            private readonly bool _hasSerializations;
            private readonly ImmutableArray<MethodBodyStatement> _attributes;
            private readonly object? _where;
            private readonly TypeSignatureModifiers? _modifiers;
            private readonly string? _path;
            private readonly bool _hasFields, _hasProperties, _hasMethods, _hasConstructors, _hasNested, _hasAttributes;
            internal OwnerSnapshot(TypeProvider owner)
            {
                _owner = owner; _revision = owner.DeclarationRevision; _type = owner.CachedType; _typeRevision = _type?.IdentityVersion;
                if (_type is not null) { DeclaredTypeSnapshot.TryCapture(_type, out _typeSnapshot); }
                _hasFields = ContractCollections.TryCopy(owner.CachedFields, out _fields);
                _hasProperties = ContractCollections.TryCopy(owner.CachedProperties, out _properties);
                _hasMethods = ContractCollections.TryCopy(owner.CachedMethods, out _methods);
                _hasConstructors = ContractCollections.TryCopy(owner.CachedConstructors, out _constructors);
                _hasNested = ContractCollections.TryCopy(owner.CachedNestedTypes, out _nested);
                _hasSerializations = ContractCollections.TryCopy(owner.CachedSerializationProviders, out _serializations);
                _hasAttributes = ContractCollections.TryCopy(owner.CachedWriteAttributes, out _attributes);
                _where = owner.CachedWhereClause;
                _modifiers = owner.CachedDeclarationModifiers;
                _path = owner.CachedRelativeFilePath;
            }
            internal bool IsCurrent() => _owner.DeclarationRevision == _revision && ReferenceEquals(_owner.CachedType, _type) && _type?.IdentityVersion == _typeRevision && _typeSnapshot?.IsCurrent() == true &&
                (!_hasFields || ContractCollections.SameReferences(_owner.CachedFields, _fields)) &&
                (!_hasProperties || ContractCollections.SameReferences(_owner.CachedProperties, _properties)) &&
                (!_hasMethods || ContractCollections.SameReferences(_owner.CachedMethods, _methods)) &&
                (!_hasConstructors || ContractCollections.SameReferences(_owner.CachedConstructors, _constructors)) &&
                (!_hasNested || ContractCollections.SameReferences(_owner.CachedNestedTypes, _nested)) &&
                (!_hasSerializations || ContractCollections.SameReferences(_owner.CachedSerializationProviders, _serializations)) &&
                (!_hasAttributes || ContractCollections.SameReferences(_owner.CachedWriteAttributes, _attributes)) &&
                ReferenceEquals(_where, _owner.CachedWhereClause) && _modifiers == _owner.CachedDeclarationModifiers && _path == _owner.CachedRelativeFilePath;
        }
    }
}

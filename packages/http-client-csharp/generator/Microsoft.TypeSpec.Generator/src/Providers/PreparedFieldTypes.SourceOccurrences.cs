// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
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
        private PreparedSourceFile.OwnerSnapshot[] _callLookupScopes = [];
        private ImmutableArray<Func<bool>> _callEmissionChecks = [];
        private bool _callEmissionKnown;
        private bool _callEmissionInvalid;
        internal Guid SourceGeneration => _sourceGeneration;
        internal bool HasSourceFiles => _sourceFiles.Count != 0;
        internal ImmutableArray<PreparedSourceFile> SourceFiles => _sourceFiles.Values.ToImmutableArray();

        private void CaptureSourceFiles(TypeProvider[] files, CSharpCompilation compilation, IReadOnlyList<TypeProvider> sourceRoots,
            IReadOnlyList<TypeProvider> all, IReadOnlyDictionary<(string Namespace, string Name), TypeProvider[]> generated,
            HashSet<string> namespacePrefixes, bool callLookupClosed)
        {
            if (!ContractCollections.TryCopy(sourceRoots, out _sourceRootSnapshot)) { return; }
            _sourceRootList = sourceRoots;
            _sourceConfiguration = CodeModelGenerator.Instance.Configuration;
            _sourceDisableXmlDocs = _sourceConfiguration.DisableXmlDocs;
            // File-level header text can introduce competitors for metadata and
            // loaded-source calls too. Withhold call facts only, not fields or IR.
            callLookupClosed = callLookupClosed && PreparedSourceFile.HasCommentOnlyLicenseHeader(CodeModelGenerator.Instance.LicenseHeader);
            _callLookupScopes = all.Select(p => new PreparedSourceFile.OwnerSnapshot(p)).ToArray();
            _callEmissionKnown = CaptureCallEmissionPrerequisites(all);
            callLookupClosed = callLookupClosed && _callEmissionKnown;
            // Do not re-run arbitrary write-policy callbacks. An omitted input can
            // later introduce a competitor, so only this new proof producer retains.
            bool? loadedSourceAdmissible = null;
            INamedTypeSymbol? ResolveCallType(CSharpType type)
            {
                if (!callLookupClosed || generated.ContainsKey((type.Namespace, type.Name)) || namespacePrefixes.Contains(type.Namespace + "." + type.Name)) { return null; }
                if (!type.IsFrameworkType)
                {
                    // Existing loaded source only: never compile or bind a generated
                    // body. Cache this conservative new-family diagnostic gate.
                    loadedSourceAdmissible ??= !compilation.GetDiagnostics().Any(d => d.Severity == DiagnosticSeverity.Error);
                    if (loadedSourceAdmissible != true) { return null; }
                }
                return ResolveReferencedTarget(compilation, type, generated, forStaticCall: true, forLoadedSourceCall: !type.IsFrameworkType);
            }
            // Prepare the actual written inventories before capturing any file's
            // occurrences: neither file order nor provider intent selects a call.
            var signatureHeaders = new Dictionary<TypeProvider, PreparedGeneratedTypeHeader>(ReferenceEqualityComparer.Instance);
            foreach (var owner in all)
            {
                if (PreparedGeneratedTypeHeader.TryCapture(owner) is { } header) { signatureHeaders.Add(owner, header); }
            }
            PreparedGeneratedTypeHeader? ResolveGeneratedSignatureHeader(CSharpType type)
            {
                if (!callLookupClosed || type.GetType() != typeof(CSharpType) || type.IsFrameworkType || type.IsNullable || type.IsValueType || type.IsStruct ||
                    type.DeclaringType is not null || !ContractCollections.TryCopy(type.Arguments, out var arguments) || !arguments.IsEmpty ||
                    !generated.TryGetValue((type.Namespace, type.Name), out var owners) || owners.Length != 1 ||
                    !ReferenceEquals(owners[0].CachedType, type) || namespacePrefixes.Contains(type.Namespace + "." + type.Name) ||
                    !GeneratedNameIsUncontested(compilation, type.Namespace, type.Name)) { return null; }
                var prefix = string.Empty;
                foreach (var part in type.Namespace.Split('.'))
                {
                    if (generated.ContainsKey((prefix, part))) { return null; }
                    prefix = prefix.Length == 0 ? part : prefix + "." + part;
                }
                loadedSourceAdmissible ??= !compilation.GetDiagnostics().Any(d => d.Severity == DiagnosticSeverity.Error);
                return loadedSourceAdmissible == true && signatureHeaders.TryGetValue(owners[0], out var header) && header.IsCurrent ? header : null;
            }
            var generatedGroups = new Dictionary<TypeProvider, PreparedGeneratedMethodGroup>(ReferenceEqualityComparer.Instance);
            bool generatedEnvelopeClosed = callLookupClosed && all.Count == files.Length;
            if (generatedEnvelopeClosed)
            {
                foreach (var owner in all)
                {
                    var group = PreparedGeneratedMethodGroup.TryCapture(owner, compilation, ResolveGeneratedSignatureHeader);
                    if (group is null) { generatedEnvelopeClosed = false; break; }
                    generatedGroups.Add(owner, group);
                }
            }
            PreparedGeneratedMethodGroup? ResolveGeneratedGroup(CSharpType type)
            {
                if (!generatedEnvelopeClosed || type.GetType() != typeof(CSharpType) || type.IsFrameworkType || type.IsNullable || type.IsValueType || type.IsStruct ||
                    type.DeclaringType is not null || !ContractCollections.TryCopy(type.Arguments, out var arguments) || !arguments.IsEmpty ||
                    !generated.TryGetValue((type.Namespace, type.Name), out var owners) || owners.Length != 1 ||
                    namespacePrefixes.Contains(type.Namespace + "." + type.Name) || !GeneratedNameIsUncontested(compilation, type.Namespace, type.Name)) { return null; }
                var prefix = string.Empty;
                foreach (var part in type.Namespace.Split('.'))
                {
                    // A generated type at a namespace prefix is a competitor
                    // even when the target's full QName is otherwise unique.
                    if (generated.ContainsKey((prefix, part))) { return null; }
                    prefix = prefix.Length == 0 ? part : prefix + "." + part;
                }
                loadedSourceAdmissible ??= !compilation.GetDiagnostics().Any(d => d.Severity == DiagnosticSeverity.Error);
                return loadedSourceAdmissible == true && generatedGroups.Values.All(g => g.IsCurrent) &&
                    generatedGroups.TryGetValue(owners[0], out var group) ? group : null;
            }
            // Kept separate from generated-call admission: a declaration/import
            // envelope never grants selection authority for generated members.
            var importScope = callLookupClosed && all.Count == files.Length ? PreparedCallImportScope.TryCapture(all, compilation) : null;
            // First metadata-base initializer profile owns the complete single
            // physical type. Unknown other files/members cannot add competitors.
            var allowBaseInitializer = callLookupClosed && all.Count == 1 && files.Length == 1 &&
                ContractCollections.TryCopy(files[0].CachedConstructors, out var initializers) && initializers.Length == 1;
            if (allowBaseInitializer)
            {
                loadedSourceAdmissible ??= !compilation.GetDiagnostics().Any(d => d.Severity == DiagnosticSeverity.Error);
                allowBaseInitializer = loadedSourceAdmissible == true;
            }
            foreach (var owner in files)
            {
                // The normal finalized provider path has already materialized the physical file path.
                // Never invoke a lazy builder here to fill a missing source descriptor.
                if (owner.CachedRelativeFilePath is not { } path) { continue; }
                _sourceFiles.Add(owner, new PreparedSourceFile(_sourceGeneration, owner, path, compilation, _sourceDisableXmlDocs,
                    ResolveCallType, CallEnvironmentIsCurrent, ResolveGeneratedGroup,
                    (receiver, name, hint) => importScope?.Lookup(receiver, name, hint, owner.CachedType!.Namespace), allowBaseInitializer));
            }
            // Parent call proofs are captured after children. Analyze the frozen
            // graph only once every file and lookup-scope witness is available.
            foreach (var file in _sourceFiles.Values) { file.FinalizeObservations(); }
        }

        private static bool CaptureFileWarnings(TypeProvider owner, ImmutableArray<Func<bool>>.Builder checks)
        {
            var root = owner.CachedDisabledFileWarnings;
            var envelope = root is null ? null : PreparedSuppressionEnvelope.TryCapture(root);
            if (root is not null && envelope is null) { return false; }
            if (root is null && (owner.HasFileWarningInput || !DefaultEmissionMethod(owner, "BuildDisabledFileWarnings"))) { return false; }
            checks.Add(() =>
            {
                var current = owner.CachedDisabledFileWarnings;
                if (current is null) { return root is null && !owner.HasFileWarningInput; }
                // The default empty list can be materialized by the actual writer.
                // Observe it without invoking the getter or its builder here.
                if (root is null)
                {
                    root = current;
                    envelope = PreparedSuppressionEnvelope.TryCapture(current);
                }
                return ReferenceEquals(current, root) && envelope?.IsCurrent == true;
            });
            return true;
        }

        private bool CaptureCallEmissionPrerequisites(IReadOnlyList<TypeProvider> owners)
        {
            var checks = ImmutableArray.CreateBuilder<Func<bool>>();
            bool CaptureKnown(Func<XmlDocProvider?> read)
            {
                var root = read();
                var envelope = root is null ? null : PreparedGeneratedDocumentationEnvelope.TryCapture(root);
                if (root is not null && envelope is null) { return false; }
                checks.Add(() => ReferenceEquals(read(), root) && (envelope?.IsCurrent ?? true));
                return true;
            }
            foreach (var owner in owners)
            {
                if (!CaptureFileWarnings(owner, checks)) { return false; }
                // The writer evaluates these getters even when XML text is disabled.
                // Inspect dispatch, never invoke a builder or write-policy override.
                if ((!owner.PreserveTypeXmlDocs && !DefaultEmissionMethod(owner, "get_ShouldWriteTypeXmlDocs")) ||
                    !DefaultEmissionMethod(owner, "BuildDeclaringTypeProvider")) { return false; }
                var root = owner.CachedXmlDocs;
                if (root is null)
                {
                    if (!DefaultEmissionMethod(owner, "BuildXmlDocs") || !DefaultEmissionMethod(owner, "BuildDescription")) { return false; }
                    if (!_sourceDisableXmlDocs)
                    {
                        XmlDocProvider? observed = null;
                        PreparedGeneratedDocumentationEnvelope? envelope = null;
                        checks.Add(() =>
                        {
                            var current = owner.CachedXmlDocs;
                            if (current is null) { return observed is null; }
                            // Observe only canonical materialization of the audited
                            // default empty-doc builder; never cause that materialization.
                            if (observed is null)
                            {
                                observed = current;
                                envelope = PreparedGeneratedDocumentationEnvelope.TryCapture(current);
                            }
                            return ReferenceEquals(current, observed) && envelope?.IsCurrent == true;
                        });
                    }
                }
                else if (!_sourceDisableXmlDocs && !CaptureKnown(() => owner.CachedXmlDocs)) { return false; }
                if (_sourceDisableXmlDocs) { continue; }
                if (!ContractCollections.TryCopy(owner.CachedMethods, out var methods) ||
                    !ContractCollections.TryCopy(owner.CachedConstructors, out var constructors) ||
                    !ContractCollections.TryCopy(owner.CachedFields, out var fields) ||
                    !ContractCollections.TryCopy(owner.CachedProperties, out var properties)) { return false; }
                foreach (var method in methods) { if (!CaptureKnown(() => method.XmlDocs)) { return false; } }
                foreach (var constructor in constructors) { if (!CaptureKnown(() => constructor.XmlDocs)) { return false; } }
                foreach (var field in fields) { if (!CaptureKnown(() => field.XmlDocs)) { return false; } }
                foreach (var property in properties) { if (!CaptureKnown(() => property.XmlDocs)) { return false; } }
            }
            _callEmissionChecks = checks.ToImmutable();
            return true;
        }

        private static bool DefaultEmissionMethod(TypeProvider owner, string name) =>
            owner.GetType().GetMethod(name, BindingFlags.NonPublic | BindingFlags.Instance, null, Type.EmptyTypes, null)?.DeclaringType == typeof(TypeProvider);

        private static bool GeneratedNameIsUncontested(CSharpCompilation compilation, string ns, string name)
        {
            foreach (var assembly in compilation.SourceModule.ReferencedAssemblySymbols.Prepend(compilation.Assembly))
            {
                INamespaceSymbol? scope = assembly.GlobalNamespace;
                foreach (var part in ns.Split('.'))
                {
                    if (scope.GetTypeMembers(part).Length != 0) { return false; }
                    scope = scope.GetNamespaceMembers().SingleOrDefault(n => n.Name == part);
                    if (scope is null) { break; }
                }
                if (scope is not null && (scope.GetTypeMembers(name).Length != 0 || scope.GetNamespaceMembers().Any(n => n.Name == name))) { return false; }
            }
            return true;
        }

        private bool CallEnvironmentIsCurrent()
        {
            ObserveSourceSnapshot();
            if (_sourceDisposed || _sourceFiles.Values.Any(f => f.IsInvalid) || _callLookupScopes.Any(s => !s.IsCurrent()))
            {
                InvalidateSourceFiles();
                return false;
            }
            if (_callEmissionInvalid || !_callEmissionKnown || _callEmissionChecks.Any(check => !check()))
            {
                // Call-only invalidation: emission confinement is not a new
                // global veto on independent field/literal preparation or consumption.
                _callEmissionInvalid = true;
                return false;
            }
            return true;
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

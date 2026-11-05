// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.SourceInput;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal sealed partial class PreparedFieldTypes
    {
        /// <summary>
        /// Finite file/edge-owned namespace deletion permission, NOT attachment,
        /// public admission, a writer receipt or commit authority. Its consumer
        /// MUST be the exact standard TypeProviderWriter, at its owned source
        /// cursor, passing its actual live namespace-import set and actual
        /// generated-file parse options. Successful consumption MUST register
        /// this used permission with the session before body commit is possible.
        /// No caller-supplied 'standard writer' boolean can discharge this.
        /// </summary>
        internal sealed class PreparedTypeOfNamespacePermission
        {
            private readonly PreparedFieldTypes _session;
            private readonly PreparedTypeOfFiniteEmissionShape _shape;
            private readonly PreparedTypeOfNamespaceLookupFacts _lookup;
            private readonly PreparedSourceObservations _graph;
            private readonly PreparedSourceObservations.PreparedOccurrenceObservations _observed;
            private readonly IReadOnlySet<string> _actualImports;
            private readonly CSharpParseOptions _parseOptions;
            private readonly CSharpCompilation _compilation;
            private readonly CompleteSourceInputSnapshot? _inputs;
            private readonly SourceInputModel? _sourceModel;
            private readonly string? _sourceOutputDirectory;
            private readonly SourceOccurrenceId _id;
            private readonly object _producer;
            private readonly Guid _generation;
            private int _stale;

            internal PreparedSourceFile File => _lookup.File;
            internal PreparedSourceOccurrence Occurrence => _lookup.Occurrence;
            internal SourceOccurrenceId OccurrenceId => _id;
            internal string SimpleSpelling { get; }
            internal string QualifiedSpelling { get; }
            internal INamedTypeSymbol CanonicalCompilerMetadataTarget => _lookup.MetadataTarget;
            internal ImmutableHashSet<string> ForbiddenImports => _lookup.ForbiddenImports;
            internal ImmutableHashSet<string> PlannedNamespaceImports => _shape.KnownNamespaceImports;

            private PreparedTypeOfNamespacePermission(PreparedFieldTypes session, PreparedTypeOfFiniteEmissionShape shape,
                PreparedTypeOfNamespaceLookupFacts lookup, PreparedSourceObservations graph,
                PreparedSourceObservations.PreparedOccurrenceObservations observed, IReadOnlySet<string> actualImports,
                CSharpParseOptions parseOptions, CSharpCompilation compilation)
            {
                _session = session; _shape = shape; _lookup = lookup; _graph = graph; _observed = observed;
                _actualImports = actualImports; _parseOptions = parseOptions; _compilation = compilation;
                _inputs = session._sourceInputs; _sourceModel = session._sourceModel; _sourceOutputDirectory = session._sourceOutputDirectory;
                _id = lookup.Occurrence.Id; _producer = lookup.Occurrence.Producer; _generation = session._sourceGeneration;
                SimpleSpelling = lookup.SimpleSpelling; QualifiedSpelling = lookup.QualifiedSpelling;
            }

            // Internal Create fixtures can exercise this predicate without public
            // admission. Do not initialize _valid/roots or attach providers here.
            internal static PreparedTypeOfNamespacePermission? TryCapture(PreparedFieldTypes session,
                PreparedSourceFile file, PreparedSourceOccurrence leaf, CSharpParseOptions generatedParseOptions,
                IReadOnlySet<string> actualNamespaceImports)
            {
                if (session._sourceDisposed || session._sourceRootList is null || session._sourceFiles.Count != 1 ||
                    session._sourceRootSnapshot.Length != 1 || !ReferenceEquals(session._sourceRootSnapshot[0], file.FileOwner) ||
                    !session._sourceFiles.TryGetValue(file.FileOwner, out var ownedFile) || !ReferenceEquals(ownedFile, file) ||
                    file.Compilation is not CSharpCompilation compilation ||
                    actualNamespaceImports.GetType() != typeof(HashSet<string>) ||
                    !FiniteCompilerPolicy(compilation, generatedParseOptions)) { return null; }

                // Whole header/docs/body/config/import capture precedes the first
                // currentness or input/environment callback in this producer.
                // Above checks only inspect immutable or scalar owned inputs.
                var shape = PreparedTypeOfFiniteEmissionShape.TryCapture(file, session._sourceRootList, compilation, leaf);
                // Only membership is frozen: occurrence identity, opacity and
                // children are immutable. Live producer/currentness checks remain.
                var ownsLeaf = shape is not null && OwnsLeaf(shape, leaf);
                if (shape is null || !ownsLeaf || file.Generation != session._sourceGeneration ||
                    leaf.Id.Generation != file.Generation || leaf.Id.File != file.FilePath ||
                    !(ReferenceEquals(leaf.Producer, shape.Operand) || ReferenceEquals(leaf.Producer, shape.Declaration))) { return null; }

                // Actual session-owned single-owner universe, not a caller's
                // incomplete name index or a synthetic field.
                var ownerType = file.FileOwner.CachedType!;
                var generated = new Dictionary<(string Namespace, string Name), TypeProvider[]>
                { [(ownerType.Namespace, ownerType.Name)] = [file.FileOwner] };
                var prefixes = new HashSet<string>(StringComparer.Ordinal);
                var ns = ownerType.Namespace;
                while (ns.Length != 0)
                {
                    prefixes.Add(ns);
                    var dot = ns.LastIndexOf('.');
                    ns = dot < 0 ? string.Empty : ns[..dot];
                }
                var lookup = TryCaptureTypeOfNamespaceLookupFacts(file, leaf, compilation, generated, prefixes);
                if (lookup is null || ownerType.Name == lookup.SimpleSpelling || !FixedDeletion(lookup) ||
                    lookup.OperandType.Namespace != ownerType.Namespace && !shape.KnownNamespaceImports.Contains(lookup.OperandType.Namespace) ||
                    lookup.ForbiddenImports.Overlaps(shape.KnownNamespaceImports) ||
                    !ImportsAllowed(actualNamespaceImports, shape.KnownNamespaceImports, lookup.ForbiddenImports) ||
                    file.Observations is not { } graph ||
                    graph.GetCurrent(leaf) is not { } observed || !AbsentAtExactEdge(shape, observed, leaf)) { return null; }
                var result = new PreparedTypeOfNamespacePermission(session, shape, lookup, graph, observed,
                    actualNamespaceImports, generatedParseOptions, compilation);
                return result.IsCurrent ? result : null;
            }

            internal bool IsCurrent
            {
                get
                {
                    if (System.Threading.Volatile.Read(ref _stale) != 0) { return false; }
                    var current = _shape.IsCurrent &&
                        !_session._sourceDisposed && _session._sourceGeneration == _generation && File.Generation == _generation &&
                        _session._sourceFiles.Count == 1 &&
                        _session._sourceFiles.TryGetValue(File.FileOwner, out var file) && ReferenceEquals(file, File) &&
                        _session._sourceRootSnapshot.Length == 1 && ReferenceEquals(_session._sourceRootSnapshot[0], File.FileOwner) &&
                        ReferenceEquals(File.Compilation, _compilation) &&
                        // Compilation, options and parse options are immutable; the
                        // policy and native symbol lookup were completed at capture.

                        ReferenceEquals(_session._sourceInputs, _inputs) && ReferenceEquals(_session._sourceModel, _sourceModel) &&
                        _session._sourceOutputDirectory == _sourceOutputDirectory &&
                        (_inputs is null || ReferenceEquals(_inputs.Compilation, _compilation) &&
                            ReferenceEquals(_inputs.ParseOptions, _parseOptions) && _sourceModel is not null &&
                            ReferenceEquals(_sourceModel.PreEmissionSourceInputs, _inputs) && _sourceOutputDirectory is not null &&
                            _inputs.IsCurrentFor(_sourceOutputDirectory)) &&
                        _session.CallEnvironmentIsCurrent() &&
                        ReferenceEquals(Occurrence.Id, _id) && ReferenceEquals(Occurrence.Producer, _producer) &&
                        _id.Generation == _generation && _id.File == File.FilePath &&
                        ReferenceEquals(File.FileOwner.CachedType, _lookup.OwnerType) &&
                        _lookup.OwnerType.IdentityVersion == _lookup.OwnerTypeVersion &&
                        ReferenceEquals(NamespaceSiteType(_producer), _lookup.OperandType) &&
                        _lookup.OperandType.IdentityVersion == _lookup.OperandTypeVersion &&
                        ReferenceEquals(_lookup.OperandType.FrameworkType, _lookup.RuntimeType) && FixedDeletion(_lookup) &&

                        !ForbiddenImports.Overlaps(PlannedNamespaceImports) &&
                        ImportsAllowed(_actualImports, PlannedNamespaceImports, ForbiddenImports) &&
                        ReferenceEquals(File.Observations, _graph) && _graph.IsCurrent &&
                        ReferenceEquals(_graph.GetCurrent(Occurrence), _observed) && AbsentAtExactEdge(_shape, _observed, Occurrence);
                    if (!current) { System.Threading.Interlocked.Exchange(ref _stale, 1); }
                    return current;
                }
            }

            private static bool AbsentAtExactEdge(PreparedTypeOfFiniteEmissionShape shape,
                PreparedSourceObservations.PreparedOccurrenceObservations observed, PreparedSourceOccurrence site) =>
                observed.IsCurrent && observed.Occurrence == site.Id &&
                (ReferenceEquals(site.Producer, shape.Declaration) ||
                    observed.DirectKnowledge == PreparedSourceObservations.PreparedDirectCaptureKnowledge.Known) &&
                observed.OwnCaptures.IsEmpty && observed.EnclosingCaptures.IsEmpty &&
                observed.OwnBarriers.All(shape.IsKnownDefaultBarrier) && observed.EnclosingBarriers.All(shape.IsKnownDefaultBarrier);

            // FixedDeletion proves zero newline/header/import delta for this
            // namespace-only operation. It preserves caller-line values even
            // when their original absolute line is unknown. No line sites or
            // ancestor capture/barrier facts are removed from the shared graph.

            private static bool OwnsLeaf(PreparedTypeOfFiniteEmissionShape shape, PreparedSourceOccurrence leaf)
            {
                // The whole audited grammar is native calls/literals/typeof, no
                // binders. Exact expression-root membership supplies parent
                // transparency; shared producers retain distinct edge IDs.
                var pending = new Stack<PreparedSourceOccurrence>();
                pending.Push(shape.ExpressionRoot);
                var seen = new HashSet<PreparedSourceOccurrence>(ReferenceEqualityComparer.Instance);
                while (pending.Count != 0)
                {
                    var node = pending.Pop();
                    if (!seen.Add(node) || seen.Count > 256 || node.IsOpaque) { return false; }
                    if (ReferenceEquals(node, leaf))
                    { return ReferenceEquals(node.Producer, shape.Declaration) || ReferenceEquals(node.Producer, shape.Operand) && node.Children.IsEmpty; }
                    foreach (var child in node.Children) { pending.Push(child); }
                }
                return false;
            }

            private static bool ImportsAllowed(IReadOnlySet<string> actual, ImmutableHashSet<string> planned, ImmutableHashSet<string> forbidden) =>
                // Real imports can be a prefix/subset during emission. Native
                // formatting witnesses the target import. Unexpected late
                // imports invalidate even if not among known competitors.
                actual.All(ns => planned.Contains(ns) && !forbidden.Contains(ns));

            private static bool FixedDeletion(PreparedTypeOfNamespaceLookupFacts lookup) =>
                // Exact closed nonnullable nongeneric top-level metadata tokens.
                // Deleted ASCII prefix has NO newline/trivia/directives. Native
                // formatting has no line-wrapping path. With SAME header/imports/
                // fixed grammar, line count/mapping/visibility/inactive regions
                // and implicit CallerLine values are unchanged.
                (ReferenceEquals(lookup.RuntimeType, typeof(Exception)) && lookup.SimpleSpelling == "Exception" ||
                 ReferenceEquals(lookup.RuntimeType, typeof(Uri)) && lookup.SimpleSpelling == "Uri") &&
                lookup.OperandType.Namespace == "System" && lookup.OperandType.Name == lookup.SimpleSpelling &&
                lookup.QualifiedSpelling == "global::System." + lookup.SimpleSpelling;

            private static bool FiniteCompilerPolicy(CSharpCompilation compilation, CSharpParseOptions generated)
            {
                // Task02 compares ID/severity/message for ALL compiler diagnostics,
                // ignoring ONLY default UNSUPPRESSED Hidden CS8019. No other
                // Hidden or suppressed diagnostics disappear. This is a local
                // equivalence proof, not a production filter or generic
                // SourcePolicyFacts-known flag for other families.
                // Fixed #nullable disable is legal; license is //-prefixed and
                // docs confined. No #line/#pragma/#if/#error, raw parser input or
                // hidden mapping. SAME native type in type-only context means
                // same selected calls/conversions/attributes/other diagnostics.
                // Normal import usage is the only compiler difference.
                var options = compilation.Options;
                var objectBase = compilation.GetSpecialType(SpecialType.System_Object);
                return generated.GetType() == typeof(CSharpParseOptions) && generated.Kind == SourceCodeKind.Regular &&
                    generated.LanguageVersion >= LanguageVersion.CSharp8 && !generated.Features.Any() &&
                    options.SyntaxTreeOptionsProvider is null && options.GeneralDiagnosticOption == ReportDiagnostic.Default &&
                    options.SpecificDiagnosticOptions.All(pair => pair.Value == ReportDiagnostic.Default) &&
                    !options.ReportSuppressedDiagnostics &&
                    compilation.SyntaxTrees.All(t => t.Options is CSharpParseOptions { Kind: SourceCodeKind.Regular }) &&
                    // No explicit base is allowed. Discharge inherited TYPE
                    // lookup through implicit native Object, not value members.
                    objectBase.TypeKind == TypeKind.Class && !objectBase.HasUnsupportedMetadata && objectBase.BaseType is null &&
                    objectBase.ContainingType is null && objectBase.Arity == 0 && objectBase.GetTypeMembers().IsEmpty &&
                    objectBase.DeclaringSyntaxReferences.IsEmpty && objectBase.Locations.All(l => l.IsInMetadata) &&
                    SymbolEqualityComparer.Default.Equals(objectBase, compilation.GetTypeByMetadataName(typeof(object).FullName!)) &&
                    string.Equals(objectBase.ContainingAssembly.Identity.ToString(), typeof(object).Assembly.FullName, StringComparison.Ordinal);
            }
        }
    }
}

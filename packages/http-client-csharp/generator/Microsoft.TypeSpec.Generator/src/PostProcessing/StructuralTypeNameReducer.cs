// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator
{
    // Compilation-wide immutable/thread-safe facts. Stateful traversal and lookup
    // caches belong to a separate rewriter for EACH document.
    internal sealed class StructuralTypeNameReducer
    {
        private sealed record Target(INamedTypeSymbol Symbol, string[] Parts);
        private readonly Compilation _compilation;
        private readonly ProviderConditionalSyntax _conditional;
        private readonly ConcurrentDictionary<string, Target?> _targets = new(StringComparer.Ordinal);
        private readonly ConcurrentDictionary<ISymbol, bool> _thisMemberEligibility = new(SymbolEqualityComparer.IncludeNullability);
        private readonly ConcurrentDictionary<INamedTypeSymbol, bool> _attributeEligibility = new(SymbolEqualityComparer.Default);
        private readonly ConcurrentDictionary<ITypeSymbol, bool> _optionalDefaultTypes = new(SymbolEqualityComparer.IncludeNullability);
        private readonly ConcurrentDictionary<INamedTypeSymbol, HashSet<string>> _primaryConstructorParameters = new(SymbolEqualityComparer.Default);
        private readonly ConcurrentDictionary<IMethodSymbol, bool> _capturesCallerSource = new(SymbolEqualityComparer.Default);
        private readonly Lazy<bool> _crefImportEnvironment;
        private readonly Lazy<Compilation> _crefDiagnosticCompilation;
        private readonly ConcurrentDictionary<SyntaxTree, Lazy<bool>> _crefOriginalDiagnostics = new();
        private readonly ConcurrentDictionary<SyntaxTree, Lazy<bool>> _crefSourcePolicies = new();

        internal StructuralTypeNameReducer(Compilation compilation)
        {
            _compilation = compilation;
            _conditional = new ProviderConditionalSyntax(compilation);
            _crefImportEnvironment = new Lazy<bool>(() => StructuralCrefImportRules.SupportsCompilation(compilation));
            _crefDiagnosticCompilation = new Lazy<Compilation>(() => StructuralCrefImportRules.OriginalDiagnosticCompilation(compilation));
        }

        internal MemberRemoverRewriter? CreateRewriter(SyntaxNode root, IReadOnlyList<TypeReferenceSite> references)
        {
            // Reuse the existing compilation-wide header/configuration contract.
            // Conditional documents additionally prove body/header eligibility and
            // reject generic local-function scope changes in every supported parse.
            // Only active original syntax is visited; disabled text is untouched.
            if (root.ContainsDiagnostics || !_conditional.IsTypeOnlyDocument(root)) return null;
            // Provenance is unique across roles, not just within a selected role.
            var uniqueSites = references.GroupBy(static site => site.Span).Where(static group => group.Count() == 1)
                .Select(static group => group.Single()).ToArray();
            var sites = uniqueSites.Where(static site => site.Role == TypeReferenceRole.Code).ToDictionary(static site => site.Span);
            var crefSites = uniqueSites.Where(static site => site.Role == TypeReferenceRole.WholeTypeCref).ToDictionary(static site => site.Span);
            var canProveCallSource = _conditional.IsUnconditionalDocument(root);
            // Syntax-only expression cleanup does not require type-writer metadata.
            // No recorded sites still means no namespace/static name reductions.
            return sites.Count == 0 && !canProveCallSource && !_conditional.TryGetRoots(root, out _) ? null :
                new Rewriter(this, root.SyntaxTree, sites, canProveCallSource, crefSites);
        }

        private Target? Resolve(CSharpType type)
        {
            for (var current = type; current != null; current = current.DeclaringType)
                if (current != type && current.Arguments.Count != 0 || current.IsArray || current.IsFrameworkType && current.FrameworkType.IsGenericParameter) return null;
            // ClrMetadataName contains the declaring-type chain, not its namespace.
            // This is a canonical metadata lookup, never emitted-source rewriting.
            var metadata = type.Namespace.Length == 0 ? type.ClrMetadataName : type.Namespace + "." + type.ClrMetadataName;
            return _targets.GetOrAdd(metadata, name =>
            {
                var symbol = _compilation.GetTypeByMetadataName(name);
                if (symbol == null || symbol.TypeKind == TypeKind.Error) return null;
                var parts = new Stack<string>();
                for (var current = symbol; current != null; current = current.ContainingType)
                {
                    if (current.Arity != 0 && !SymbolEqualityComparer.Default.Equals(current, symbol)) return null;
                    parts.Push(current.Name);
                }
                for (var ns = symbol.ContainingNamespace; !ns.IsGlobalNamespace; ns = ns.ContainingNamespace) parts.Push(ns.Name);
                return new Target(symbol, parts.ToArray());
            });
        }

        private sealed class Region
        {
            internal readonly StructuralTypeNameSelector.LookupFacts Facts;
            internal readonly Dictionary<INamedTypeSymbol, NameSyntax?> Decisions = new(SymbolEqualityComparer.Default);
            internal Dictionary<INamedTypeSymbol, StructuralTypeNameSelector.NamePlan?>? QualifierChoices;
            internal Region(SemanticModel model, int position) => Facts = new(model, position);
        }

        private sealed class Rewriter : MemberRemoverRewriter
        {
            private readonly StructuralTypeNameReducer _owner;
            private readonly SyntaxTree _tree;
            private readonly IReadOnlyDictionary<TextSpan, TypeReferenceSite> _sites;
            private readonly IReadOnlyDictionary<TextSpan, TypeReferenceSite> _crefSites;
            private readonly Dictionary<SyntaxNode, Region> _regions = new();
            private readonly bool _canProveCallSource;
            private readonly List<SyntaxNode> _calls = new();
            private readonly Dictionary<SyntaxNode, SourceObservation> _callFacts = new();
            private readonly Dictionary<BaseMethodDeclarationSyntax, bool> _conditionalStaticUnits = new();
            private SyntaxNode? _scope;
            private bool _insideAttribute;
            private bool _insideSourceObservableExpression;
            private bool _insideParenthesesExcludedContext;
            private readonly Dictionary<ArgumentListSyntax, bool> _relationalArguments = new();
            private readonly List<ArgumentListSyntax> _parenthesesArgumentLists = new();
            private SyntaxNode[]? _conditionalParenthesesRoots;
            private readonly List<ExpressionSyntax> _thisValueContexts = new();
            private readonly Dictionary<ExpressionSyntax, bool> _dynamicThisContexts = new();
            private readonly Dictionary<TypeDeclarationSyntax, INamedTypeSymbol?> _thisContainingTypes = new();
            private bool _insideThisExcludedContext;
            private SemanticModel? _model;

            internal Rewriter(StructuralTypeNameReducer owner, SyntaxTree tree, IReadOnlyDictionary<TextSpan, TypeReferenceSite> sites,
                bool canProveCallSource, IReadOnlyDictionary<TextSpan, TypeReferenceSite> crefSites) : base(crefSites.Count != 0)
            {
                _owner = owner; _tree = tree; _sites = sites; _canProveCallSource = canProveCallSource; _crefSites = crefSites;
            }

            public override SyntaxTrivia VisitTrivia(SyntaxTrivia trivia) => trivia.HasStructure &&
                trivia.GetStructure() is not DocumentationCommentTriviaSyntax ? trivia : base.VisitTrivia(trivia);

            private sealed record SourceObservation(bool Unknown, TextSpan[] Captured)
            {
                internal static readonly SourceObservation Retain = new(true, Array.Empty<TextSpan>());
                internal static readonly SourceObservation Unobserved = new(false, Array.Empty<TextSpan>());
            }

            public override SyntaxNode? Visit(SyntaxNode? node)
            {
                if (node == null) return null;
                // Whole-cref proof owns this context. Never send unsupported or
                // unrecorded member-cref children through ordinary code-name rules.
                if (node is CrefSyntax cref) return TryReduceWholeTypeCref(cref) ?? cref;
                var previous = _scope;
                var previousAttribute = _insideAttribute;
                var previousSourceObservableExpression = _insideSourceObservableExpression;
                var previousParenthesesExcludedContext = _insideParenthesesExcludedContext;
                var previousCallDepth = _calls.Count;
                var previousArgumentDepth = _parenthesesArgumentLists.Count;
                var previousValueDepth = _thisValueContexts.Count;
                var previousThisExcludedContext = _insideThisExcludedContext;
                if (node is TypeDeclarationSyntax or BaseMethodDeclarationSyntax or LocalFunctionStatementSyntax or DelegateDeclarationSyntax or
                    BaseListSyntax or TypeParameterConstraintClauseSyntax or ExplicitInterfaceSpecifierSyntax) _scope = node;
                if (node is AttributeSyntax) _insideAttribute = true;
                if (node is ParameterSyntax or ConstructorInitializerSyntax ||
                    node is EqualsValueClauseSyntax initializer && (initializer.Parent is PropertyDeclarationSyntax ||
                        initializer.Parent?.Parent?.Parent is BaseFieldDeclarationSyntax) ||
                    node is BaseMethodDeclarationSyntax methodDeclaration && methodDeclaration.Modifiers.Any(SyntaxKind.StaticKeyword) ||
                    node is LocalFunctionStatementSyntax localDeclaration && localDeclaration.Modifiers.Any(SyntaxKind.StaticKeyword) ||
                    node is PropertyDeclarationSyntax propertyDeclaration && propertyDeclaration.Modifiers.Any(SyntaxKind.StaticKeyword))
                    _insideThisExcludedContext = true;
                if (node is BinaryExpressionSyntax or AssignmentExpressionSyntax or PrefixUnaryExpressionSyntax or PostfixUnaryExpressionSyntax or
                    CastExpressionSyntax or ConditionalExpressionSyntax or AwaitExpressionSyntax)
                    _thisValueContexts.Add((ExpressionSyntax)node);
                if (node is ParameterSyntax or PatternSyntax or QueryExpressionSyntax or WhenClauseSyntax ||
                    node is ArgumentSyntax argumentContext && !argumentContext.RefKindKeyword.IsKind(SyntaxKind.None))
                    _insideParenthesesExcludedContext = true;
                if (node is ArgumentListSyntax argumentList) _parenthesesArgumentLists.Add(argumentList);
                // Keep hidden-call/conditional contexts conservative. Ordinary call
                // source is checked lazily once per ORIGINAL call, before name caches.
                if (node is ConditionalAccessExpressionSyntax or ElementAccessExpressionSyntax or InitializerExpressionSyntax or
                    InterpolatedStringExpressionSyntax or CollectionExpressionSyntax) _insideSourceObservableExpression = true;
                if (!_insideAttribute && !_insideSourceObservableExpression)
                {
                    SyntaxNode? call = node as InvocationExpressionSyntax;
                    if (node is ArgumentSyntax argument)
                    {
                        call = argument.Parent is ArgumentListSyntax list && list.Parent is InvocationExpressionSyntax or
                            ObjectCreationExpressionSyntax or ImplicitObjectCreationExpressionSyntax or ConstructorInitializerSyntax ? list.Parent : null;
                        if (call == null) _insideSourceObservableExpression = true;
                    }
                    if (call != null)
                    {
                        // A receiver-local's type can vary across framework branches
                        // even when headers/type lookup remain invariant. Original-
                        // configuration call facts alone cannot prove that case.
                        if (!_canProveCallSource) _insideSourceObservableExpression = true;
                        else if (_calls.Count == 0 || !ReferenceEquals(_calls[^1], call)) _calls.Add(call);
                    }
                }
                try
                {
                    if (node is CastExpressionSyntax sdkCast && sdkCast.Expression is ThisExpressionSyntax)
                    {
                        // This occurrence owns the complete constructed type. Keep
                        // ordinary cast children under their existing exclusions,
                        // and prove the final cast after its single child visit.
                        var visited = (CastExpressionSyntax)base.Visit(node)!;
                        return TryReduceSdkCastType(sdkCast, visited) ?? visited;
                    }
                    if (node is DefaultExpressionSyntax optionalDefault)
                    {
                        // Decide whole-expression erasure before visiting children.
                        // A new import veto must retain original source, not expose
                        // child rewrites that C5 discarded when erasing this operand.
                        var replacement = TryReduceOptionalDefault(optionalDefault, out var retainOriginal);
                        return replacement ?? (retainOriginal ? optionalDefault : base.Visit(node));
                    }
                    if (node is AttributeSyntax attribute)
                    {
                        // Arguments remain under the existing attribute exclusion.
                        // Only the complete original attribute's name may change.
                        var visited = (AttributeSyntax)base.Visit(node)!;
                        return TryReduceAttributeName(attribute) ?? visited;
                    }
                    if (!_insideAttribute && !_insideSourceObservableExpression && node is NameSyntax name && _scope != null &&
                        _sites.TryGetValue(ReferenceSpan(name), out var site) && IsTypeOnlyContext(name))
                    {
                        // Namespace selection preserves the current terminal subtree.
                        // Visit arguments first in this SAME traversal; retention must
                        // not discard independently proven child changes.
                        if (Terminal(name) is GenericNameSyntax)
                        {
                            var visited = (NameSyntax)base.Visit(node)!;
                            return TryReduce(name, site, visited)?.WithTriviaFrom(name) ?? visited;
                        }
                        var rewritten = TryReduce(name, site);
                        if (rewritten != null) return rewritten.WithTriviaFrom(name);
                    }
                    if (!_insideAttribute && _scope != null &&
                        node is NameSyntax or MemberAccessExpressionSyntax && node.Parent is MemberAccessExpressionSyntax member &&
                        member.IsKind(SyntaxKind.SimpleMemberAccessExpression) && member.Expression == node &&
                        _sites.TryGetValue(ReferenceSpan(node), out var receiverSite) &&
                        (_canProveCallSource && !_insideSourceObservableExpression ||
                            !_canProveCallSource && CanProveConditionalStaticReceiver((ExpressionSyntax)node, member, receiverSite)))
                    {
                        var visited = (ExpressionSyntax)base.Visit(node)!;
                        return TryReduceStaticReceiver((ExpressionSyntax)node, member, receiverSite, visited, conditionalSource: !_canProveCallSource)?.WithTriviaFrom(node) ?? visited;
                    }
                    if (!_insideAttribute && !_insideSourceObservableExpression && !_insideThisExcludedContext && _canProveCallSource && _scope != null &&
                        node is MemberAccessExpressionSyntax { Expression: ThisExpressionSyntax, Name: IdentifierNameSyntax } thisMember &&
                        thisMember.IsKind(SyntaxKind.SimpleMemberAccessExpression))
                    {
                        var visited = (MemberAccessExpressionSyntax)base.Visit(node)!;
                        return (ExpressionSyntax?)TryReduceThisMember(thisMember, (IdentifierNameSyntax)visited.Name) ?? visited;
                    }
                    return base.Visit(node);
                }
                finally
                {
                    _scope = previous;
                    _insideAttribute = previousAttribute;
                    _insideSourceObservableExpression = previousSourceObservableExpression;
                    _insideParenthesesExcludedContext = previousParenthesesExcludedContext;
                    if (_calls.Count > previousCallDepth) _calls.RemoveRange(previousCallDepth, _calls.Count - previousCallDepth);
                    if (_parenthesesArgumentLists.Count > previousArgumentDepth)
                        _parenthesesArgumentLists.RemoveRange(previousArgumentDepth, _parenthesesArgumentLists.Count - previousArgumentDepth);
                    if (_thisValueContexts.Count > previousValueDepth) _thisValueContexts.RemoveRange(previousValueDepth, _thisValueContexts.Count - previousValueDepth);
                    _insideThisExcludedContext = previousThisExcludedContext;
                }
            }

            public override SyntaxNode? VisitParenthesizedExpression(ParenthesizedExpressionSyntax node)
            {
                if (_scope == null || _insideAttribute || _insideSourceObservableExpression || _insideParenthesesExcludedContext ||
                    HasRelationalArgumentContext()) return base.VisitParenthesizedExpression(node);

                var chain = new List<ParenthesizedExpressionSyntax>();
                ExpressionSyntax payload = node;
                while (payload is ParenthesizedExpressionSyntax wrapper)
                {
                    chain.Add(wrapper);
                    payload = wrapper.Expression;
                }
                // Direct chains are one operation. Never independently remove an
                // inner barrier and leave ((f))(1) serialized as the cast-like (f)(1).
                var visited = (ExpressionSyntax)Visit(payload)!;
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralParentheses.Attempt", TimeSpan.Zero, 0);
                var supported = StructuralParenthesesRules.SupportsTrivia(node) && chain.All(static wrapper =>
                    !wrapper.OpenParenToken.IsMissing && !wrapper.CloseParenToken.IsMissing) &&
                    StructuralParenthesesRules.CanRemove(node, visited);
                if (supported && !_canProveCallSource) supported = CanRemoveConditionalParentheses(node, visited);
                if (supported)
                {
                    // New cast-payload admission requires visible ORIGINAL
                    // delimiters. Keep pre-existing non-cast policies unchanged.
                    foreach (var wrapper in chain)
                        if (visited is CastExpressionSyntax &&
                            (_tree.GetLineVisibility(wrapper.OpenParenToken.SpanStart) != LineVisibility.Visible ||
                                _tree.GetLineVisibility(wrapper.CloseParenToken.SpanStart) != LineVisibility.Visible) ||
                            !AllowsSourceChange(wrapper.OpenParenToken.Span) || !AllowsSourceChange(wrapper.CloseParenToken.Span))
                        {
                            supported = false;
                            break;
                        }
                }
                if (supported)
                {
                    var replacement = StructuralParenthesesRules.Remove(chain, visited);
                    if (StructuralParenthesesRules.KeepsTokenBoundaries(node, replacement))
                    {
                        GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralParentheses.Removed", TimeSpan.Zero, 0);
                        return replacement;
                    }
                }
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralParentheses.Retained", TimeSpan.Zero, 0);
                ExpressionSyntax retained = visited;
                for (var index = chain.Count - 1; index >= 0; index--) retained = chain[index].WithExpression(retained);
                return retained;
            }

            private bool CanRemoveConditionalParentheses(ParenthesizedExpressionSyntax original, ExpressionSyntax payload)
            {
                // These parses prove source correspondence and grammar, NOT value
                // bindings. Conditional call/static/this permissions remain opaque.
                // CreateRewriter already required IsTypeOnlyDocument, including its
                // generic-local-function veto; TryGetRoots alone is not that proof.
                if (_conditionalParenthesesRoots == null && !_owner._conditional.TryGetRoots(_tree.GetRoot(), out _conditionalParenthesesRoots)) return false;
                if (original.Parent == null) return false;
                var role = original.Parent.ChildNodes().TakeWhile(child => child != original).Count();
                foreach (var root in _conditionalParenthesesRoots!)
                {
                    GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralParentheses.ConfigurationCheck", TimeSpan.Zero, 0);
                    if (root.FindNode(original.Span, getInnermostNodeForTie: true) is not ParenthesizedExpressionSyntax candidate ||
                        candidate.Span != original.Span || !SyntaxFactory.AreEquivalent(original, candidate) || candidate.Parent == null ||
                        candidate.Parent.RawKind != original.Parent.RawKind || candidate.Parent.Span != original.Parent.Span ||
                        candidate.Parent.ChildNodes().TakeWhile(child => child != candidate).Count() != role) return false;
                    // Empty original call frames are NOT evidence of source safety:
                    // conditional calls intentionally have no observer frames. Check
                    // every variant's entire ancestry, including outside the span.
                    if (candidate.Ancestors().Any(static ancestor => ancestor is InvocationExpressionSyntax or ArgumentSyntax or
                        ObjectCreationExpressionSyntax or ImplicitObjectCreationExpressionSyntax or ConstructorInitializerSyntax or
                        AttributeSyntax or ConditionalAccessExpressionSyntax or ElementAccessExpressionSyntax or InitializerExpressionSyntax or
                        InterpolatedStringExpressionSyntax or CollectionExpressionSyntax or ParameterSyntax or PatternSyntax or
                        QueryExpressionSyntax or WhenClauseSyntax)) return false;
                    if (!StructuralParenthesesRules.SupportsTrivia(candidate) || !StructuralParenthesesRules.CanRemove(candidate, payload)) return false;
                    var chain = new List<ParenthesizedExpressionSyntax>();
                    ExpressionSyntax current = candidate;
                    while (current is ParenthesizedExpressionSyntax wrapper)
                    {
                        if (wrapper.OpenParenToken.IsMissing || wrapper.CloseParenToken.IsMissing ||
                            root.SyntaxTree.GetLineVisibility(wrapper.OpenParenToken.SpanStart) != LineVisibility.Visible ||
                            root.SyntaxTree.GetLineVisibility(wrapper.CloseParenToken.SpanStart) != LineVisibility.Visible) return false;
                        chain.Add(wrapper);
                        current = wrapper.Expression;
                    }
                    // Use the variant's wrappers/neighbouring tokens, and the FINAL
                    // visited original payload. Only original-tree output is emitted.
                    var replacement = StructuralParenthesesRules.Remove(chain, payload);
                    if (!StructuralParenthesesRules.KeepsTokenBoundaries(candidate, replacement)) return false;
                }
                return true;
            }

            private CastExpressionSyntax? TryReduceSdkCastType(CastExpressionSyntax original, CastExpressionSyntax visited)
            {
                // Initial SDK-shaped slice: an instance cast used as a retained,
                // parenthesized receiver, not arbitrary cast/expression grammar.
                if (_insideAttribute || _scope == null || _insideThisExcludedContext ||
                    original.Type is not QualifiedNameSyntax { Right: GenericNameSyntax generic } name ||
                    generic.TypeArgumentList.Arguments.Count != 1 || generic.TypeArgumentList.Arguments[0] is not NameSyntax argument ||
                    original.Parent is not ParenthesizedExpressionSyntax wrapper || wrapper.Expression != original ||
                    wrapper.Parent is not MemberAccessExpressionSyntax member || member.Expression != wrapper ||
                    member.Name is not IdentifierNameSyntax || member.Parent is not InvocationExpressionSyntax invocation || invocation.Expression != member ||
                    original.Ancestors().Any(static n => n is LocalFunctionStatementSyntax or AnonymousFunctionExpressionSyntax) ||
                    original.Ancestors().OfType<MethodDeclarationSyntax>().FirstOrDefault() is not { } method ||
                    method.Modifiers.Any(SyntaxKind.StaticKeyword) || ConditionalStaticReceiverRules.HasHardSourceContext(original) ||
                    visited.Expression.ToFullString() != original.Expression.ToFullString() ||
                    !_sites.TryGetValue(ReferenceSpan(name), out var headSite)) return null;
                if (!_canProveCallSource && !CanProveConditionalStaticReceiver(wrapper, member, headSite)) return null;
                if (_tree.GetLineVisibility(headSite.Span.Start) != LineVisibility.Visible ||
                    _tree.GetLineVisibility(headSite.Span.End - 1) != LineVisibility.Visible ||
                    !AllowsConditionalStaticSourceChange(original, headSite.Span)) return null;
                _model ??= _owner._compilation.GetSemanticModel(_tree);
                if (_model.GetTypeInfo(name).Type is not INamedTypeSymbol { TypeKind: TypeKind.Interface, Arity: 1, ContainingType: null } construction ||
                    construction.TypeArguments[0] is not INamedTypeSymbol { TypeKind: TypeKind.Class, Arity: 0, ContainingType: null } modelType ||
                    !HasUsableTypeGraph(construction) || _owner.Resolve(headSite.Type) is not { } target ||
                    !SymbolEqualityComparer.Default.Equals(target.Symbol, construction.OriginalDefinition) ||
                    DescribeRecordedReference(name, target) is not { } source ||
                    _model.GetOperation(original) is not IConversionOperation conversion || !conversion.Conversion.Exists ||
                    !conversion.Conversion.IsReference || conversion.OperatorMethod != null ||
                    _model.GetSymbolInfo(invocation) is not { CandidateReason: CandidateReason.None, Symbol: IMethodSymbol callee } ||
                    callee.IsStatic || callee.MethodKind != MethodKind.Ordinary || callee.ReducedFrom != null ||
                    !SymbolEqualityComparer.IncludeNullability.Equals(callee.ContainingType, construction) ||
                    !HasCastParameterImportWitness(method, construction.ContainingNamespace)) return null;

                NameSyntax selectedArgument = argument;
                // The self-model name is found in its own containing type scope,
                // not through an import. A foreign model needs a separate import
                // certificate; retain its argument while still allowing HEAD-only
                // reduction under the independent parameter witness above.
                if (_model.GetDeclaredSymbol(method) is IMethodSymbol ownerMethod &&
                    SymbolEqualityComparer.Default.Equals(ownerMethod.ContainingType, modelType) &&
                    _sites.TryGetValue(ReferenceSpan(argument), out var argumentSite) &&
                    _owner.Resolve(argumentSite.Type) is { } argumentTarget &&
                    SymbolEqualityComparer.IncludeNullability.Equals(argumentTarget.Symbol, modelType) &&
                    DescribeRecordedReference(argument, argumentTarget) is { } argumentSource &&
                    _tree.GetLineVisibility(argumentSite.Span.Start) == LineVisibility.Visible &&
                    _tree.GetLineVisibility(argumentSite.Span.End - 1) == LineVisibility.Visible &&
                    AllowsConditionalStaticSourceChange(original, argumentSite.Span))
                {
                    var context = new StructuralTypeNameSelector.Context(_owner._compilation, _model, argument, modelType,
                        KnownDeclarationType: true, Source: argumentSource, ModeOverride: StructuralTypeNameSelector.Mode.Type);
                    StructuralTypeNameSelector.Choose(new[] { context }, plan =>
                    {
                        if (plan.Render(argumentSource) is not IdentifierNameSyntax candidate ||
                            candidate.Identifier.ValueText != modelType.Name || ExpressionReceiverSyntaxFacts.ExposesContextualRoot(candidate) ||
                            _model.GetSpeculativeAliasInfo(argument.SpanStart, SyntaxFactory.IdentifierName(candidate.Identifier), SpeculativeBindingOption.BindAsTypeOrNamespace) != null) return false;
                        selectedArgument = candidate.WithTriviaFrom(argument);
                        return true;
                    });
                }
                // Compose the actual candidate, including its preserved/new model
                // argument, before whole-type speculation and parser admission.
                var parts = (SimpleNameSyntax[])source.Parts.Clone();
                parts[^1] = ((GenericNameSyntax)parts[^1]).WithTypeArgumentList(generic.TypeArgumentList.WithArguments(
                    SyntaxFactory.SingletonSeparatedList<TypeSyntax>(selectedArgument)));
                source = source with { Parts = parts };
                var headContext = new StructuralTypeNameSelector.Context(_owner._compilation, _model, name, construction,
                    KnownDeclarationType: true, Source: source, PreserveTerminalArguments: true, ModeOverride: StructuralTypeNameSelector.Mode.Type);
                CastExpressionSyntax? replacement = null;
                StructuralTypeNameSelector.Choose(new[] { headContext }, plan =>
                {
                    // Bare generic heads only; namespace/type aliases and broader
                    // cast operand/parent roles are not part of this certificate.
                    if (plan.Render(source) is not GenericNameSyntax candidate || candidate.Identifier.ValueText != construction.Name ||
                        ExpressionReceiverSyntaxFacts.ExposesContextualRoot(candidate) || _tree.Options is not CSharpParseOptions options) return false;
                    var detached = SyntaxFactory.ParseTypeName(candidate.ToString(), options: options);
                    if (detached.ContainsDiagnostics) return false;
                    var rebound = _model.GetSpeculativeSymbolInfo(name.SpanStart, detached, SpeculativeBindingOption.BindAsTypeOrNamespace);
                    if (rebound.CandidateReason != CandidateReason.None || rebound.CandidateSymbols.Length != 0 ||
                        !SymbolEqualityComparer.IncludeNullability.Equals(construction, rebound.Symbol)) return false;
                    var cast = visited.WithType(detached.WithTriviaFrom(visited.Type));
                    var parsedCast = SyntaxFactory.ParseExpression(cast.ToString(), options: options, consumeFullText: true);
                    if (parsedCast.ContainsDiagnostics || parsedCast is not CastExpressionSyntax || !SyntaxFactory.AreEquivalent(cast, parsedCast)) return false;
                    var receiver = member.WithExpression(wrapper.WithExpression(cast));
                    var parsedReceiver = SyntaxFactory.ParseExpression(receiver.ToString(), options: options, consumeFullText: true);
                    if (parsedReceiver.ContainsDiagnostics || !SyntaxFactory.AreEquivalent(receiver, parsedReceiver)) return false;
                    replacement = cast;
                    return true;
                });
                return replacement;
            }

            private bool HasCastParameterImportWitness(MethodDeclarationSyntax method, INamespaceSymbol targetNamespace)
            {
                // A cast cannot newly activate an otherwise-unused import. A bare
                // parameter already witnesses it, or this parameter's existing C9
                // type-only rule independently proves its surviving bare spelling.
                // This is an occurrence proof, not a cached choice or hypothetical
                // rewrite of a source-observed expression.
                var model = _model ??= _owner._compilation.GetSemanticModel(_tree);
                foreach (var parameter in method.ParameterList.Parameters)
                {
                    if (parameter.Type is not NameSyntax name ||
                        model.GetTypeInfo(name).Type is not INamedTypeSymbol { Arity: 0, ContainingType: null } type ||
                        !SymbolEqualityComparer.Default.Equals(type.ContainingNamespace, targetNamespace)) continue;
                    if (name is IdentifierNameSyntax bare && bare.Identifier.ValueText == type.Name && model.GetAliasInfo(bare) == null) return true;
                    if (!_sites.TryGetValue(ReferenceSpan(name), out var site) || !IsTypeOnlyContext(name) ||
                        _owner.Resolve(site.Type) is not { } target || !SymbolEqualityComparer.IncludeNullability.Equals(type, target.Symbol) ||
                        DescribeRecordedReference(name, target) is not { } source) continue;
                    var context = new StructuralTypeNameSelector.Context(_owner._compilation, model, name, type,
                        KnownDeclarationType: true, Source: source, ModeOverride: StructuralTypeNameSelector.Mode.Type);
                    var selected = StructuralTypeNameSelector.Choose(new[] { context });
                    if (selected.Plan?.Render(source) is IdentifierNameSyntax identifier && identifier.Identifier.ValueText == type.Name &&
                        model.GetSpeculativeAliasInfo(name.SpanStart, SyntaxFactory.IdentifierName(identifier.Identifier), SpeculativeBindingOption.BindAsTypeOrNamespace) == null) return true;
                }
                return false;
            }

            private ExpressionSyntax? TryReduceOptionalDefault(DefaultExpressionSyntax expression, out bool retainOriginal)
            {
                retainOriginal = false;
                if (!_canProveCallSource || _scope == null || _insideAttribute || _insideSourceObservableExpression ||
                    _tree.Options is not CSharpParseOptions options || options.LanguageVersion < LanguageVersion.CSharp7_1 ||
                    expression.Parent is not EqualsValueClauseSyntax clause || clause.Value != expression ||
                    clause.Parent is not ParameterSyntax parameter || parameter.Default != clause ||
                    parameter.Parent is not ParameterListSyntax list || list.Parent is not
                        (MethodDeclarationSyntax or ConstructorDeclarationSyntax or DelegateDeclarationSyntax or LocalFunctionStatementSyntax) ||
                    expression.ContainsDiagnostics || expression.ContainsDirectives) return null;
                var lines = _tree.GetLineSpan(expression.Span);
                if (lines.StartLinePosition.Line != lines.EndLinePosition.Line || _tree.GetLineVisibility(expression.SpanStart) != LineVisibility.Visible ||
                    expression.DescendantTrivia().Any(trivia => trivia.Span.End > expression.SpanStart && trivia.SpanStart < expression.Span.End &&
                        !trivia.IsKind(SyntaxKind.WhitespaceTrivia) && !trivia.IsKind(SyntaxKind.EndOfLineTrivia)) ||
                    !AllowsSourceChange(expression.Span)) return null;
                _model ??= _owner._compilation.GetSemanticModel(_tree);
                if (_model.GetDeclaredSymbol(parameter) is not IParameterSymbol symbol || !symbol.IsOptional || !symbol.HasExplicitDefaultValue ||
                    symbol.RefKind != RefKind.None || symbol.IsParams || symbol.IsThis || symbol.ContainingSymbol is not IMethodSymbol method ||
                    method.MethodKind is not (MethodKind.Ordinary or MethodKind.Constructor or MethodKind.DelegateInvoke or MethodKind.LocalFunction)) return null;
                var operand = _model.GetTypeInfo(expression.Type).Type;
                // The declaration supplies the target type. This is Roslyn's
                // exact-declared-type fast path, never its overload-sensitive fallback.
                // Null metadata values are valid for some struct/generic defaults.
                if (operand == null || !SymbolEqualityComparer.IncludeNullability.Equals(symbol.Type, operand) ||
                    !_owner._optionalDefaultTypes.GetOrAdd(symbol.Type, SupportsOptionalDefaultType)) return null;
                // Neither original diagnostic absence nor a reduction elsewhere
                // proves a final surviving import use. Erase only import-independent
                // type syntax, or prove this parameter's identical declaration is an
                // unchanged witness. This also covers newly withheld handler uses.
                var canEraseType = StructuralCrefImportRules.CanEraseTypeWithoutImportUse(expression.Type, _model) ||
                    HasSurvivingParameterTypeImportWitness(parameter, expression.Type);
                if (canEraseType) GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralOptionalDefaults.Attempt", TimeSpan.Zero, 0);
                var replacement = SyntaxFactory.LiteralExpression(SyntaxKind.DefaultLiteralExpression,
                    SyntaxFactory.Token(SyntaxKind.DefaultKeyword)).WithTriviaFrom(expression);
                static bool Separator(SyntaxTriviaList trivia) => trivia.Any(static item => item.FullSpan.Length != 0 &&
                    item.Kind() is SyntaxKind.WhitespaceTrivia or SyntaxKind.EndOfLineTrivia or SyntaxKind.SingleLineCommentTrivia or SyntaxKind.MultiLineCommentTrivia);
                var previous = expression.GetFirstToken().GetPreviousToken();
                var next = expression.GetLastToken().GetNextToken();
                if (!Separator(previous.TrailingTrivia) && !Separator(replacement.GetLeadingTrivia()) &&
                    !ParenthesesSyntaxFacts.TokensStaySeparate(previous, replacement.GetFirstToken()) ||
                    !Separator(replacement.GetTrailingTrivia()) && !Separator(next.LeadingTrivia) &&
                    !ParenthesesSyntaxFacts.TokensStaySeparate(replacement.GetLastToken(), next)) return null;
                if (!canEraseType)
                {
                    // Every original C5 eligibility check passed. Only this new
                    // veto freezes the subtree; originally ineligible expressions
                    // still receive their independently supported child rewrites.
                    retainOriginal = true;
                    return null;
                }
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralOptionalDefaults.Accepted", TimeSpan.Zero, 0);
                return replacement;
            }

            private bool HasSurvivingParameterTypeImportWitness(ParameterSyntax parameter, TypeSyntax erasedType)
            {
                if (parameter.Type is not { } declaration || !SyntaxFactory.AreEquivalent(declaration, erasedType) ||
                    declaration.ToString() != erasedType.ToString()) return false;
                // The exact declared/operand symbols and annotations were already
                // checked. In this parameter context only recorded code-name sites
                // can rewrite declaration type tokens; do not assume the original
                // spelling survives when any such occurrence can be visited.
                return _sites.Count == 0 || !declaration.DescendantNodesAndSelf().OfType<NameSyntax>()
                    .Any(name => _sites.ContainsKey(ReferenceSpan(name)));
            }

            private static bool SupportsOptionalDefaultType(ITypeSymbol type)
            {
                var seen = new HashSet<ITypeSymbol>(SymbolEqualityComparer.IncludeNullability);
                bool VisitType(ITypeSymbol current)
                {
                    if (!seen.Add(current)) return true;
                    return current switch
                    {
                        IErrorTypeSymbol or IDynamicTypeSymbol or IPointerTypeSymbol or IFunctionPointerTypeSymbol => false,
                        INamedTypeSymbol named => named.SpecialType != SpecialType.System_Void && !named.IsUnboundGenericType && !named.IsRefLikeType &&
                            (named.ContainingType == null || VisitType(named.ContainingType)) && named.TypeArguments.All(VisitType),
                        IArrayTypeSymbol array => VisitType(array.ElementType),
                        ITypeParameterSymbol parameter => parameter.ConstraintTypes.All(VisitType),
                        _ => false
                    };
                }
                return VisitType(type);
            }

            private AttributeSyntax? TryReduceAttributeName(AttributeSyntax attribute)
            {
                var name = attribute.Name;
                if (!_canProveCallSource || _scope == null || _insideSourceObservableExpression || attribute.ContainsDiagnostics || attribute.ContainsDirectives ||
                    !_sites.TryGetValue(name.Span, out var site) || site.Type.IsArray || site.Type.IsNullable) return null;
                var lines = _tree.GetLineSpan(name.Span);
                if (lines.StartLinePosition.Line != lines.EndLinePosition.Line || _tree.GetLineVisibility(name.SpanStart) != LineVisibility.Visible ||
                    !AllowsSourceChange(name.Span)) return null;
                var target = _owner.Resolve(site.Type);
                if (target == null) return null;
                for (var type = target.Symbol; type != null; type = type.ContainingType) if (type.Arity != 0) return null;
                if (!_owner._attributeEligibility.GetOrAdd(target.Symbol, type =>
                {
                    if (type.TypeKind != TypeKind.Class || type.IsAbstract || !HasUsableTypeGraph(type)) return false;
                    var baseType = _owner._compilation.GetTypeByMetadataName("System.Attribute");
                    if (baseType == null) return false;
                    for (var current = type.BaseType; current != null; current = current.BaseType)
                        if (SymbolEqualityComparer.Default.Equals(current, baseType)) return true;
                    return false;
                })) return null;
                var source = DescribeRecordedReference(name, target);
                if (source == null || source.Parts.Any(static part => part is not IdentifierNameSyntax)) return null;
                _model ??= _owner._compilation.GetSemanticModel(_tree);
                var original = _model.GetSymbolInfo(attribute);
                if (original.CandidateReason != CandidateReason.None || original.CandidateSymbols.Length != 0 ||
                    original.Symbol is not IMethodSymbol { MethodKind: MethodKind.Constructor, IsStatic: false } constructor ||
                    !SymbolEqualityComparer.IncludeNullability.Equals(constructor.ContainingType, target.Symbol)) return null;
                var operation = _model.GetOperation(attribute);
                if (!StructuralAttributeRules.SameContract(operation, operation)) return null;
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralAttributes.Attempt", TimeSpan.Zero, 0);
                AttributeSyntax? replacement = null;
                var facts = new StructuralTypeNameSelector.LookupFacts(_model, name.SpanStart);
                var context = new StructuralTypeNameSelector.Context(_owner._compilation, _model, name, constructor.ContainingType,
                    SharedFacts: facts, KnownDeclarationType: true, Source: source, PreserveTerminalArguments: true,
                    ModeOverride: StructuralTypeNameSelector.Mode.Type);
                StructuralTypeNameSelector.Choose(new[] { context }, plan =>
                {
                    var qualified = plan.Render(source);
                    if (qualified == null) return false;
                    bool Accept(NameSyntax candidateName)
                    {
                        if (candidateName.ToString() == name.ToString()) return false;
                        var parsedName = StructuralAttributeRules.RoundTripName(candidateName, (CSharpParseOptions)_tree.Options);
                        if (parsedName == null) return false;
                        var candidate = SyntaxFactory.Attribute(parsedName.WithTriviaFrom(name), attribute.ArgumentList).WithTriviaFrom(attribute);
                        GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralAttributes.SpeculativeCheck", TimeSpan.Zero, 0);
                        if (!_model.TryGetSpeculativeSemanticModel(attribute.SpanStart, candidate, out var speculative) || speculative == null) return false;
                        var rebound = speculative.GetSymbolInfo(candidate);
                        if (rebound.CandidateReason != CandidateReason.None || rebound.CandidateSymbols.Length != 0 ||
                            !SymbolEqualityComparer.IncludeNullability.Equals(constructor, rebound.Symbol) ||
                            !StructuralAttributeRules.SameContract(operation, speculative.GetOperation(candidate)))
                        {
                            GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralAttributes.BindingRejected", TimeSpan.Zero, 0);
                            return false;
                        }
                        replacement = candidate;
                        return true;
                    }
                    var abbreviated = StructuralAttributeRules.WithoutSuffix(qualified);
                    return abbreviated != null && Accept(abbreviated) || Accept(qualified);
                });
                if (replacement != null) GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralAttributes.Accepted", TimeSpan.Zero, 0);
                return replacement;
            }

            private CrefSyntax? TryReduceWholeTypeCref(CrefSyntax cref)
            {
                if (!_canProveCallSource || _scope == null || _insideAttribute || _insideSourceObservableExpression ||
                    !_crefSites.TryGetValue(cref.Span, out var site) || site.Type.IsArray || site.Type.IsNullable ||
                    cref is not QualifiedCrefSyntax { Member: NameMemberCrefSyntax { Name: IdentifierNameSyntax, Parameters: null } } ||
                    cref.ContainsDiagnostics || cref.ContainsDirectives) return null;
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralCrefs.Attempt", TimeSpan.Zero, 0);
                var target = _owner.Resolve(site.Type);
                if (target == null) return null;
                for (var type = target.Symbol; type != null; type = type.ContainingType) if (type.Arity != 0) return null;
                var source = DescribeRecordedReference(cref, target);
                var lines = _tree.GetLineSpan(cref.Span);
                if (source == null || source.Parts.Any(static part => part is not IdentifierNameSyntax) ||
                    lines.StartLinePosition.Line != lines.EndLinePosition.Line || _tree.GetLineVisibility(cref.SpanStart) != LineVisibility.Visible ||
                    !AllowsSourceChange(cref.Span)) return null;
                _model ??= _owner._compilation.GetSemanticModel(_tree);
                var original = _model.GetSymbolInfo(cref);
                if (original.CandidateReason != CandidateReason.None || original.CandidateSymbols.Length != 0 ||
                    original.Symbol is not INamedTypeSymbol construction || !HasUsableTypeGraph(construction) ||
                    !SymbolEqualityComparer.IncludeNullability.Equals(construction, target.Symbol)) return null;
                // A shorter cref can consume a previously unused import while
                // preserving its symbol and emitted XML. Use original complete-tree
                // facts, shared once per tree, before selecting any new spelling.
                var importCertificate = HasCrefImportCertificate();
                // A top-level type directly in the attachment's immediate
                // namespace is found before namespace imports. This alternate
                // permission applies ONLY to its bare-name plan below.
                if (!importCertificate && !HasImmediateNamespaceCrefCertificate(cref, construction)) return null;
                CrefSyntax? replacement = null;
                var facts = new StructuralTypeNameSelector.LookupFacts(_model, cref.SpanStart);
                var context = new StructuralTypeNameSelector.Context(_owner._compilation, _model, cref, construction,
                    SharedFacts: facts, KnownDeclarationType: true, Source: source, PreserveTerminalArguments: true,
                    ModeOverride: StructuralTypeNameSelector.Mode.Cref);
                StructuralTypeNameSelector.Choose(new[] { context }, plan =>
                {
                    var name = plan.RenderCrefName(source);
                    if (name == null || name.ToString() == cref.ToString()) return false;
                    if (!importCertificate && (name is not IdentifierNameSyntax identifier ||
                        identifier.Identifier.ValueText != construction.Name)) return false;
                    // Parse only this prospective XML spelling. A forced TypeCref
                    // AST can select a type even when serialized bare T reparses as
                    // a NameMemberCref and resolves a same-named method instead.
                    var candidate = ParseWholeCref(name);
                    if (candidate == null) return false;
                    GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralCrefs.SpeculativeCheck", TimeSpan.Zero, 0);
                    var rebound = _model.GetSpeculativeSymbolInfo(cref.SpanStart, candidate, SpeculativeBindingOption.BindAsTypeOrNamespace);
                    if (rebound.CandidateReason != CandidateReason.None || rebound.CandidateSymbols.Length != 0 ||
                        !SymbolEqualityComparer.IncludeNullability.Equals(construction, rebound.Symbol))
                    {
                        GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralCrefs.BindingRejected", TimeSpan.Zero, 0);
                        return false;
                    }
                    replacement = candidate.WithTriviaFrom(cref);
                    return true;
                });
                if (replacement != null) GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralCrefs.Accepted", TimeSpan.Zero, 0);
                return replacement;
            }

            private bool HasImmediateNamespaceCrefCertificate(CrefSyntax cref, INamedTypeSymbol target)
            {
                if (target.ContainingType != null || !_owner._crefImportEnvironment.Value ||
                    !_owner._crefSourcePolicies.GetOrAdd(_tree,
                        tree => new Lazy<bool>(() => StructuralCrefImportRules.SupportsOriginalTreeSourcePolicy(tree))).Value)
                    return false;
                var documentation = cref.Ancestors().OfType<DocumentationCommentTriviaSyntax>().FirstOrDefault();
                if (documentation == null) return false;
                var token = documentation.ParentTrivia.Token;
                if (!token.LeadingTrivia.Contains(documentation.ParentTrivia)) return false;
                var declaration = token.Parent?.AncestorsAndSelf().OfType<MemberDeclarationSyntax>().FirstOrDefault();
                // In particular, documentation attached to a namespace is not
                // documentation inside that namespace. Keep uncertain owners out.
                if (declaration is not TypeDeclarationSyntax and not BaseMethodDeclarationSyntax and
                    not BasePropertyDeclarationSyntax and not BaseFieldDeclarationSyntax) return false;
                var declared = _model!.GetDeclaredSymbol(declaration);
                if (declared == null) return false;
                var namespaceDeclaration = declaration.Ancestors().OfType<BaseNamespaceDeclarationSyntax>().FirstOrDefault();
                var immediateNamespace = namespaceDeclaration == null ? _owner._compilation.GlobalNamespace :
                    _model.GetDeclaredSymbol(namespaceDeclaration);
                return SymbolEqualityComparer.Default.Equals(immediateNamespace, target.ContainingNamespace) &&
                    SymbolEqualityComparer.Default.Equals(declared.ContainingNamespace, target.ContainingNamespace);
            }

            private bool HasCrefImportCertificate() => _owner._crefImportEnvironment.Value &&
                _owner._crefOriginalDiagnostics.GetOrAdd(_tree,
                    tree => new Lazy<bool>(() => StructuralCrefImportRules.HasSafeOriginalTreeDiagnostics(
                        _owner._crefDiagnosticCompilation.Value.GetSemanticModel(tree)))).Value;

            private CrefSyntax? ParseWholeCref(NameSyntax name)
            {
                var spelling = name.ToString();
                var options = ((CSharpParseOptions)_tree.Options).WithDocumentationMode(DocumentationMode.Diagnose);
                var parsed = SyntaxFactory.ParseCompilationUnit("/// <see cref=\"" + spelling + "\"/>\nclass __CrefProof__ {}", options: options);
                if (parsed.ContainsDiagnostics) return null;
                var attributes = parsed.DescendantNodes(descendIntoTrivia: true).OfType<XmlCrefAttributeSyntax>().ToArray();
                if (attributes.Length != 1 || attributes[0].Cref.ToString() != spelling) return null;
                // Reconstruct the COMPLETE root to detach it from synthetic XML;
                // token spelling and the actual parser-selected shape are retained.
                return attributes[0].Cref switch
                {
                    QualifiedCrefSyntax qualified => SyntaxFactory.QualifiedCref(qualified.Container, qualified.Member),
                    NameMemberCrefSyntax { Parameters: null } member => SyntaxFactory.NameMemberCref(member.Name),
                    TypeCrefSyntax type => SyntaxFactory.TypeCref(type.Type),
                    _ => null
                };
            }

            private bool HasRelationalArgumentContext()
            {
                // Only a candidate requests this whole-list fact; ordinary calls
                // without parentheses do not trigger a subtree scan. Preserve all
                // enclosing lists' sibling protection and memoize each original list.
                foreach (var list in _parenthesesArgumentLists)
                {
                    if (!_relationalArguments.TryGetValue(list, out var relational))
                    {
                        relational = list.DescendantNodes().Any(static child => child.IsKind(SyntaxKind.LessThanExpression) || child.IsKind(SyntaxKind.GreaterThanExpression));
                        _relationalArguments.Add(list, relational);
                        GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralParentheses.ArgumentListScan", TimeSpan.Zero, 0);
                    }
                    if (relational) return true;
                }
                return false;
            }

            private static SimpleNameSyntax Terminal(SyntaxNode name) => name switch
            {
                QualifiedNameSyntax qualified => qualified.Right,
                AliasQualifiedNameSyntax alias => alias.Name,
                SimpleNameSyntax simple => simple,
                MemberAccessExpressionSyntax member => member.Name,
                _ => throw new InvalidOperationException("Unsupported name shape")
            };

            // CodeWriter records the identifier prefix, before <arguments> or []/?.
            private static TextSpan ReferenceSpan(SyntaxNode name) => TextSpan.FromBounds(name.SpanStart, Terminal(name).Identifier.Span.End);

            private NameSyntax? TryReduce(NameSyntax node, TypeReferenceSite site, NameSyntax? visited = null)
            {
                var target = _owner.Resolve(site.Type);
                if (target == null) return null;
                var source = DescribeRecordedReference(node, target);
                if (source == null || !AllowsSourceChange(site.Span)) return null;
                if (!_regions.TryGetValue(_scope!, out var region))
                {
                    _model ??= _owner._compilation.GetSemanticModel(_tree);
                    region = new Region(_model, node.SpanStart);
                    _regions.Add(_scope!, region);
                    GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralTypeNames.Region", TimeSpan.Zero, 0);
                }
                if (target.Symbol.Arity > 0)
                {
                    // The recorded head proves the canonical definition. Original
                    // binding supplies the actual construction, including lexical
                    // type parameters and nullability; metadata arguments are not
                    // reconstructed or substituted into the emitted syntax.
                    if (_model!.GetSymbolInfo(node).Symbol is not INamedTypeSymbol construction || !HasUsableTypeGraph(construction) ||
                        !SymbolEqualityComparer.Default.Equals(construction.OriginalDefinition, target.Symbol)) return null;
                    var parts = (SimpleNameSyntax[])source.Parts.Clone();
                    parts[^1] = ((GenericNameSyntax)parts[^1]).WithTypeArgumentList(((GenericNameSyntax)Terminal(visited!)).TypeArgumentList);
                    source = source with { Parts = parts };
                    var choices = region.QualifierChoices ??= new(SymbolEqualityComparer.IncludeNullability);
                    if (choices.TryGetValue(construction, out var choice))
                    {
                        GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralTypeNames.CacheHit", TimeSpan.Zero, 0);
                        return choice?.Render(source);
                    }
                    var context = new StructuralTypeNameSelector.Context(_owner._compilation, _model!, node, construction,
                        region.Facts, KnownDeclarationType: true, Source: source, PreserveTerminalArguments: true);
                    var selection = StructuralTypeNameSelector.Choose(new[] { context });
                    choices.Add(construction, selection.Plan);
                    GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralTypeNames.Decision", TimeSpan.Zero, 0);
                    return selection.Plan?.Render(source);
                }
                if (region.Decisions.TryGetValue(target.Symbol, out var cached))
                {
                    GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralTypeNames.CacheHit", TimeSpan.Zero, 0);
                    return cached;
                }
                // Bind the first proven occurrence of a target in this region;
                // spelling alone is not its canonical compilation identity.
                var actual = _model!.GetSymbolInfo(node).Symbol;
                NameSyntax? replacement = null;
                if (SymbolEqualityComparer.Default.Equals(actual, target.Symbol))
                {
                    var context = new StructuralTypeNameSelector.Context(_owner._compilation, _model!, node, target.Symbol,
                        region.Facts, KnownDeclarationType: true, Source: source);
                    var selection = StructuralTypeNameSelector.Evaluate(new[] { context });
                    if (selection.Reason == StructuralTypeNameSelector.Retention.None && selection.Name is NameSyntax selected &&
                        !SyntaxFactory.AreEquivalent(node, selected, static _ => false))
                        replacement = selected.WithoutLeadingTrivia().WithoutTrailingTrivia();
                }
                region.Decisions.Add(target.Symbol, replacement);
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralTypeNames.Decision", TimeSpan.Zero, 0);
                return replacement;
            }

            private static StructuralTypeNameSelector.SourceName? DescribeRecordedReference(SyntaxNode node, Target target)
            {
                // Both callers restore this occurrence's complete outer trivia.
                // Canonical spelling/arity/trivia is proved before any choice/cache.
                var source = StructuralTypeNameSelector.Describe(node, preserveBoundaryComments: true);
                if (source.Diagnostics || source.Directives || source.SignificantTrivia || source.Root?.Parent is not AliasQualifiedNameSyntax alias ||
                    alias.Alias != source.Root || source.Root.Identifier.Text != SyntaxFacts.GetText(SyntaxKind.GlobalKeyword) ||
                    source.Parts.Length != target.Parts.Length) return null;
                for (var index = 0; index < source.Parts.Length; index++)
                {
                    var part = source.Parts[index];
                    var arity = part is GenericNameSyntax generic ? generic.TypeArgumentList.Arguments.Count : 0;
                    if (part.Identifier.ValueText != target.Parts[index] || arity != (index == source.Parts.Length - 1 ? target.Symbol.Arity : 0)) return null;
                }
                return source;
            }

            private bool CanProveConditionalStaticReceiver(ExpressionSyntax receiver, MemberAccessExpressionSyntax member, TypeReferenceSite site)
            {
                // CreateRewriter has already enforced compilation-wide headers,
                // type-only document admission and the generic-local-function veto.
                // This certificate adds value/call invariance, not other permissions.
                if (_canProveCallSource || ConditionalStaticReceiverRules.HasHardSourceContext(receiver)) return false;
                var unit = ConditionalStaticReceiverRules.OuterExecutableUnit(receiver);
                if (unit == null || !_owner._conditional.TryGetRoots(_tree.GetRoot(), out var roots)) return false;
                if (!_conditionalStaticUnits.TryGetValue(unit, out var invariant))
                {
                    invariant = roots.All(root => ConditionalStaticReceiverRules.SameUnit(unit,
                        root.FindNode(unit.Span, getInnermostNodeForTie: true)));
                    _conditionalStaticUnits.Add(unit, invariant);
                }
                if (!invariant) return false;
                // Never cache occurrence acceptance or infer it from a previous
                // visible/bindable receiver of the same type in this unit.
                return roots.All(root => ConditionalStaticReceiverRules.SameOccurrence(receiver, member, root, site.Span));
            }

            private bool AllowsConditionalStaticSourceChange(SyntaxNode receiver, TextSpan prefix)
            {
                var lines = _tree.GetLineSpan(prefix);
                if (lines.StartLinePosition.Line != lines.EndLinePosition.Line) return false;
                // The invariant OUTER unit and global header proof make original
                // call maps reusable. Walk past lambdas/local functions to every
                // original ancestor frame; an empty conditional _calls is not proof.
                foreach (var call in receiver.Ancestors().Where(static ancestor => ancestor is InvocationExpressionSyntax or
                    ObjectCreationExpressionSyntax or ImplicitObjectCreationExpressionSyntax or ConstructorInitializerSyntax))
                    if (HasSourceObservationConflict(call, prefix)) return false;
                return true;
            }

            private bool HasSourceObservationConflict(SyntaxNode call, TextSpan prefix)
            {
                if (!_callFacts.TryGetValue(call, out var facts))
                {
                    facts = ObserveCall(call);
                    _callFacts.Add(call, facts);
                }
                return facts.Unknown || facts.Captured.Any(span => span.IntersectsWith(prefix));
            }

            private ExpressionSyntax? TryReduceStaticReceiver(ExpressionSyntax receiver, MemberAccessExpressionSyntax member,
                TypeReferenceSite site, ExpressionSyntax visited, bool conditionalSource = false)
            {
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralStaticReceivers.Attempt", TimeSpan.Zero, 0);
                // A standalone field/property access has no call frame, but deleting
                // a newline could still alter a later CallerLineNumber argument.
                var lines = _tree.GetLineSpan(site.Span);
                var target = _owner.Resolve(site.Type);
                if (target == null)
                {
                    GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralStaticReceivers.MetadataRejected", TimeSpan.Zero, 0);
                    return null;
                }
                if (lines.StartLinePosition.Line != lines.EndLinePosition.Line) return null;
                var source = DescribeRecordedReference(receiver, target);
                if (source == null || !(conditionalSource ? AllowsConditionalStaticSourceChange(receiver, site.Span) : AllowsSourceChange(site.Span)))
                {
                    GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralStaticReceivers.SourceRejected", TimeSpan.Zero, 0);
                    return null;
                }
                _model ??= _owner._compilation.GetSemanticModel(_tree);
                var original = _model.GetSymbolInfo(receiver);
                if (original.CandidateReason != CandidateReason.None || original.CandidateSymbols.Length != 0 ||
                    original.Symbol is not INamedTypeSymbol construction || !HasUsableTypeGraph(construction) ||
                    !SymbolEqualityComparer.Default.Equals(construction.OriginalDefinition, target.Symbol))
                {
                    GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralStaticReceivers.OriginalRejected", TimeSpan.Zero, 0);
                    return null;
                }
                var accessed = _model.GetSymbolInfo(member);
                if (accessed.CandidateReason != CandidateReason.None || accessed.CandidateSymbols.Length != 0 ||
                    accessed.Symbol is not (IMethodSymbol or IFieldSymbol or IPropertySymbol or IEventSymbol) || !accessed.Symbol.IsStatic) return null;
                if (accessed.Symbol is IMethodSymbol method && method.MethodKind != MethodKind.Ordinary) return null;
                if (member.Parent is InvocationExpressionSyntax invocation && invocation.Expression == member)
                {
                    var called = _model.GetSymbolInfo(invocation);
                    if (called.CandidateReason != CandidateReason.None || called.CandidateSymbols.Length != 0 ||
                        called.Symbol is not IMethodSymbol { IsStatic: true, MethodKind: MethodKind.Ordinary } callee ||
                        !SymbolEqualityComparer.IncludeNullability.Equals(callee, accessed.Symbol)) return null;
                }
                if (ExpressionReceiverSyntaxFacts.MayExposeCastParse(receiver)) return null;

                // Expression lookup is position-sensitive even within one method.
                // Share requests across candidate attempts at THIS occurrence, never
                // consult or populate the declaration/type-only decision caches.
                var facts = new StructuralTypeNameSelector.LookupFacts(_model, receiver.SpanStart);
                var parts = (SimpleNameSyntax[])source.Parts.Clone();
                parts[^1] = Terminal(visited);
                source = source with { Parts = parts };
                var selection = StructuralTypeNameSelector.Choose(new[]
                {
                    new StructuralTypeNameSelector.Context(_owner._compilation, _model, receiver, construction, facts,
                        Source: source, PreserveTerminalArguments: true, ModeOverride: StructuralTypeNameSelector.Mode.Expression)
                });
                var replacement = selection.Plan?.RenderExpression(source);
                if (replacement == null || SyntaxFactory.AreEquivalent(receiver, replacement, static _ => false) ||
                    conditionalSource && !ConditionalStaticReceiverRules.KeepsTokenBoundaries(receiver, replacement))
                {
                    GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralStaticReceivers.LookupRejected", TimeSpan.Zero, 0);
                    return null;
                }
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralStaticReceivers.SpeculativeCheck", TimeSpan.Zero, 0);
                var rebound = _model.GetSpeculativeSymbolInfo(receiver.SpanStart, replacement, SpeculativeBindingOption.BindAsExpression);
                if (rebound.CandidateReason != CandidateReason.None || rebound.CandidateSymbols.Length != 0 ||
                    rebound.Symbol is not INamedTypeSymbol named || !SymbolEqualityComparer.IncludeNullability.Equals(named, construction))
                {
                    GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralStaticReceivers.SpeculativeRejected", TimeSpan.Zero, 0);
                    return null;
                }
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralStaticReceivers.Accepted", TimeSpan.Zero, 0);
                return replacement;
            }

            private IdentifierNameSyntax? TryReduceThisMember(MemberAccessExpressionSyntax member, IdentifierNameSyntax name)
            {
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralThisReceivers.Attempt", TimeSpan.Zero, 0);
                if (name.Identifier.IsMissing || name.Identifier.ValueText == "Object" || member.ContainsDiagnostics || member.ContainsDirectives) return null;
                // Parentheses do not change which data member is the invocation
                // target. Keep this deliberately excluded family uniformly, even
                // when enough wrappers would make the serialized spelling safe.
                SyntaxNode invocationTarget = member;
                while (invocationTarget.Parent is ParenthesizedExpressionSyntax wrapper) invocationTarget = wrapper;
                if (invocationTarget.Parent is InvocationExpressionSyntax invocation && invocation.Expression == invocationTarget) return null;
                // Keep removed-token ownership deliberately tight. Boundary comments
                // are restored from the complete original access; internal trivia is
                // not discarded or moved from this/dot onto an unrelated identifier.
                if (member.Expression.GetTrailingTrivia().Count != 0 || member.OperatorToken.LeadingTrivia.Count != 0 ||
                    member.OperatorToken.TrailingTrivia.Count != 0 || member.Name.GetLeadingTrivia().Count != 0) return null;
                var prefix = TextSpan.FromBounds(member.SpanStart, member.Name.SpanStart);
                var lines = _tree.GetLineSpan(prefix);
                if (lines.StartLinePosition.Line != lines.EndLinePosition.Line || _tree.GetLineVisibility(member.SpanStart) != LineVisibility.Visible ||
                    !AllowsSourceChange(prefix)) return null;
                if (ExpressionReceiverSyntaxFacts.ExposesContextualRoot(name) || ExpressionReceiverSyntaxFacts.MayExposeCastParse(member)) return null;
                _model ??= _owner._compilation.GetSemanticModel(_tree);
                var original = _model.GetSymbolInfo(member);
                if (original.CandidateReason != CandidateReason.None || original.CandidateSymbols.Length != 0 || original.Symbol == null ||
                    !_owner._thisMemberEligibility.GetOrAdd(original.Symbol, IsSupportedThisMember) || HasPrimaryConstructorShadowRisk(original.Symbol)) return null;
                var memberType = _model.GetTypeInfo(member);
                if (UnsafeThisType(memberType.Type) || UnsafeThisType(memberType.ConvertedType) || HasDynamicThisContext()) return null;
                // Never pass the attached original member.Name: Roslyn promotes
                // that node to this.Member via GetStandaloneExpression. Speculate
                // the actual detached replacement, otherwise shadows look unchanged.
                var replacement = SyntaxFactory.IdentifierName(name.Identifier).WithTriviaFrom(member);
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralThisReceivers.SpeculativeCheck", TimeSpan.Zero, 0);
                var rebound = _model.GetSpeculativeSymbolInfo(member.SpanStart, replacement, SpeculativeBindingOption.BindAsExpression);
                if (rebound.CandidateReason != CandidateReason.None || rebound.CandidateSymbols.Length != 0 ||
                    !SymbolEqualityComparer.IncludeNullability.Equals(original.Symbol, rebound.Symbol))
                {
                    GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralThisReceivers.BindingRejected", TimeSpan.Zero, 0);
                    return null;
                }
                if (!ParenthesesSyntaxFacts.TokensStaySeparate(member.GetFirstToken().GetPreviousToken(), replacement.GetFirstToken()) &&
                    !HasRealThisSeparator(member.GetFirstToken().GetPreviousToken().TrailingTrivia) && !HasRealThisSeparator(replacement.GetLeadingTrivia())) return null;
                GeneratedCodeWorkspace.PostProcessingProfile?.Add("StructuralThisReceivers.Accepted", TimeSpan.Zero, 0);
                return replacement;
            }

            private bool HasPrimaryConstructorShadowRisk(ISymbol member)
            {
                // Binding equality is insufficient for diagnostics: an unqualified
                // inherited member can newly emit CS9179. Speculation discards that
                // warning (and warnings-as-errors builds would reject the output).
                var declaration = _scope!.AncestorsAndSelf().OfType<TypeDeclarationSyntax>().FirstOrDefault();
                if (declaration == null) return true;
                if (!_thisContainingTypes.TryGetValue(declaration, out var containingType))
                {
                    containingType = _model!.GetDeclaredSymbol(declaration) as INamedTypeSymbol;
                    _thisContainingTypes.Add(declaration, containingType);
                }
                if (containingType == null) return true;
                if (SymbolEqualityComparer.Default.Equals(containingType.OriginalDefinition, member.ContainingType!.OriginalDefinition)) return false;
                // Only declaration metadata is shared; source scope, the selected
                // original member and the binding decision remain occurrence-owned.
                var parameters = _owner._primaryConstructorParameters.GetOrAdd(containingType.OriginalDefinition, static type =>
                    type.InstanceConstructors.Where(static constructor => constructor.DeclaringSyntaxReferences.Any(static syntax => syntax.GetSyntax() is TypeDeclarationSyntax))
                        .SelectMany(static constructor => constructor.Parameters).Select(static parameter => parameter.Name).ToHashSet(StringComparer.Ordinal));
                // Conservatively retain even if a base-initializer use might
                // suppress the warning. Do not reproduce compiler capture analysis.
                return parameters.Contains(member.Name);
            }

            private static bool HasRealThisSeparator(SyntaxTriviaList trivia) => trivia.Any(static item => item.FullSpan.Length != 0);

            private static bool UnsafeThisType(ITypeSymbol? type) => type?.TypeKind is TypeKind.Dynamic or TypeKind.Error or TypeKind.Pointer or TypeKind.FunctionPointer;

            private static bool IsSupportedThisMember(ISymbol member)
            {
                if (member.IsStatic || member.ContainingType == null || !HasUsableTypeGraph(member.ContainingType)) return false;
                var type = member switch
                {
                    IFieldSymbol { IsFixedSizeBuffer: false } field => field.Type,
                    IPropertySymbol { IsIndexer: false } property when property.ExplicitInterfaceImplementations.Length == 0 => property.Type,
                    _ => null
                };
                return type != null && !UnsafeThisType(type) && HasUsableTypeGraph(type);
            }

            private bool HasDynamicThisContext()
            {
                foreach (var context in _thisValueContexts)
                {
                    if (!_dynamicThisContexts.TryGetValue(context, out var dynamic))
                    {
                        bool Unsafe(ExpressionSyntax expression)
                        {
                            var info = _model!.GetTypeInfo(expression);
                            return UnsafeThisType(info.Type) || UnsafeThisType(info.ConvertedType);
                        }
                        dynamic = Unsafe(context) || (context switch
                        {
                            BinaryExpressionSyntax binary => Unsafe(binary.Left) || Unsafe(binary.Right),
                            AssignmentExpressionSyntax assignment => Unsafe(assignment.Left) || Unsafe(assignment.Right),
                            PrefixUnaryExpressionSyntax unary => Unsafe(unary.Operand),
                            PostfixUnaryExpressionSyntax unary => Unsafe(unary.Operand),
                            CastExpressionSyntax cast => Unsafe(cast.Expression),
                            ConditionalExpressionSyntax conditional => Unsafe(conditional.Condition) || Unsafe(conditional.WhenTrue) || Unsafe(conditional.WhenFalse),
                            AwaitExpressionSyntax awaited => Unsafe(awaited.Expression),
                            _ => false
                        });
                        _dynamicThisContexts.Add(context, dynamic);
                    }
                    if (dynamic) return true;
                }
                return false;
            }

            private bool AllowsSourceChange(TextSpan prefix)
            {
                if (_calls.Count == 0) return true;
                // A newly admitted edit must not shift implicit CallerLineNumber
                // values, including values in later calls outside this expression.
                var lines = _tree.GetLineSpan(prefix);
                if (lines.StartLinePosition.Line != lines.EndLinePosition.Line) return false;
                foreach (var call in _calls)
                    if (HasSourceObservationConflict(call, prefix)) return false;
                return true;
            }

            private static bool IsCallerExpression(AttributeData attribute) =>
                attribute.AttributeClass?.Name == "CallerArgumentExpressionAttribute" &&
                attribute.AttributeClass.ContainingNamespace.ToDisplayString() == "System.Runtime.CompilerServices";

            private SourceObservation ObserveCall(SyntaxNode call)
            {
                var syntaxArguments = call switch
                {
                    InvocationExpressionSyntax invocation => invocation.ArgumentList,
                    ObjectCreationExpressionSyntax creation => creation.ArgumentList,
                    ImplicitObjectCreationExpressionSyntax creation => creation.ArgumentList,
                    ConstructorInitializerSyntax initializer => initializer.ArgumentList,
                    _ => null
                };
                // A synthesized interpolated-handler constructor can capture the
                // source of a sibling argument even when the selected enclosing
                // method has no CallerArgumentExpression parameter. Keep this
                // original-call fact conservative, before the metadata fast path.
                // _callFacts shares the result, never occurrence acceptance.
                if (syntaxArguments != null && syntaxArguments.Arguments.Any(static argument =>
                    argument.DescendantNodesAndSelf().Any(static node => node is InterpolatedStringExpressionSyntax)))
                    return SourceObservation.Retain;
                _model ??= _owner._compilation.GetSemanticModel(_tree);
                var binding = _model.GetSymbolInfo(call);
                if (binding.CandidateReason != CandidateReason.None || binding.Symbol is not IMethodSymbol method ||
                    method.MethodKind is not (MethodKind.Ordinary or MethodKind.ReducedExtension or MethodKind.Constructor or MethodKind.DelegateInvoke)) return SourceObservation.Retain;
                var definition = (method.ReducedFrom ?? method).OriginalDefinition;
                if (!_owner._capturesCallerSource.GetOrAdd(definition, static target =>
                    target.Parameters.Any(static parameter => parameter.GetAttributes().Any(IsCallerExpression))))
                    return SourceObservation.Unobserved;

                // Metadata proves the common no-capture case without building an
                // operation tree. CAE-bearing calls need the actual parameter map.
                var operation = _model.GetOperation(call);
                var arguments = operation switch
                {
                    IInvocationOperation invocation => invocation.Arguments.ToArray(),
                    IObjectCreationOperation creation => creation.Arguments.ToArray(),
                    _ => null
                };
                if (arguments == null) return SourceObservation.Retain;
                var captured = new List<TextSpan>();
                foreach (var supplied in arguments)
                {
                    // Extension receivers can be implicit EXPLICIT arguments.
                    // Only DefaultValue denotes an omitted capture-text argument.
                    if (supplied.ArgumentKind != ArgumentKind.DefaultValue || supplied.Parameter == null) continue;
                    foreach (var attribute in supplied.Parameter.GetAttributes().Where(IsCallerExpression))
                    {
                        if (attribute.ConstructorArguments.Length != 1 || attribute.ConstructorArguments[0].Value is not string name)
                            return SourceObservation.Retain;
                        var sources = arguments.Where(argument => argument.Parameter?.Name == name).ToArray();
                        if (sources.Length == 0) return SourceObservation.Retain;
                        foreach (var source in sources)
                        {
                            if (source.ArgumentKind != ArgumentKind.Explicit) return SourceObservation.Retain;
                            // Classic reduced extensions expose the original static
                            // signature: their 'this' source is argument.Value.Syntax.
                            var syntax = source.Parameter?.IsThis == true ? source.Value.Syntax : source.Syntax;
                            if (syntax.SyntaxTree != _tree) return SourceObservation.Retain;
                            captured.Add(syntax.Span);
                        }
                    }
                }
                return captured.Count == 0 ? SourceObservation.Unobserved : new SourceObservation(false, captured.ToArray());
            }

            private static bool HasUsableTypeGraph(ITypeSymbol type)
            {
                var visited = new HashSet<ITypeSymbol>(SymbolEqualityComparer.IncludeNullability);
                bool VisitType(ITypeSymbol current)
                {
                    if (!visited.Add(current)) return true;
                    return current switch
                    {
                        IErrorTypeSymbol => false,
                        INamedTypeSymbol named => !named.IsUnboundGenericType &&
                            (named.ContainingType == null || VisitType(named.ContainingType)) && named.TypeArguments.All(VisitType),
                        IArrayTypeSymbol array => VisitType(array.ElementType),
                        IPointerTypeSymbol pointer => VisitType(pointer.PointedAtType),
                        IFunctionPointerTypeSymbol => false,
                        _ => true
                    };
                }
                return VisitType(type);
            }

            private static bool IsTypeOnlyContext(NameSyntax name)
            {
                SyntaxNode type = name;
                while (true)
                {
                    switch (type.Parent)
                    {
                        case NullableTypeSyntax nullable when nullable.ElementType == type: type = nullable; continue;
                        case ArrayTypeSyntax array when array.ElementType == type: type = array; continue;
                        case PointerTypeSyntax pointer when pointer.ElementType == type: type = pointer; continue;
                        case RefTypeSyntax reference when reference.Type == type: type = reference; continue;
                        case ScopedTypeSyntax scoped when scoped.Type == type: type = scoped; continue;
                        case TupleElementSyntax element when element.Type == type && element.Parent is TupleTypeSyntax tuple: type = tuple; continue;
                        case FunctionPointerParameterSyntax parameter when parameter.Type == type &&
                            parameter.Parent?.Parent is FunctionPointerTypeSyntax function: type = function; continue;
                        case TypeArgumentListSyntax arguments when arguments.Parent is GenericNameSyntax generic:
                            type = generic; continue;
                        case QualifiedNameSyntax qualified when qualified.Right == type: type = qualified; continue;
                        case AliasQualifiedNameSyntax alias when alias.Name == type: type = alias; continue;
                    }
                    break;
                }
                // The compiler owns type-slot grammar. Our adapter supplies policy
                // only: normalize wrappers, then preserve exclusions that require
                // more than type lookup (parse/source/configuration proofs).
                if (type.Parent is CastExpressionSyntax { Expression: not ParenthesizedExpressionSyntax } or TypePatternSyntax or
                    CrefSyntax or CrefParameterSyntax or IncompleteMemberSyntax or RefValueExpressionSyntax or FromClauseSyntax or JoinClauseSyntax ||
                    type.Parent?.IsKind(SyntaxKind.IsExpression) == true) return false;
                if (type.Parent is QualifiedNameSyntax qualifiedParent && qualifiedParent.Left == type) return false;
                // Classify the original named node, not its complete wrapper:
                // GetStandaloneExpression promotes array/stackalloc wrappers to
                // their value expression. Outer normalization above is for policy.
                return SyntaxFacts.IsInTypeOnlyContext(name);
            }
        }
    }
}

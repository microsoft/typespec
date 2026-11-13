// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator
{
    // Local, opt-in namespace-reduction prototype. No per-document semantic model.
    internal sealed class ProviderNameReducer
    {
        internal static bool IsStructuralEnabled => string.Equals(Environment.GetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER"), "structural", StringComparison.OrdinalIgnoreCase);
        internal static bool IsEnabled => IsStructuralEnabled || string.Equals(Environment.GetEnvironmentVariable("TYPESPEC_PROVIDER_REDUCER"), "true", StringComparison.OrdinalIgnoreCase);

        private enum LookupKind { Type, StaticReceiver, Attribute, Cref }
        private readonly record struct Reduction(bool ShortenPrefix, bool OmitAttributeSuffix = false);

        private readonly Compilation _compilation;
        private readonly ProviderConditionalSyntax _conditional;
        private readonly ConcurrentDictionary<string, INamedTypeSymbol?> _types = new(StringComparer.Ordinal);
        private readonly ConcurrentDictionary<(string Namespace, string Name), ImmutableArray<ISymbol>> _namespaceMembers = new();
        private readonly List<UsingDirectiveSyntax> _globalUsings = new();

        internal ProviderNameReducer(Compilation compilation)
        {
            _compilation = compilation;
            _conditional = new ProviderConditionalSyntax(compilation);
            foreach (var tree in compilation.SyntaxTrees)
            {
                if (tree.GetRoot() is CompilationUnitSyntax root)
                {
                    _globalUsings.AddRange(root.Usings.Where(static u => !u.GlobalKeyword.IsKind(SyntaxKind.None)));
                }
            }
        }

        internal static bool TryMatchReferences(SyntaxNode root, IReadOnlyList<TypeReferenceSite> references, out SyntaxNode[] matches) =>
            TryMatchReferences(new[] { root }, references, out matches);

        private static SimpleNameSyntax? ReferenceName(SyntaxNode node) => node switch
        {
            QualifiedNameSyntax qualified => qualified.Right,
            AliasQualifiedNameSyntax alias => alias.Name,
            MemberAccessExpressionSyntax member => member.Name,
            QualifiedCrefSyntax { Member: NameMemberCrefSyntax { Name: SimpleNameSyntax name, Parameters: null } } => name,
            NameMemberCrefSyntax { Name: SimpleNameSyntax name, Parameters: null } => name,
            _ => null
        };

        private static bool TryMatchReferences(IReadOnlyList<SyntaxNode> roots, IReadOnlyList<TypeReferenceSite> references, out SyntaxNode[] matches)
        {
            matches = new SyntaxNode[references.Count];
            var sites = new Dictionary<TextSpan, int>();
            var text = roots[0].SyntaxTree.GetText();
            var documentation = references.Any(static site => site.Role == TypeReferenceRole.WholeTypeCref);
            for (var index = 0; index < references.Count; index++)
            {
                var site = references[index];
                if (!roots[0].FullSpan.Contains(site.Span) || !sites.TryAdd(site.Span, index) ||
                    text.ToString(site.Span) != "global::" + site.Type.FullyQualifiedName)
                {
                    return false;
                }
            }
            foreach (var root in roots)
            {
                var seen = new HashSet<int>();
                foreach (var node in root.DescendantNodes(descendIntoTrivia: documentation))
                {
                    var name = ReferenceName(node);
                    if (name == null || !sites.TryGetValue(TextSpan.FromBounds(node.SpanStart, name.Identifier.Span.End), out var index))
                    {
                        continue;
                    }

                    if ((node is CrefSyntax) != (references[index].Role == TypeReferenceRole.WholeTypeCref))
                    {
                        continue;
                    }

                    if (!seen.Add(index) || name.Arity != references[index].Type.Arguments.Count)
                    {
                        return false;
                    }

                    if (matches[index] != null && (matches[index].RawKind != node.RawKind || matches[index].Span != node.Span || matches[index].Parent?.RawKind != node.Parent?.RawKind))
                    {
                        return false;
                    }

                    matches[index] ??= node;
                }
                if (seen.Count != references.Count)
                {
                    var disabled = root.DescendantTrivia().Where(static t => t.IsKind(SyntaxKind.DisabledTextTrivia)).Select(static t => t.Span).ToArray();
                    for (var i = 0; i < references.Count; i++)
                    {
                        if (!seen.Contains(i) && !disabled.Any(span => span.Contains(references[i].Span)))
                        {
                            return false;
                        }
                    }
                }
            }
            return matches.All(static node => node != null);
        }

        internal static bool SupportsSyntax(SyntaxNode syntaxRoot, bool bodyConditionals = false)
        {
            if (syntaxRoot is not CompilationUnitSyntax root || root.ContainsDiagnostics || root.Externs.Count > 0 ||
                root.Members.Any(static m => m is GlobalStatementSyntax) ||
                root.DescendantNodes().Any(static n => n is InterfaceDeclarationSyntax) ||
                root.Usings.Any(static u => !u.StaticKeyword.IsKind(SyntaxKind.None)) ||
                (!bodyConditionals && ProviderConditionalSyntax.HasConditional(root)))
            {
                return false;
            }
            var namespaces = root.DescendantNodes().OfType<BaseNamespaceDeclarationSyntax>().ToArray();
            return namespaces.Length <= 1 && !namespaces.Any(static n => n.Usings.Count > 0 || n.Externs.Count > 0) &&
                !(namespaces.Length > 0 && root.Members.Any(static m => m is BaseTypeDeclarationSyntax or DelegateDeclarationSyntax));
        }

        internal bool TryPlan(SyntaxNode syntaxRoot, IReadOnlyList<TypeReferenceSite> references, out PrefixPlan? plan)
        {
            plan = null;
            if (!_conditional.TryGetRoots(syntaxRoot, out var roots) || roots.Any(root => !SupportsSyntax(root, bodyConditionals: roots.Length > 1)))
            {
                return false;
            }
            var root = (CompilationUnitSyntax)syntaxRoot;
            var namespaces = root.DescendantNodes().OfType<BaseNamespaceDeclarationSyntax>().ToArray();
            var importedNamespaces = new HashSet<string>(StringComparer.Ordinal);
            var blockedNames = new HashSet<string>(StringComparer.Ordinal);
            var usings = root.Usings.Concat(_globalUsings).ToArray();
            foreach (var import in usings)
            {
                if (!import.StaticKeyword.IsKind(SyntaxKind.None))
                {
                    return false;
                }
                if (import.Alias != null)
                {
                    blockedNames.Add(import.Alias.Name.Identifier.ValueText);
                    continue;
                }
                if (import.Name == null || !TryNamespaceName(import.Name, out var name))
                {
                    return false;
                }
                importedNamespaces.Add(name);
            }
            // An alias affecting an import's first segment needs actual using binding.
            if (importedNamespaces.Any(n => blockedNames.Contains(n.Split('.')[0])))
            {
                return false;
            }

            var namespaceName = string.Empty;
            if (namespaces.Length == 1 && !TryNamespaceName(namespaces[0].Name, out namespaceName))
            {
                return false;
            }
            var visibleNamespaces = new HashSet<string>(importedNamespaces, StringComparer.Ordinal);
            for (var ns = namespaceName; ;)
            {
                visibleNamespaces.Add(ns);
                var separator = ns.LastIndexOf('.');
                if (separator < 0)
                {
                    visibleNamespaces.Add(string.Empty);
                    break;
                }
                ns = ns[..separator];
            }

            foreach (var node in roots.SelectMany(static root => root.DescendantNodes()))
            {
                var identifier = node switch
                {
                    BaseTypeDeclarationSyntax declaration => declaration.Identifier,
                    DelegateDeclarationSyntax declaration => declaration.Identifier,
                    MethodDeclarationSyntax declaration => declaration.Identifier,
                    LocalFunctionStatementSyntax declaration => declaration.Identifier,
                    PropertyDeclarationSyntax declaration => declaration.Identifier,
                    EventDeclarationSyntax declaration => declaration.Identifier,
                    VariableDeclaratorSyntax declaration => declaration.Identifier,
                    ParameterSyntax declaration => declaration.Identifier,
                    TypeParameterSyntax declaration => declaration.Identifier,
                    SingleVariableDesignationSyntax declaration => declaration.Identifier,
                    CatchDeclarationSyntax declaration => declaration.Identifier,
                    ForEachStatementSyntax declaration => declaration.Identifier,
                    EnumMemberDeclarationSyntax declaration => declaration.Identifier,
                    _ => default
                };
                if (!identifier.IsKind(SyntaxKind.None))
                {
                    blockedNames.Add(identifier.ValueText);
                }
            }

            foreach (var declaration in roots.SelectMany(static root => root.DescendantNodes()).OfType<BaseTypeDeclarationSyntax>())
            {
                var containingNames = declaration.AncestorsAndSelf().OfType<BaseTypeDeclarationSyntax>().Reverse().Select(static d =>
                    d.Identifier.ValueText + (d is TypeDeclarationSyntax { TypeParameterList: { } parameters } ? $"`{parameters.Parameters.Count}" : string.Empty));
                var metadataName = string.Join("+", containingNames);
                if (namespaceName.Length > 0)
                {
                    metadataName = namespaceName + "." + metadataName;
                }
                var symbol = FindType(metadataName);
                if (symbol == null)
                {
                    return false;
                }
                for (var current = symbol; current != null; current = current.BaseType)
                {
                    if (current.TypeKind == TypeKind.Error)
                    {
                        return false;
                    }
                    foreach (var parameter in current.TypeParameters)
                    {
                        blockedNames.Add(parameter.Name);
                    }
                    foreach (var member in current.GetMembers())
                    {
                        blockedNames.Add(member.Name);
                        if (member is IMethodSymbol method)
                        {
                            foreach (var parameter in method.TypeParameters)
                            {
                                blockedNames.Add(parameter.Name);
                            }
                        }
                    }
                }
            }

            if (!TryMatchReferences(roots, references, out var matches))
            {
                return false;
            }
            // Type-only lookup and expression lookup have different shadowing
            // rules. Keep the original conservative type blockers unchanged.
            var expressionBlockedNames = new HashSet<string>(blockedNames, StringComparer.Ordinal) { "value", "field" };
            foreach (var node in roots.SelectMany(static root => root.DescendantNodes()))
            {
                var identifier = node switch
                {
                    FromClauseSyntax clause => clause.Identifier,
                    LetClauseSyntax clause => clause.Identifier,
                    JoinClauseSyntax clause => clause.Identifier,
                    JoinIntoClauseSyntax clause => clause.Identifier,
                    QueryContinuationSyntax clause => clause.Identifier,
                    _ => default
                };
                if (!identifier.IsKind(SyntaxKind.None))
                {
                    expressionBlockedNames.Add(identifier.ValueText);
                }
            }
            var decisions = new Dictionary<(string Namespace, string MetadataName, LookupKind Kind), Reduction>();
            var deletions = new List<TextSpan>();
            for (var index = 0; index < matches.Length; index++)
            {
                var node = matches[index];
                var terminal = ReferenceName(node);
                if (terminal == null)
                {
                    continue;
                }

                LookupKind kind;
                if (references[index].Role == TypeReferenceRole.WholeTypeCref && node is QualifiedCrefSyntax)
                {
                    kind = LookupKind.Cref;
                }
                else if (node.Parent is AttributeSyntax attribute && attribute.Name == node)
                {
                    kind = LookupKind.Attribute;
                }
                else if (node.Parent is MemberAccessExpressionSyntax receiver && receiver.Expression == node)
                {
                    kind = LookupKind.StaticReceiver;
                }
                else if (node is QualifiedNameSyntax name && IsSupportedTypePosition(name))
                {
                    kind = LookupKind.Type;
                }
                else
                {
                    continue;
                }

                var type = references[index].Type;
                if (type.DeclaringType != null)
                {
                    continue;
                }

                var key = (type.Namespace, type.ClrMetadataName, kind);
                if (!decisions.TryGetValue(key, out var reduction))
                {
                    reduction = kind == LookupKind.Attribute
                        ? ReduceAttribute(type, visibleNamespaces, blockedNames)
                        : new Reduction(CanShorten(type, visibleNamespaces, kind == LookupKind.StaticReceiver ? expressionBlockedNames : blockedNames));
                    decisions.Add(key, reduction);
                }
                if (reduction.ShortenPrefix)
                {
                    deletions.Add(TextSpan.FromBounds(node.SpanStart, terminal.SpanStart));
                }

                if (reduction.OmitAttributeSuffix)
                {
                    deletions.Add(new TextSpan(terminal.Identifier.Span.End - "Attribute".Length, "Attribute".Length));
                }
            }
            ProviderSyntaxCleanup.AddEdits(roots, _compilation, namespaceName,
                usings.Where(static u => u.Alias != null).Select(static u => u.Alias!.Name.Identifier.ValueText), deletions);
            deletions = deletions.Distinct().ToList();
            deletions.Sort(static (a, b) => a.Start.CompareTo(b.Start));
            var end = 0;
            foreach (var deletion in deletions)
            {
                if (deletion.IsEmpty || deletion.Start < end || !root.FullSpan.Contains(deletion))
                {
                    return false;
                }
                end = deletion.End;
            }
            plan = new PrefixPlan(root.SyntaxTree.GetText(), deletions.ToArray(), decisions.Count);
            return true;
        }

        private INamedTypeSymbol? FindType(string metadataName) => _types.GetOrAdd(metadataName, _compilation.GetTypeByMetadataName);

        private ImmutableArray<ISymbol> FindMembers(string namespaceName, string name) => _namespaceMembers.GetOrAdd((namespaceName, name), key =>
        {
            INamespaceSymbol? current = _compilation.GlobalNamespace;
            if (key.Namespace.Length > 0)
            {
                foreach (var part in key.Namespace.Split('.'))
                {
                    current = current?.GetNamespaceMembers().FirstOrDefault(n => n.Name == part);
                }
            }
            return current == null ? ImmutableArray<ISymbol>.Empty : current.GetMembers(key.Name).Cast<ISymbol>().ToImmutableArray();
        });

        private bool CanShorten(CSharpType type, HashSet<string> namespaces, HashSet<string> blockedNames)
        {
            if (type.DeclaringType != null || blockedNames.Contains(type.Name))
            {
                return false;
            }
            var metadataName = type.Namespace.Length == 0 ? type.ClrMetadataName : type.Namespace + "." + type.ClrMetadataName;
            var target = FindType(metadataName);
            // Compilation symbols also handle framework reference assemblies/type forwarding;
            // runtime Type.Assembly identities need not match reference-assembly identities.
            if (target == null || target.TypeKind == TypeKind.Error)
            {
                return false;
            }
            var found = false;
            foreach (var ns in namespaces)
            {
                foreach (var member in FindMembers(ns, type.Name))
                {
                    if (member is not INamedTypeSymbol named)
                    {
                        return false;
                    }
                    if (named.Arity != target.Arity)
                    {
                        continue;
                    }
                    if (!SymbolEqualityComparer.Default.Equals(named.OriginalDefinition, target.OriginalDefinition))
                    {
                        return false;
                    }
                    found = true;
                }
            }
            return found;
        }

        private Reduction ReduceAttribute(CSharpType type, HashSet<string> namespaces, HashSet<string> blockedNames)
        {
            var target = FindType(type.Namespace.Length == 0 ? type.ClrMetadataName : type.Namespace + "." + type.ClrMetadataName);
            var attribute = FindType("System.Attribute");
            if (target == null || target.TypeKind != TypeKind.Class || target.Arity != 0 || target.IsAbstract || attribute == null)
            {
                return default;
            }

            var derivesFromAttribute = false;
            for (var current = target.BaseType; current != null; current = current.BaseType)
            {
                if (SymbolEqualityComparer.Default.Equals(current, attribute))
                {
                    derivesFromAttribute = true;
                }
            }

            if (!derivesFromAttribute)
            {
                return default;
            }

            var shortName = type.Name.EndsWith("Attribute", StringComparison.Ordinal) ? type.Name[..^"Attribute".Length] : string.Empty;
            var canOmitSuffix = shortName.Length > 0 && SyntaxFacts.IsValidIdentifier(shortName) &&
                SyntaxFacts.GetKeywordKind(shortName) == SyntaxKind.None &&
                // Contextual keyword legality varies by occurrence (e.g. await in
                // async local-function attributes). Keep suffix decisions cacheable
                // across the entire document by conservatively retaining all of them.
                SyntaxFacts.GetContextualKeywordKind(shortName) == SyntaxKind.None;
            if (canOmitSuffix && CanUseAttributeName(target, shortName, namespaces, blockedNames))
            {
                return new Reduction(true, true);
            }

            if (CanUseAttributeName(target, type.Name, namespaces, blockedNames))
            {
                return new Reduction(true);
            }
            // A global-qualified short spelling does not consult local aliases or
            // imported namespaces. Preserve qualification if only this form is safe.
            return new Reduction(false, canOmitSuffix && CanUseAttributeName(target, shortName, new[] { type.Namespace }, null));
        }

        private bool CanUseAttributeName(INamedTypeSymbol target, string spelling, IEnumerable<string> namespaces, HashSet<string>? blockedNames)
        {
            var expanded = spelling + "Attribute";
            if (blockedNames != null && (blockedNames.Contains(spelling) || blockedNames.Contains(expanded)))
            {
                return false;
            }

            var found = false;
            foreach (var ns in namespaces)
            {
                foreach (var candidate in new[] { spelling, expanded })
                {
                    foreach (var member in FindMembers(ns, candidate))
                    {
                        if (member is not INamedTypeSymbol named)
                        {
                            return false;
                        }

                        if (named.Arity != 0)
                        {
                            continue;
                        }

                        if (!SymbolEqualityComparer.Default.Equals(named.OriginalDefinition, target.OriginalDefinition))
                        {
                            return false;
                        }

                        found = true;
                    }
                }
            }
            return found;
        }

        private static bool TryNamespaceName(NameSyntax syntax, out string name)
        {
            name = syntax.ToString();
            if (name.StartsWith("global::", StringComparison.Ordinal))
            {
                name = name[8..];
            }
            return !name.Contains("::", StringComparison.Ordinal) && name.Split('.').All(static part => SyntaxFacts.IsValidIdentifier(part));
        }

        internal sealed class PrefixPlan(SourceText source, TextSpan[] deletions, int decisionCount)
        {
            internal IReadOnlyList<TextSpan> Deletions => deletions;
            internal int DecisionCount => decisionCount;

            internal SourceText Apply()
            {
                if (deletions.Length == 0)
                {
                    return source;
                }
                var input = source.ToString();
                var length = input.Length;
                foreach (var deletion in deletions)
                {
                    length -= deletion.Length;
                }
                var output = string.Create(length, (Input: input, Deletions: deletions), static (destination, state) =>
                {
                    var read = 0;
                    var written = 0;
                    foreach (var deletion in state.Deletions)
                    {
                        var count = deletion.Start - read;
                        state.Input.AsSpan(read, count).CopyTo(destination[written..]);
                        written += count;
                        read = deletion.End;
                    }
                    state.Input.AsSpan(read).CopyTo(destination[written..]);
                });
                return SourceText.From(output, source.Encoding);
            }
        }

        // Ordinary type positions remain deliberately narrow. Static type receivers
        // and attribute names use separate lookup rules above; no cast/cref rewrites.
        private static bool IsSupportedTypePosition(NameSyntax node) => node.Parent switch
        {
            NullableTypeSyntax nullable => nullable.ElementType == node,
            ArrayTypeSyntax array => array.ElementType == node,
            PointerTypeSyntax pointer => pointer.ElementType == node,
            RefTypeSyntax reference => reference.Type == node,
            TupleElementSyntax tuple => tuple.Type == node,
            TypeArgumentListSyntax => true,
            ObjectCreationExpressionSyntax creation => creation.Type == node,
            VariableDeclarationSyntax declaration => declaration.Type == node,
            ParameterSyntax parameter => parameter.Type == node,
            SimpleBaseTypeSyntax baseType => baseType.Type == node,
            MethodDeclarationSyntax method => method.ReturnType == node,
            LocalFunctionStatementSyntax method => method.ReturnType == node,
            PropertyDeclarationSyntax property => property.Type == node,
            IndexerDeclarationSyntax indexer => indexer.Type == node,
            DelegateDeclarationSyntax declaration => declaration.ReturnType == node,
            OperatorDeclarationSyntax declaration => declaration.ReturnType == node,
            ConversionOperatorDeclarationSyntax declaration => declaration.Type == node,
            TypeOfExpressionSyntax expression => expression.Type == node,
            SizeOfExpressionSyntax expression => expression.Type == node,
            DefaultExpressionSyntax expression => expression.Type == node,
            DeclarationExpressionSyntax declaration => declaration.Type == node,
            CatchDeclarationSyntax declaration => declaration.Type == node,
            TypeConstraintSyntax constraint => constraint.Type == node,
            DeclarationPatternSyntax pattern => pattern.Type == node,
            TypePatternSyntax pattern => pattern.Type == node,
            RecursivePatternSyntax pattern => pattern.Type == node,
            BinaryExpressionSyntax expression when expression.IsKind(SyntaxKind.AsExpression) || expression.IsKind(SyntaxKind.IsExpression) => expression.Right == node,
            _ => false
        };
    }
}

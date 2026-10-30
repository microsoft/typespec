// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;

namespace Microsoft.TypeSpec.Generator
{
    // Structural name selection over shared compiler-backed lookup facts. No
    // Simplifier, speculative binding, candidate reparsing, source edits or
    // whole-document traversal. Callers choose the supported integration slice.
    internal static class StructuralTypeNameSelector
    {
        internal enum Retention { None, UnsupportedInput, Trivia, CastShape, GenericCref, ConfigurationShape, Unresolved }
        internal sealed record Selection(SyntaxNode Name, int ScopeSnapshots, int MemberSnapshots, int CandidatesTried, Retention Reason = Retention.None,
            int RootQueries = 0, int MemberQueries = 0, NamePlan? Plan = null);
        private static readonly ConditionalWeakTable<Compilation, Lazy<string[]>> _aliasNames = new();
        internal sealed record Context(Compilation Compilation, SemanticModel Model, SyntaxNode? Reference,
            INamedTypeSymbol? Target, LookupFacts? SharedFacts = null, bool KnownDeclarationType = false, SourceName? Source = null,
            bool PreserveTerminalArguments = false, Mode? ModeOverride = null);
        internal sealed record SourceName(SimpleNameSyntax[] Parts, IdentifierNameSyntax? Root, bool SignificantTrivia, bool Directives, bool Diagnostics);

        internal enum Mode { Type, Expression, Nameof, Cref }
        internal enum RootKind { Ordinary, Alias, Global }
        internal sealed record Part(string Name, int TypeIndex, TypeArgumentListSyntax? Arguments, int Arity);
        internal sealed record Form(RootKind Root, int Start, string? Alias, bool NamespaceAlias, int Cost, bool PreferredAlias = false);

        // A cached qualifier choice never owns occurrence-specific argument syntax.
        // The same construction may be spelled differently at two proven sites.
        internal sealed class NamePlan
        {
            private sealed record Segment(string Name, int TypeIndex, int Arity);

            // Expressions require member-access nodes, not a qualified-name tree
            // with merely identical serialized text. Generic arguments stay opaque.
            internal ExpressionSyntax? RenderExpression(SourceName source)
            {
                static ExpressionSyntax AsExpression(NameSyntax name) => name switch
                {
                    QualifiedNameSyntax qualified => SyntaxFactory.MemberAccessExpression(SyntaxKind.SimpleMemberAccessExpression, AsExpression(qualified.Left), qualified.Right),
                    // Detached roots are essential: speculative APIs promote an
                    // attached original name back to its original member access.
                    IdentifierNameSyntax identifier => SyntaxFactory.IdentifierName(identifier.Identifier),
                    GenericNameSyntax generic => SyntaxFactory.GenericName(generic.Identifier, generic.TypeArgumentList),
                    AliasQualifiedNameSyntax alias => SyntaxFactory.AliasQualifiedName(alias.Alias, alias.Name),
                    _ => throw new InvalidOperationException("Unsupported expression name")
                };
                var name = Render(source);
                if (name == null)
                {
                    return null;
                }

                var expression = AsExpression(name);
                // Constructed IdentifierName binding does not prove serialized
                // contextual-token parsing. Share the same gate with this removal.
                if (ExpressionReceiverSyntaxFacts.ExposesContextualRoot(expression))
                {
                    return null;
                }

                return expression;
            }
            private readonly Segment[] _segments;
            private readonly Form _form;
            private readonly int _typeCount;

            internal NamePlan(IReadOnlyList<Part> parts, Form form, int typeCount)
            {
                _segments = parts.Select(static part => new Segment(part.Name, part.TypeIndex, part.Arity)).ToArray();
                _form = form;
                _typeCount = typeCount;
            }

            internal NameSyntax? Render(SourceName source) => Render(source, crefSyntax: false);

            // Non-global alias::T is XML documentation-ID text, not CrefSyntax.
            // Cref namespace aliases must serialize as alias.T instead. Ordinary
            // C# rendering and global:: qualification are deliberately unchanged.
            internal NameSyntax? RenderCrefName(SourceName source) => Render(source, crefSyntax: true);

            private NameSyntax? Render(SourceName source, bool crefSyntax)
            {
                var parts = new Part[_segments.Length];
                for (var index = 0; index < parts.Length; index++)
                {
                    var segment = _segments[index];
                    var sourceIndex = source.Parts.Length - _typeCount + segment.TypeIndex;
                    var arguments = segment.TypeIndex >= 0 && sourceIndex >= 0 && sourceIndex < source.Parts.Length &&
                        source.Parts[sourceIndex] is GenericNameSyntax generic ? generic.TypeArgumentList : null;
                    if (index >= _form.Start && segment.Arity > 0 && arguments?.Arguments.Count != segment.Arity)
                    {
                        return null;
                    }

                    parts[index] = new Part(segment.Name, segment.TypeIndex, arguments, segment.Arity);
                }
                return StructuralTypeNameSelector.Render(parts, _form, source, _typeCount, crefSyntax);
            }
        }

        private sealed class View
        {
            internal readonly Context Input;
            internal readonly INamedTypeSymbol Target;
            internal readonly INamedTypeSymbol[] Types;
            internal readonly Mode LookupMode;
            internal readonly bool WholeNameofOperand;
            internal readonly string TerminalSpelling;
            internal readonly string? PreferredAlias;
            internal readonly SimpleNameSyntax[] SourceNames;
            internal readonly bool UnsupportedCast;
            internal readonly LookupFacts Facts;
            internal readonly SourceName Source;
            internal int ScopeSnapshots => Facts.ScopeSnapshots;
            internal int MemberSnapshots => Facts.MemberSnapshots;

            internal View(Context input, INamedTypeSymbol target)
            {
                Input = input; Target = target;
                Facts = input.SharedFacts ?? new LookupFacts(input.Model, input.Reference!.SpanStart);
                var types = new Stack<INamedTypeSymbol>();
                for (var type = target; type != null; type = type.ContainingType)
                {
                    types.Push(type);
                }

                Types = types.ToArray();
                LookupMode = input.ModeOverride ?? (input.Reference is CrefSyntax ? Mode.Cref : Mode.Type);
                if (input.ModeOverride == null && !input.KnownDeclarationType)
                {
                    foreach (var ancestor in input.Reference!.Ancestors())
                {
                    if (ancestor is CastExpressionSyntax cast && cast.Type.Span.Contains(input.Reference.Span) && cast.Expression is not ParenthesizedExpressionSyntax)
                        {
                            UnsupportedCast = true;
                        }

                        if (LookupMode != Mode.Nameof && ancestor is InvocationExpressionSyntax invocation && input.Model.GetOperation(invocation) is INameOfOperation)
                    {
                        LookupMode = Mode.Nameof;
                        WholeNameofOperand = invocation.ArgumentList.Arguments.Single().Expression == input.Reference;
                    }
                    if (ancestor is MemberDeclarationSyntax)
                        {
                            break;
                        }
                    }
                }

                if (input.ModeOverride == null && !input.KnownDeclarationType && LookupMode == Mode.Type && input.Reference!.Parent is MemberAccessExpressionSyntax member && member.Expression == input.Reference)
                {
                    LookupMode = Mode.Expression;
                }

                Source = input.Source ?? Describe(input.Reference!);
                SourceNames = Source.Parts;
                TerminalSpelling = SourceNames.LastOrDefault()?.Identifier.ValueText ?? target.Name;
                if (!input.KnownDeclarationType && Source.Root != null)
                {
                    PreferredAlias = input.Model.GetAliasInfo(Source.Root)?.Name;
                }
            }

            internal ISymbol[] Scope(string name, bool expressions) => Facts.Scope(name, expressions);
            internal ISymbol[] Members(INamespaceOrTypeSymbol container, string name, bool expressions) => Facts.Members(container, name, expressions);
            internal IEnumerable<IAliasSymbol> Aliases() => Facts.Aliases();
        }

        internal sealed class LookupFacts
        {
            private readonly SemanticModel _model;
            private readonly int _position;
            private readonly Dictionary<(bool Expressions, string Name), ISymbol[]> _scopes = new();
            private readonly Dictionary<(INamespaceOrTypeSymbol Container, bool Expressions, string Name), ISymbol[]> _members = new();
            private readonly HashSet<bool> _scopeViews = new();
            private readonly HashSet<(INamespaceOrTypeSymbol, bool)> _memberViews = new();
            internal int ScopeSnapshots => _scopeViews.Count;
            internal int MemberSnapshots => _memberViews.Count;
            internal int RootQueries { get; private set; }
            internal int MemberQueries { get; private set; }
            internal LookupFacts(SemanticModel model, int position) { _model = model; _position = position; }

            internal ISymbol[] Scope(string name, bool expressions)
            {
                var key = (expressions, name);
                if (!_scopes.TryGetValue(key, out var facts))
                {
                    var symbols = expressions ? _model.LookupSymbols(_position, name: name)
                        : _model.LookupNamespacesAndTypes(_position, name: name);
                    facts = symbols.Distinct(SymbolEqualityComparer.Default).ToArray();
                    _scopes.Add(key, facts); _scopeViews.Add(expressions); RootQueries++;
                }
                return facts;
            }

            internal ISymbol[] Members(INamespaceOrTypeSymbol container, string name, bool expressions)
            {
                var key = (container, expressions, name);
                if (!_members.TryGetValue(key, out var facts))
                {
                    var symbols = expressions ? _model.LookupSymbols(_position, container, name)
                        : _model.LookupNamespacesAndTypes(_position, container, name);
                    facts = symbols.Distinct(SymbolEqualityComparer.Default).ToArray();
                    _members.Add(key, facts); _memberViews.Add((container, expressions)); MemberQueries++;
                }
                return facts;
            }

            internal IEnumerable<IAliasSymbol> Aliases()
            {
                // Only source alias NAMES are indexed compilation-wide. Actual
                // visibility/precedence/target is resolved in this lookup region.
                var names = _aliasNames.GetValue(_model.Compilation, static compilation => new Lazy<string[]>(() => CollectAliasNames(compilation))).Value;
                foreach (var name in names)
                {
                    foreach (var symbol in Scope(name, false))
                    {
                        if (symbol is IAliasSymbol alias)
                        {
                            yield return alias;
                        }
                    }
                }
            }
        }

        internal static Selection Evaluate(IReadOnlyList<Context> configurations) => EvaluateCore(configurations, chooseOnly: false);

        // Occurrence-specific integrations may reject a lexically valid plan
        // after their own complete-context proof and continue to the next form.
        // The selector neither performs nor caches that caller-owned binding.
        internal static Selection Choose(IReadOnlyList<Context> configurations, Func<NamePlan, bool>? acceptPlan = null) =>
            EvaluateCore(configurations, chooseOnly: true, acceptPlan);

        private static Selection EvaluateCore(IReadOnlyList<Context> configurations, bool chooseOnly, Func<NamePlan, bool>? acceptPlan = null)
        {
            if (configurations.Count == 0)
            {
                throw new ArgumentException("At least one scope view is required", nameof(configurations));
            }

            var original = configurations[0].Reference ?? throw new ArgumentException("Missing original reference");
            var views = new List<View>();
            foreach (var configuration in configurations)
            {
                var target = configuration.Target;
                if (configuration.Reference == null || target == null || original is PredefinedTypeSyntax || target.IsUnboundGenericType)
                {
                    return new Selection(original, 0, 0, 0, Retention.UnsupportedInput);
                }

                views.Add(new View(configuration, target));
            }
            var shape = views[0].Types;
            if (views.Any(v => v.Types.Length != shape.Length || v.Types.Where((type, index) =>
                type.Name != shape[index].Name || type.Arity != shape[index].Arity).Any()))
            {
                return Finish(original, views, 0, Retention.ConfigurationShape);
            }
            // Preserve uncertain trivia and cast forms. Context is captured once,
            // not rediscovered for each candidate. Existing wrappers are untouched.
            if (views.Any(static v => v.Source.Diagnostics || v.Source.Directives || v.Source.SignificantTrivia))
            {
                return Finish(original, views, 0, Retention.Trivia);
            }

            if (views.Any(static v => v.UnsupportedCast))
            {
                return Finish(original, views, 0, Retention.CastShape);
            }

            if (views.Any(static v => v.LookupMode == Mode.Cref && v.Types.Any(static t => t.Arity > 0)))
            {
                return Finish(original, views, 0, Retention.GenericCref);
            }

            var first = views[0];
            var sourceNames = first.SourceNames;
            var namespaces = new Stack<INamespaceSymbol>();
            for (var ns = first.Target.ContainingNamespace; !ns.IsGlobalNamespace; ns = ns.ContainingNamespace)
            {
                namespaces.Push(ns);
            }

            var parts = namespaces.Select(static ns => new Part(ns.Name, -1, null, 0)).ToList();
            for (var index = 0; index < first.Types.Length; index++)
            {
                var sourceIndex = sourceNames.Length - first.Types.Length + index;
                var arguments = sourceIndex >= 0 && sourceNames[sourceIndex] is GenericNameSyntax generic ? generic.TypeArgumentList : null;
                parts.Add(new Part(first.Types[index].Name, index, arguments, first.Types[index].Arity));
            }
            var forms = new List<Form>();
            for (var start = 0; start < parts.Count; start++)
            {
                forms.Add(new Form(RootKind.Ordinary, start, null, false, parts.Count - start));
            }

            forms.Add(new Form(RootKind.Global, 0, null, false, parts.Count + 1));
            foreach (var alias in first.Aliases())
            {
                var namespaceAlias = alias.Target is INamespaceSymbol;
                if (alias.Target is not INamespaceOrTypeSymbol)
                {
                    continue;
                }

                for (var start = 0; start <= parts.Count; start++)
                {
                    if (namespaceAlias && start == parts.Count)
                    {
                        continue;
                    }

                    forms.Add(new Form(RootKind.Alias, start, alias.Name, namespaceAlias, parts.Count - start + 1, alias.Name == first.PreferredAlias));
                }
            }
            var attempts = 0;
            foreach (var form in forms.OrderBy(static f => f.Cost).ThenBy(static f => f.PreferredAlias ? 0 : 1)
                .ThenBy(static f => f.Root).ThenBy(static f => f.Alias, StringComparer.Ordinal).ThenBy(static f => f.Start))
            {
                if (parts.Skip(form.Start).Any(static p => p.Arity > 0 && p.Arguments?.Arguments.Count != p.Arity))
                {
                    continue;
                }
                // Prefix-only integration must not replace the terminal and drop
                // its opaque argument list via a closed-type alias.
                if (form.Start == parts.Count && views.Any(static view => view.Input.PreserveTerminalArguments))
                {
                    continue;
                }

                if (views.Any(view => view.LookupMode == Mode.Nameof && view.WholeNameofOperand &&
                    (form.Start == parts.Count ? form.Alias : parts[^1].Name) != view.TerminalSpelling))
                {
                    continue;
                }

                attempts++;
                if (views.All(view => Resolves(view, parts, form)))
                {
                    if (!chooseOnly)
                    {
                        return Finish(Render(parts, form), views, attempts);
                    }

                    var plan = new NamePlan(parts, form, first.Types.Length);
                    if (acceptPlan != null && !acceptPlan(plan))
                    {
                        continue;
                    }

                    return Finish(original, views, attempts, plan: plan);
                }
            }
            return Finish(original, views, attempts, Retention.Unresolved);
        }

        private static Selection Finish(SyntaxNode syntax, IEnumerable<View> views, int attempts, Retention reason = Retention.None, NamePlan? plan = null) =>
            new(syntax, views.Sum(static v => v.ScopeSnapshots), views.Sum(static v => v.MemberSnapshots), attempts, reason,
                views.Sum(static v => v.Facts.RootQueries), views.Sum(static v => v.Facts.MemberQueries), plan);

        private static bool Resolves(View view, IReadOnlyList<Part> parts, Form form)
        {
            var expression = view.LookupMode is Mode.Expression or Mode.Nameof;
            var start = form.Start;
            List<INamespaceOrTypeSymbol> current;
            if (form.Root == RootKind.Global)
            {
                current = new() { view.Input.Compilation.GlobalNamespace };
            }
            else if (form.Root == RootKind.Alias)
            {
                var bindings = view.Scope(form.Alias!, form.NamespaceAlias ? false : expression);
                if (bindings.Any(static s => s is not INamespaceOrTypeSymbol && s is not IAliasSymbol))
                {
                    return false;
                }

                current = bindings.OfType<IAliasSymbol>().Where(a => a.Name == form.Alias && (a.Target is INamespaceSymbol) == form.NamespaceAlias)
                    .Select(static a => a.Target).OfType<INamespaceOrTypeSymbol>().ToList();
                if (current.Count == 0)
                {
                    return false;
                }
            }
            else
            {
                current = Bind(view, view.Scope(parts[start].Name, expression), parts[start]);
                start++;
            }
            current = current.Distinct<INamespaceOrTypeSymbol>(SymbolEqualityComparer.IncludeNullability).ToList();
            if (current.Count != 1)
            {
                return false;
            }

            for (; start < parts.Count; start++)
            {
                var part = parts[start];
                current = Bind(view, view.Members(current[0], part.Name, expression), part)
                    .Distinct<INamespaceOrTypeSymbol>(SymbolEqualityComparer.IncludeNullability).ToList();
                // Ambiguity is a failure at this lookup stage. Later suffixes
                // cannot discard one ambiguous owner and make the path legal.
                if (current.Count != 1)
                {
                    return false;
                }
            }
            return SymbolEqualityComparer.IncludeNullability.Equals(current[0], view.Target);
        }

        private static string[] CollectAliasNames(Compilation compilation)
        {
            var names = new HashSet<string>(StringComparer.Ordinal);
            // A namespace/using-declaration index only: do not visit any type or
            // method body. Lazy publication ensures one collection per compilation.
            foreach (var tree in compilation.SyntaxTrees)
            {
                if (tree.GetRoot() is not CompilationUnitSyntax root)
                {
                    continue;
                }

                Add(root.Usings);
                var pending = new Stack<BaseNamespaceDeclarationSyntax>(root.Members.OfType<BaseNamespaceDeclarationSyntax>());
                while (pending.TryPop(out var ns))
                {
                    Add(ns.Usings);
                    foreach (var nested in ns.Members.OfType<BaseNamespaceDeclarationSyntax>())
                    {
                        pending.Push(nested);
                    }
                }
            }
            return names.Order(StringComparer.Ordinal).ToArray();

            void Add(IEnumerable<UsingDirectiveSyntax> directives)
            {
                foreach (var directive in directives)
                {
                    if (directive.Alias != null)
                    {
                        names.Add(directive.Alias.Name.Identifier.ValueText);
                    }
                }
            }
        }

        private static List<INamespaceOrTypeSymbol> Bind(View view, ISymbol[] symbols, Part part)
        {
            var result = new List<INamespaceOrTypeSymbol>();
            foreach (var entry in symbols)
            {
                var symbol = entry;
                var alias = symbol is IAliasSymbol;
                if (symbol is IAliasSymbol aliased)
                {
                    if (part.Arity != 0)
                    {
                        continue;
                    }

                    symbol = aliased.Target;
                }
                if (symbol is INamespaceSymbol ns && part.Arity == 0)
                {
                    result.Add(ns);
                }
                else if (symbol is INamedTypeSymbol named && (alias || named.Arity == part.Arity))
                {
                    if (!alias && named.Arity > 0 && part.TypeIndex >= 0)
                    {
                        named = named.ConstructedFrom.Construct(view.Types[part.TypeIndex].TypeArguments.ToArray());
                    }

                    result.Add(named);
                }
                else if (symbol is ITypeParameterSymbol && part.Arity == 0)
                {
                    // A type parameter wins lookup but is not the named target.
                    return new List<INamespaceOrTypeSymbol>();
                }
                else if (symbol is not INamespaceOrTypeSymbol && !alias &&
                    (part.Arity == 0 || symbol is IMethodSymbol method && method.Arity == part.Arity))
                {
                    return new List<INamespaceOrTypeSymbol>();
                }
            }
            return result;
        }

        private static NameSyntax Render(IReadOnlyList<Part> parts, Form form, SourceName? source = null, int typeCount = 0, bool crefSyntax = false)
        {
            SimpleNameSyntax PartName(Part part)
            {
                if (source != null && part.TypeIndex >= 0)
                {
                    return source.Parts[source.Parts.Length - typeCount + part.TypeIndex];
                }

                return part.Arity == 0 ? SyntaxFactory.IdentifierName(Identifier(part.Name))
                    : SyntaxFactory.GenericName(Identifier(part.Name), part.Arguments!);
            }
            NameSyntax name;
            var start = form.Start;
            if (form.Root == RootKind.Alias)
            {
                var alias = SyntaxFactory.IdentifierName(Identifier(form.Alias!));
                if (start == parts.Count)
                {
                    return alias;
                }

                name = form.NamespaceAlias && !crefSyntax ? SyntaxFactory.AliasQualifiedName(alias, PartName(parts[start++]))
                    : SyntaxFactory.QualifiedName(alias, PartName(parts[start++]));
            }
            else if (form.Root == RootKind.Global)
            {
                name = SyntaxFactory.AliasQualifiedName(SyntaxFactory.IdentifierName(SyntaxFactory.Token(SyntaxKind.GlobalKeyword)), PartName(parts[start++]));
            }
            else
            {
                name = PartName(parts[start++]);
            }

            for (; start < parts.Count; start++)
            {
                name = SyntaxFactory.QualifiedName(name, PartName(parts[start]));
            }

            return name;
        }

        private static SyntaxToken Identifier(string name)
        {
            var escape = SyntaxFacts.GetKeywordKind(name) != SyntaxKind.None || SyntaxFacts.GetContextualKeywordKind(name) != SyntaxKind.None;
            return SyntaxFactory.Identifier(default, SyntaxKind.None, escape ? "@" + name : name, name, default);
        }

        // Only callers that restore the complete outer trivia on the final
        // replacement may admit boundary comments. Internal trivia and directives
        // remain conservative, including comments inside retained arguments.
        internal static SourceName Describe(SyntaxNode reference, bool preserveBoundaryComments = false)
        {
            var names = new List<SimpleNameSyntax>();
            IdentifierNameSyntax? root = null;
            CollectSourceParts(reference, names, ref root);
            var significant = false;
            foreach (var trivia in reference.DescendantTrivia())
            {
                if (trivia.IsKind(SyntaxKind.WhitespaceTrivia) || trivia.IsKind(SyntaxKind.EndOfLineTrivia))
                {
                    continue;
                }

                if (preserveBoundaryComments && (trivia.Span.End <= reference.SpanStart || trivia.SpanStart >= reference.Span.End) &&
                    trivia.Kind() is SyntaxKind.SingleLineCommentTrivia or SyntaxKind.MultiLineCommentTrivia or
                        SyntaxKind.SingleLineDocumentationCommentTrivia or SyntaxKind.MultiLineDocumentationCommentTrivia)
                {
                    continue;
                }

                significant = true;
                break;
            }
            return new SourceName(names.ToArray(), root, significant, reference.ContainsDirectives, reference.ContainsDiagnostics);
        }

        private static void CollectSourceParts(SyntaxNode node, List<SimpleNameSyntax> parts, ref IdentifierNameSyntax? rootName)
        {
            switch (node)
            {
                case SimpleNameSyntax simple:
                    if (parts.Count == 0)
                    {
                        rootName = simple as IdentifierNameSyntax;
                    }

                    parts.Add(simple); break;
                case QualifiedNameSyntax qualified:
                    CollectSourceParts(qualified.Left, parts, ref rootName);
                    parts.Add(qualified.Right); break;
                case AliasQualifiedNameSyntax alias:
                    if (parts.Count == 0)
                    {
                        rootName = alias.Alias;
                    }

                    parts.Add(alias.Name); break;
                case MemberAccessExpressionSyntax member:
                    CollectSourceParts(member.Expression, parts, ref rootName);
                    parts.Add(member.Name); break;
                case QualifiedCrefSyntax cref:
                    CollectSourceParts(cref.Container, parts, ref rootName);
                    CollectSourceParts(cref.Member, parts, ref rootName); break;
                case NameMemberCrefSyntax cref:
                    CollectSourceParts(cref.Name, parts, ref rootName); break;
                case TypeCrefSyntax cref:
                    CollectSourceParts(cref.Type, parts, ref rootName); break;
            }
        }
    }
}

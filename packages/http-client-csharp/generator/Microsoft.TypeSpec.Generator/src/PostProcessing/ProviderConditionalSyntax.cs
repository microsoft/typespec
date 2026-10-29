// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;

namespace Microsoft.TypeSpec.Generator
{
    internal sealed class ProviderConditionalSyntax
    {
        private static readonly string[] Thresholds = ["NET6_0_OR_GREATER", "NET8_0_OR_GREATER", "NET9_0_OR_GREATER", "NET10_0_OR_GREATER"];
        private static readonly string[] HeaderThresholds = ["NETCOREAPP2_1_OR_GREATER", "NET5_0_OR_GREATER", "NET6_0_OR_GREATER", "NET8_0_OR_GREATER", "NET9_0_OR_GREATER", "NET10_0_OR_GREATER"];
        private readonly Compilation _compilation;
        private readonly ConcurrentDictionary<SyntaxTree, SyntaxNode[]> _roots = new();
        private readonly ConcurrentDictionary<SyntaxTree, bool> _conditionalTrees = new();
        private readonly ConcurrentDictionary<SyntaxTree, bool> _typeOnlyTrees = new();
        private readonly Lazy<bool> _stableDeclarations;

        internal ProviderConditionalSyntax(Compilation compilation)
        {
            _compilation = compilation;
            _stableDeclarations = new Lazy<bool>(ValidateCompilation);
        }

        internal static bool HasConditional(SyntaxNode root) => root.ContainsDirectives && root.DescendantTrivia().Any(static t =>
            t.IsKind(SyntaxKind.IfDirectiveTrivia) || t.IsKind(SyntaxKind.ElifDirectiveTrivia) || t.IsKind(SyntaxKind.ElseDirectiveTrivia) || t.IsKind(SyntaxKind.EndIfDirectiveTrivia));

        internal bool TryGetRoots(SyntaxNode root, out SyntaxNode[] roots)
        {
            roots = [root];
            if (!_stableDeclarations.Value) return false;
            if (!TreeHasConditional(root)) return true;
            return _roots.TryGetValue(root.SyntaxTree, out roots!);
        }

        internal bool IsUnconditionalDocument(SyntaxNode root) => _stableDeclarations.Value && !TreeHasConditional(root);

        // Type-only lookup ignores value declarations, but generic local-function
        // wrappers can change a physical site's type-parameter scope across parses.
        // Keep such documents opaque; inactive syntax is never rewritten.
        internal bool IsTypeOnlyDocument(SyntaxNode root) => _stableDeclarations.Value &&
            (!TreeHasConditional(root) || _typeOnlyTrees.ContainsKey(root.SyntaxTree));

        private bool TreeHasConditional(SyntaxNode root) => _conditionalTrees.GetOrAdd(root.SyntaxTree,
            static tree => HasConditional(tree.GetRoot()));

        private bool ValidateCompilation()
        {
            // Conditional changes in another partial/custom/shared source tree can
            // alter namespace/member lookup. A per-document body check is not enough.
            foreach (var tree in _compilation.SyntaxTrees)
            {
                var root = tree.GetRoot();
                if (!TreeHasConditional(root)) continue;
                if (!HasInvariantHeaders(root)) return false;
                // A fixed-project-flag Shared document may be opaque itself while
                // proving that it cannot change lookup in other documents.
                if (TryParseInvariantBodies(root, out var roots, out var hasGenericLocalFunctions))
                {
                    _roots.TryAdd(tree, roots);
                    if (!hasGenericLocalFunctions) _typeOnlyTrees.TryAdd(tree, true);
                }
            }
            return true;
        }

        private static bool HasInvariantHeaders(SyntaxNode root)
        {
            if (root.ContainsDiagnostics || root.SyntaxTree.Options is not CSharpParseOptions options) return false;
            var directives = root.DescendantTrivia().Where(static t => t.IsDirective)
                .Select(static t => t.GetStructure()).OfType<DirectiveTriviaSyntax>().ToArray();
            var used = new HashSet<string>(StringComparer.Ordinal);
            foreach (var directive in directives)
            {
                if (directive is DefineDirectiveTriviaSyntax or UndefDirectiveTriviaSyntax) return false;
                var condition = directive switch
                {
                    IfDirectiveTriviaSyntax branch => branch.Condition,
                    ElifDirectiveTriviaSyntax branch => branch.Condition,
                    _ => null
                };
                if (condition == null) continue;
                foreach (var name in condition.DescendantNodesAndSelf().OfType<IdentifierNameSyntax>())
                {
                    var symbol = name.Identifier.ValueText;
                    if (symbol.StartsWith("NET", StringComparison.Ordinal) && !HeaderThresholds.Contains(symbol)) return false;
                    if (HeaderThresholds.Contains(symbol)) used.Add(symbol);
                }
            }
            // Only framework thresholds vary. Preserve the exact original project
            // defines, and include the original (possibly noncanonical) NET state.
            var fixedSymbols = options.PreprocessorSymbolNames.Where(static s => !HeaderThresholds.Contains(s)).ToArray();
            var signatures = new HashSet<string>(StringComparer.Ordinal);
            string Signature(IEnumerable<string> symbols) => string.Join(";", used.Order(StringComparer.Ordinal).Select(s => symbols.Contains(s) ? "1" : "0"));
            signatures.Add(Signature(options.PreprocessorSymbolNames));
            var expected = HeaderShape(root);
            for (var level = 0; level <= HeaderThresholds.Length; level++)
            {
                var active = HeaderThresholds.Take(level).ToArray();
                if (!signatures.Add(Signature(active))) continue;
                var variant = CSharpSyntaxTree.ParseText(root.SyntaxTree.GetText(), options.WithPreprocessorSymbols(fixedSymbols.Concat(active)), root.SyntaxTree.FilePath).GetRoot();
                if (variant.ContainsDiagnostics || !string.Equals(expected, HeaderShape(variant), StringComparison.Ordinal)) return false;
            }
            return true;
        }

        private static bool TryParseInvariantBodies(SyntaxNode root, out SyntaxNode[] roots, out bool hasGenericLocalFunctions)
        {
            roots = [];
            hasGenericLocalFunctions = false;
            if (root.ContainsDiagnostics || root.SyntaxTree.Options is not CSharpParseOptions options) return false;
            var directives = root.DescendantTrivia().Where(static t => t.IsDirective).Select(static t => t.GetStructure()).OfType<DirectiveTriviaSyntax>().ToArray();
            var used = new HashSet<string>(StringComparer.Ordinal);
            foreach (var directive in directives)
            {
                if (directive is IfDirectiveTriviaSyntax condition)
                {
                    if (condition.Condition is not IdentifierNameSyntax name || !Thresholds.Contains(name.Identifier.ValueText)) return false;
                    used.Add(name.Identifier.ValueText);
                }
                else if (directive is ElifDirectiveTriviaSyntax or DefineDirectiveTriviaSyntax or UndefDirectiveTriviaSyntax) return false;
            }
            if (used.Count == 0) return false;
            var fixedSymbols = options.PreprocessorSymbolNames.Where(static s => !Thresholds.Contains(s)).ToArray();
            if (!BodyShape(root, out var originalShape, out hasGenericLocalFunctions)) return false;
            var originalSymbols = options.PreprocessorSymbolNames.ToHashSet(StringComparer.Ordinal);
            var signatures = new HashSet<string>(StringComparer.Ordinal)
            {
                string.Join(";", used.Order(StringComparer.Ordinal).Select(s => originalSymbols.Contains(s) ? "1" : "0"))
            };
            var parsed = new List<SyntaxNode> { root };
            for (var level = 0; level <= Thresholds.Length; level++)
            {
                var active = Thresholds.Take(level).ToArray();
                var signature = string.Join(";", used.Order(StringComparer.Ordinal).Select(s => active.Contains(s) ? "1" : "0"));
                if (!signatures.Add(signature)) continue;
                var symbols = fixedSymbols.Concat(active).ToArray();
                var variant = options.PreprocessorSymbolNames.ToHashSet(StringComparer.Ordinal).SetEquals(symbols)
                    ? root : CSharpSyntaxTree.ParseText(root.SyntaxTree.GetText(), options.WithPreprocessorSymbols(symbols), root.SyntaxTree.FilePath).GetRoot();
                if (variant.ContainsDiagnostics || !BodyShape(variant, out var shape, out var variantHasGenericLocalFunctions)) return false;
                hasGenericLocalFunctions |= variantHasGenericLocalFunctions;
                if (!string.Equals(shape, originalShape, StringComparison.Ordinal)) return false;
                parsed.Add(variant);
            }
            roots = parsed.ToArray();
            return roots.Length > 0;
        }

        private static bool BodyShape(SyntaxNode root, out string shape, out bool hasGenericLocalFunctions)
        {
            shape = string.Empty;
            var bodies = Bodies(root, out hasGenericLocalFunctions);
            foreach (var trivia in root.DescendantTrivia().Where(static t => t.IsKind(SyntaxKind.IfDirectiveTrivia) ||
                t.IsKind(SyntaxKind.ElifDirectiveTrivia) || t.IsKind(SyntaxKind.ElseDirectiveTrivia) || t.IsKind(SyntaxKind.EndIfDirectiveTrivia)))
            {
                if (!bodies.Any(body => body.Contains(trivia.FullSpan))) return false;
                var token = trivia.Token;
                var statement = token.Parent?.AncestorsAndSelf().OfType<StatementSyntax>().FirstOrDefault();
                // Branches must start/end at complete statement boundaries. Never
                // rejoin fragments of an expression, argument list, or declaration.
                if (statement?.SpanStart != token.SpanStart && !(token.Parent is BlockSyntax block && block.CloseBraceToken == token)) return false;
            }
            shape = HeaderShape(root);
            return true;
        }

        private static TextSpan[] Bodies(SyntaxNode root) => Bodies(root, out _);

        private static TextSpan[] Bodies(SyntaxNode root, out bool hasGenericLocalFunctions)
        {
            var bodies = new List<TextSpan>();
            hasGenericLocalFunctions = false;
            // Reuse the existing declaration collector; no additional body walk
            // just to discover conditional type-parameter scope hazards.
            foreach (var node in root.DescendantNodes())
            {
                switch (node)
                {
                    case MethodDeclarationSyntax { Body: { } body }:
                        bodies.Add(body.Span);
                        break;
                    case ConstructorDeclarationSyntax { Body: { } body }:
                        bodies.Add(body.Span);
                        break;
                    case LocalFunctionStatementSyntax { TypeParameterList: not null }:
                        hasGenericLocalFunctions = true;
                        break;
                }
            }
            return bodies.OrderBy(static s => s.Start).ToArray();
        }

        private static string HeaderShape(SyntaxNode root)
        {
            var bodies = Bodies(root);
            var builder = new StringBuilder();
            foreach (var body in bodies) builder.Append(body.Start).Append(':').Append(body.Length).Append(';');
            // Directive state can escape a body even when its ordinary tokens do
            // not: e.g. #nullable changes later declaration semantics.
            foreach (var directive in root.DescendantTrivia().Where(static t => t.IsDirective)
                .Select(static t => t.GetStructure()).OfType<DirectiveTriviaSyntax>())
            {
                if (directive is IfDirectiveTriviaSyntax or ElifDirectiveTriviaSyntax or ElseDirectiveTriviaSyntax or EndIfDirectiveTriviaSyntax or
                    RegionDirectiveTriviaSyntax or EndRegionDirectiveTriviaSyntax) continue;
                builder.Append(directive.SpanStart).Append(':').Append(directive.RawKind).Append(':')
                    .Append(directive.IsActive).Append(':').Append(directive.ToFullString()).Append(';');
            }
            foreach (var token in root.DescendantTokens())
            {
                if (bodies.Any(body => body.Contains(token.Span))) continue;
                builder.Append(token.SpanStart).Append(':').Append(token.RawKind).Append(':').Append(token.Text.Length).Append(':').Append(token.Text).Append(';');
            }
            return builder.ToString();
        }
    }
}

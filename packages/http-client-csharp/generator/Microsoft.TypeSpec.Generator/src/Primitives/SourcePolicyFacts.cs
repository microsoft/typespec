// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal enum SourceFactState { Unavailable, Absent, Present, Known }
    internal enum SourceProvenance { Opaque, StructuredWriter, OriginalLoadedSource }

    /// <summary>
    /// Original lexical/emission facts, independent of declaration maps and all future observation facts.
    /// Intrinsic facts describe this node's audited writer only, NOT inherited visibility, diagnostics,
    /// configuration safety, whole-subtree safety or permission to edit. Unknown context stays unknown.
    /// </summary>
    internal sealed record SourcePolicyFacts(SourceProvenance Provenance, SourceFactState Diagnostics,
        SourceFactState Directives, SourceFactState Trivia, SourceFactState Tokens, SourceFactState Visibility,
        SourceFactState MappedSource, SourceFactState Configuration, SourceFactState LineEndings,
        SourceFactState Layout, SourceFactState InactiveVariants, bool WithinConditional,
        string? IntrinsicLineEnding = null)
    {
        internal static SourcePolicyFacts Opaque(bool conditional = false) => new(SourceProvenance.Opaque,
            SourceFactState.Unavailable, SourceFactState.Unavailable, SourceFactState.Unavailable, SourceFactState.Unavailable,
            SourceFactState.Unavailable, SourceFactState.Unavailable, SourceFactState.Unavailable, SourceFactState.Unavailable,
            SourceFactState.Unavailable, SourceFactState.Unavailable, conditional);

        internal static SourcePolicyFacts Structured(bool tokens, bool lineBreaks, bool directives, bool conditional, bool layoutKnown) => new(
            SourceProvenance.StructuredWriter, SourceFactState.Unavailable,
            directives ? SourceFactState.Present : tokens ? SourceFactState.Absent : SourceFactState.Unavailable,
            tokens ? SourceFactState.Absent : SourceFactState.Unavailable,
            tokens ? SourceFactState.Known : SourceFactState.Unavailable,
            SourceFactState.Unavailable, SourceFactState.Unavailable, SourceFactState.Unavailable,
            !layoutKnown ? SourceFactState.Unavailable : lineBreaks ? SourceFactState.Known : SourceFactState.Absent,
            !layoutKnown ? SourceFactState.Unavailable : lineBreaks ? SourceFactState.Present : SourceFactState.Absent,
            conditional ? SourceFactState.Present : SourceFactState.Unavailable, conditional, layoutKnown && lineBreaks ? "\n" : null);

        // Read ONLY an already-loaded original tree. This never parses generated or raw emitted text.
        internal static SourcePolicyFacts Original(SyntaxReference reference, Compilation compilation)
        {
            var tree = reference.SyntaxTree;
            if (!compilation.ContainsSyntaxTree(tree)) { return Opaque(); }
            var syntax = reference.GetSyntax();
            var trivia = syntax.DescendantTrivia(descendIntoTrivia: true).ToImmutableArray();
            var rootTrivia = tree.GetRoot().DescendantTrivia(descendIntoTrivia: true).ToImmutableArray();
            var physical = tree.GetLineSpan(reference.Span);
            var mapped = tree.GetMappedLineSpan(reference.Span);
            var text = tree.GetText().ToString(reference.Span);
            var endings = text.Contains("\r\n", StringComparison.Ordinal) ? "\r\n" : text.Contains('\n') ? "\n" : text.Contains('\r') ? "\r" : string.Empty;
            var withoutCrLf = text.Replace("\r\n", string.Empty, StringComparison.Ordinal);
            if (endings == "\r\n" && (withoutCrLf.Contains('\n') || withoutCrLf.Contains('\r')) ||
                withoutCrLf.Contains('\n') && withoutCrLf.Contains('\r')) { endings = "mixed"; }
            var conditional = rootTrivia.Any(t => t.GetStructure() is IfDirectiveTriviaSyntax or ElifDirectiveTriviaSyntax or ElseDirectiveTriviaSyntax or EndIfDirectiveTriviaSyntax);
            return new(SourceProvenance.OriginalLoadedSource,
                compilation.GetDiagnostics().Any(d => d.Location.SourceTree == tree && d.Location.SourceSpan.IntersectsWith(reference.Span)) ? SourceFactState.Present : SourceFactState.Absent,
                trivia.Any(t => t.IsDirective) ? SourceFactState.Present : SourceFactState.Absent,
                trivia.Any(t => !t.IsKind(SyntaxKind.WhitespaceTrivia) && !t.IsKind(SyntaxKind.EndOfLineTrivia)) ? SourceFactState.Present : SourceFactState.Absent,
                SourceFactState.Known,
                tree.GetLineVisibility(reference.Span.Start) == LineVisibility.Hidden ? SourceFactState.Present : SourceFactState.Unavailable,
                mapped.Path != physical.Path || mapped.Span != physical.Span ? SourceFactState.Present : SourceFactState.Unavailable,
                SourceFactState.Known, SourceFactState.Known,
                endings.Length == 0 ? SourceFactState.Absent : SourceFactState.Present,
                conditional ? SourceFactState.Present : SourceFactState.Unavailable, conditional, endings);
        }
    }
}

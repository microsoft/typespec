// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;

namespace Microsoft.TypeSpec.Generator
{
    // Candidate-independent syntax certificate; not a cached binding decision.
    internal static class ConditionalStaticReceiverRules
    {
        internal static bool HasHardSourceContext(SyntaxNode receiver)
        {
            foreach (var ancestor in receiver.Ancestors())
            {
                if (ancestor is AttributeSyntax or ConditionalAccessExpressionSyntax or ElementAccessExpressionSyntax or
                    InitializerExpressionSyntax or InterpolatedStringExpressionSyntax or CollectionExpressionSyntax or
                    QueryExpressionSyntax or PatternSyntax or WhenClauseSyntax or RefExpressionSyntax or AwaitExpressionSyntax)
                {
                    return true;
                }

                if (ancestor is ArgumentSyntax argument && (!argument.RefKindKeyword.IsKind(SyntaxKind.None) ||
                    argument.Parent is not ArgumentListSyntax list || list.Parent is not
                        (InvocationExpressionSyntax or ObjectCreationExpressionSyntax or ImplicitObjectCreationExpressionSyntax or ConstructorInitializerSyntax)))
                {
                    return true;
                }
                // Implicit extension GetEnumerator/GetAsyncEnumerator can observe
                // COLLECTION source via CAE. Their capture does not include body
                // occurrences. Continue past lambdas to inspect every ancestor.
                if (ancestor is CommonForEachStatementSyntax loop && loop.Expression.Span.Contains(receiver.Span))
                {
                    return true;
                }
                // Optional-CAE deconstruct patterns are rejected by the compiler;
                // keep this unneeded context conservative in the first slice.
                if (ancestor is AssignmentExpressionSyntax assignment && (assignment.Left is TupleExpressionSyntax or DeclarationExpressionSyntax) &&
                    assignment.Right.Span.Contains(receiver.Span))
                {
                    return true;
                }
            }
            return false;
        }

        internal static bool KeepsTokenBoundaries(ExpressionSyntax original, ExpressionSyntax replacement)
        {
            static bool Separator(SyntaxTriviaList trivia) => trivia.Any(static item => item.FullSpan.Length != 0 &&
                item.Kind() is SyntaxKind.WhitespaceTrivia or SyntaxKind.EndOfLineTrivia or SyntaxKind.SingleLineCommentTrivia or SyntaxKind.MultiLineCommentTrivia);
            var actual = replacement.WithTriviaFrom(original);
            var previous = original.GetFirstToken().GetPreviousToken(); var next = original.GetLastToken().GetNextToken();
            return (Separator(previous.TrailingTrivia) || Separator(actual.GetLeadingTrivia()) || ParenthesesSyntaxFacts.TokensStaySeparate(previous, actual.GetFirstToken())) &&
                (Separator(actual.GetTrailingTrivia()) || Separator(next.LeadingTrivia) || ParenthesesSyntaxFacts.TokensStaySeparate(actual.GetLastToken(), next));
        }

        internal static BaseMethodDeclarationSyntax? OuterExecutableUnit(SyntaxNode receiver)
        {
            var unit = receiver.Ancestors().OfType<BaseMethodDeclarationSyntax>().LastOrDefault();
            SyntaxNode? body = unit switch
            {
                MethodDeclarationSyntax method => (SyntaxNode?)method.Body ?? method.ExpressionBody,
                ConstructorDeclarationSyntax constructor => (SyntaxNode?)constructor.Body ?? constructor.ExpressionBody,
                _ => null
            };
            return body != null && body.Span.Contains(receiver.Span) ? unit : null;
        }

        internal static bool SameUnit(BaseMethodDeclarationSyntax original, SyntaxNode variant)
        {
            if (variant.RawKind != original.RawKind || variant.Span != original.Span || variant.ContainsDiagnostics ||
                !SyntaxFactory.AreEquivalent(original, variant, static _ => false))
            {
                return false;
            }
            // Physical text alone can reconstruct the same file while changing
            // active/disabled syntax. Compare the complete active structure and
            // raw token coordinates, not only top-level headers or FullString.
            return original.DescendantTokens().Select(static token => (token.RawKind, token.SpanStart, token.Span.Length, token.Text))
                .SequenceEqual(variant.DescendantTokens().Select(static token => (token.RawKind, token.SpanStart, token.Span.Length, token.Text)));
        }

        // Original call-observation facts are reusable only in invariant ACTIVE
        // methods. Disabled text needs a separate source-observation certificate:
        // an active lambda/argument can capture that text even with another overload.
        internal static bool CanProveBranchLocalMethod(ExpressionSyntax receiver, MemberAccessExpressionSyntax member,
            BaseMethodDeclarationSyntax unit, SyntaxNode[] roots, TextSpan prefix)
        {
            if (unit is not MethodDeclarationSyntax { Body: not null } method ||
                member.Parent is not InvocationExpressionSyntax call || call.Expression != member ||
                !method.Body.Span.Contains(call.Span) || HasHardSourceContext(receiver) ||
                receiver.Ancestors().TakeWhile(node => node != method).Any(node => node is
                    AnonymousFunctionExpressionSyntax or LocalFunctionStatementSyntax or ArgumentSyntax or AttributeArgumentSyntax))
            {
                return false;
            }

            var hasInactiveRoot = false;
            foreach (var root in roots)
            {
                if (root.FindNode(unit.Span, getInnermostNodeForTie: true) is not MethodDeclarationSyntax { Body: not null } variant ||
                    variant.Span != method.Span || variant.ContainsDiagnostics || !variant.Body.Span.Contains(call.Span))
                {
                    return false;
                }

                if (SameOccurrence(receiver, member, root, prefix))
                {
                    if (!SameUnit(method, variant))
                    {
                        return false;
                    }
                }
                else
                {
                    if (!HasUnobservedDisabledCall(call, root, prefix))
                    {
                        return false;
                    }

                    hasInactiveRoot = true;
                }
            }
            return hasInactiveRoot;
        }

        internal static bool HasUnobservedDisabledCall(InvocationExpressionSyntax call, SyntaxNode root, TextSpan prefix)
        {
            if (prefix.Length == 0 || !call.Span.Contains(prefix) ||
                !root.DescendantTrivia().Any(trivia => trivia.IsKind(SyntaxKind.DisabledTextTrivia) && trivia.Span.Contains(call.Span)))
            {
                return false;
            }

            var tree = root.SyntaxTree;
            var line = tree.GetLineSpan(prefix);
            if (line.StartLinePosition.Line != line.EndLinePosition.Line ||
                tree.GetLineVisibility(prefix.Start) != LineVisibility.Visible ||
                tree.GetLineVisibility(prefix.End - 1) != LineVisibility.Visible)
            {
                return false;
            }
            // Deliberately stronger than checking selected CAE attributes: reject
            // ANY active expression enclosing/intersecting the edit. This includes
            // implicit handler/foreach contexts and lambdas introduced only here.
            return !root.DescendantNodes().Any(node =>
                (node is ExpressionSyntax or ArgumentSyntax or AttributeArgumentSyntax or LocalFunctionStatementSyntax) &&
                node.Span.OverlapsWith(prefix));
        }

        internal static bool SameOccurrence(ExpressionSyntax original, MemberAccessExpressionSyntax member, SyntaxNode root, TextSpan prefix)
        {
            var candidate = root.FindNode(original.Span, getInnermostNodeForTie: true);
            if (candidate.RawKind != original.RawKind || candidate.Span != original.Span ||
                !SyntaxFactory.AreEquivalent(original, candidate, static _ => false) ||
                candidate.Parent is not MemberAccessExpressionSyntax access || access.Expression != candidate ||
                access.RawKind != member.RawKind || access.Span != member.Span ||
                !SyntaxFactory.AreEquivalent(member, access, static _ => false))
            {
                return false;
            }

            var tree = root.SyntaxTree;
            var line = tree.GetLineSpan(prefix);
            return prefix.Length != 0 && line.StartLinePosition.Line == line.EndLinePosition.Line &&
                tree.GetLineVisibility(prefix.Start) == LineVisibility.Visible &&
                tree.GetLineVisibility(prefix.End - 1) == LineVisibility.Visible;
        }
    }
}

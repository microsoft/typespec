// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using static Microsoft.TypeSpec.Generator.ParenthesesSyntaxFacts;

namespace Microsoft.TypeSpec.Generator
{
    // Bounded, non-reassociating slice of Roslyn's MIT-licensed
    // ParenthesizedExpressionSyntaxExtensions. No semantic inference/reassociation.
    internal static class StructuralParenthesesRules
    {
        internal static bool SupportsTrivia(ParenthesizedExpressionSyntax wrapper) =>
            !wrapper.ContainsDiagnostics && !wrapper.ContainsDirectives && !wrapper.OpenParenToken.IsMissing && !wrapper.CloseParenToken.IsMissing &&
            wrapper.DescendantTrivia().All(static trivia => trivia.Kind() is SyntaxKind.WhitespaceTrivia or SyntaxKind.EndOfLineTrivia or
                SyntaxKind.SingleLineCommentTrivia or SyntaxKind.MultiLineCommentTrivia);

        private static bool SupportsPayload(ExpressionSyntax payload) => !payload.ContainsDiagnostics && !payload.ContainsDirectives &&
            !payload.IsKind(SyntaxKind.DefaultLiteralExpression) &&
            (payload is BinaryExpressionSyntax && Precedence(payload) > 0 || payload is IsPatternExpressionSyntax or ConditionalExpressionSyntax or
                IdentifierNameSyntax or LiteralExpressionSyntax or InvocationExpressionSyntax or ElementAccessExpressionSyntax or
                ObjectCreationExpressionSyntax or TypeOfExpressionSyntax or SizeOfExpressionSyntax or ThisExpressionSyntax or CastExpressionSyntax ||
                payload is MemberAccessExpressionSyntax member && member.IsKind(SyntaxKind.SimpleMemberAccessExpression));

        internal static bool CanRemove(ParenthesizedExpressionSyntax outer, ExpressionSyntax payload)
        {
            if (!SupportsPayload(payload)) return false;
            // Always retain cast operands, receivers/targets and uncertain roles.
            // In particular an alias-qualified cast type may already have shortened.
            switch (outer.Parent)
            {
                case IfStatementSyntax node: return node.Condition == outer;
                case WhileStatementSyntax node: return node.Condition == outer;
                case DoStatementSyntax node: return node.Condition == outer;
                case ForStatementSyntax node: return node.Condition == outer;
                case ReturnStatementSyntax node: return node.Expression == outer;
                case YieldStatementSyntax node: return node.Expression == outer && node.IsKind(SyntaxKind.YieldReturnStatement);
                case ThrowStatementSyntax node: return node.Expression == outer;
                case SwitchStatementSyntax node: return node.Expression == outer;
                case EqualsValueClauseSyntax node: return node.Value == outer && node.Parent is not ParameterSyntax;
                case ArrowExpressionClauseSyntax node: return node.Expression == outer;
                case CommonForEachStatementSyntax node: return node.Expression == outer;
                case LockStatementSyntax node: return node.Expression == outer;
                case UsingStatementSyntax node: return node.Expression == outer;
                case CatchFilterClauseSyntax node: return node.FilterExpression == outer;
                case CheckedExpressionSyntax node: return node.Expression == outer;
                case AssignmentExpressionSyntax node: return node.Right == outer && Precedence(payload) > 2;
                case ConditionalExpressionSyntax node: return node.Condition == outer && Precedence(payload) > 2;
                case ArgumentSyntax node:
                    return node.Expression == outer && node.RefKindKeyword.IsKind(SyntaxKind.None) &&
                        node.Parent is ArgumentListSyntax list && list.Parent is InvocationExpressionSyntax or ObjectCreationExpressionSyntax;
                case BinaryExpressionSyntax node:
                    // Relational comma-list ambiguities need more than precedence.
                    if (node.IsKind(SyntaxKind.LessThanExpression) || node.IsKind(SyntaxKind.GreaterThanExpression)) return false;
                    var child = Precedence(payload); var parent = Precedence(node);
                    if (child <= 0 || parent <= 0) return false;
                    if (child != parent) return child > parent;
                    return node.IsKind(SyntaxKind.CoalesceExpression) ? node.Right == outer : node.Left == outer;
                default: return false;
            }
        }

        internal static ExpressionSyntax Remove(IReadOnlyList<ParenthesizedExpressionSyntax> chain, ExpressionSyntax payload)
        {
            var leading = new List<SyntaxTrivia>();
            foreach (var wrapper in chain)
            {
                leading.AddRange(wrapper.OpenParenToken.LeadingTrivia);
                leading.AddRange(wrapper.OpenParenToken.TrailingTrivia);
            }
            leading.AddRange(payload.GetLeadingTrivia());
            var trailing = new List<SyntaxTrivia>(payload.GetTrailingTrivia());
            for (var index = chain.Count - 1; index >= 0; index--)
            {
                trailing.AddRange(chain[index].CloseParenToken.LeadingTrivia);
                trailing.AddRange(chain[index].CloseParenToken.TrailingTrivia);
            }
            return payload.WithLeadingTrivia(leading).WithTrailingTrivia(trailing);
        }

        internal static bool KeepsTokenBoundaries(ParenthesizedExpressionSyntax outer, ExpressionSyntax replacement)
        {
            static bool Separator(SyntaxTriviaList trivia) => trivia.Any(static item => item.FullSpan.Length != 0 &&
                item.Kind() is SyntaxKind.WhitespaceTrivia or SyntaxKind.EndOfLineTrivia or SyntaxKind.SingleLineCommentTrivia or SyntaxKind.MultiLineCommentTrivia);
            var previous = outer.OpenParenToken.GetPreviousToken();
            var next = outer.CloseParenToken.GetNextToken();
            return (Separator(previous.TrailingTrivia) || Separator(replacement.GetLeadingTrivia()) || TokensStaySeparate(previous, replacement.GetFirstToken())) &&
                (Separator(replacement.GetTrailingTrivia()) || Separator(next.LeadingTrivia) || TokensStaySeparate(replacement.GetLastToken(), next));
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Microsoft.TypeSpec.Generator
{
    // Shared pure facts. Legacy admission/text planning remains unchanged; the
    // structural consumer applies its own occurrence and composed-output proof.
    internal static class ParenthesesSyntaxFacts
    {
        internal static bool TokensStaySeparate(SyntaxToken left, SyntaxToken right)
        {
            if (left.RawKind == 0 || right.RawKind == 0) return true;
            var parsed = SyntaxFactory.ParseTokens(left.Text + right.Text).Where(static t => !t.IsKind(SyntaxKind.EndOfFileToken)).ToArray();
            return parsed.Length == 2 && parsed[0].RawKind == left.RawKind && parsed[0].Text == left.Text &&
                parsed[1].RawKind == right.RawKind && parsed[1].Text == right.Text;
        }

        internal static int Precedence(ExpressionSyntax expression) => expression.Kind() switch
        {
            SyntaxKind.MultiplyExpression or SyntaxKind.DivideExpression or SyntaxKind.ModuloExpression => 13,
            SyntaxKind.AddExpression or SyntaxKind.SubtractExpression => 12,
            SyntaxKind.LeftShiftExpression or SyntaxKind.RightShiftExpression or SyntaxKind.UnsignedRightShiftExpression => 11,
            SyntaxKind.LessThanExpression or SyntaxKind.GreaterThanExpression or SyntaxKind.LessThanOrEqualExpression or SyntaxKind.GreaterThanOrEqualExpression or
                SyntaxKind.IsExpression or SyntaxKind.AsExpression or SyntaxKind.IsPatternExpression => 10,
            SyntaxKind.EqualsExpression or SyntaxKind.NotEqualsExpression => 9,
            SyntaxKind.BitwiseAndExpression => 8,
            SyntaxKind.ExclusiveOrExpression => 7,
            SyntaxKind.BitwiseOrExpression => 6,
            SyntaxKind.LogicalAndExpression => 5,
            SyntaxKind.LogicalOrExpression => 4,
            SyntaxKind.CoalesceExpression => 3,
            SyntaxKind.ConditionalExpression => 2,
            SyntaxKind.CastExpression => 14,
            _ => expression is IdentifierNameSyntax or LiteralExpressionSyntax or MemberAccessExpressionSyntax or InvocationExpressionSyntax or
                ElementAccessExpressionSyntax or ObjectCreationExpressionSyntax or TypeOfExpressionSyntax or SizeOfExpressionSyntax or DefaultExpressionSyntax or ThisExpressionSyntax ? 16 : 0
        };
    }
}

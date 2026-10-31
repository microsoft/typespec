// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Microsoft.TypeSpec.Generator
{
    // Shared receiver materialization safety, independent of symbol selection.
    internal static class ExpressionReceiverSyntaxFacts
    {
        internal static bool ExposesContextualRoot(ExpressionSyntax expression)
        {
            var first = expression.GetFirstToken();
            // field is explicit because the older compiler API may not classify
            // syntax that a newer C# 14 consumer will parse as a backing-field use.
            return first.Text == first.ValueText && (SyntaxFacts.GetContextualKeywordKind(first.ValueText) != SyntaxKind.None ||
                first.ValueText == "field");
        }

        internal static bool MayExposeCastParse(SyntaxNode receiver)
        {
            // Conservative form of Roslyn's (MIT) member-access cast-parse
            // guard: inspect the full enclosing chain and keep hazardous follow
            // tokens. This does not remove or rewrite the parentheses.
            SyntaxNode chain = receiver;
            while (chain.Parent is MemberAccessExpressionSyntax parent && parent.Expression == chain)
            {
                chain = parent;
            }

            if (chain.Parent is not ParenthesizedExpressionSyntax parentheses)
            {
                return false;
            }

            var next = parentheses.GetLastToken().GetNextToken().Kind();
            return next is SyntaxKind.TildeToken or SyntaxKind.ExclamationToken or SyntaxKind.OpenParenToken ||
                SyntaxFacts.IsKeywordKind(next) && next is not (SyntaxKind.AsKeyword or SyntaxKind.IsKeyword);
        }
    }
}

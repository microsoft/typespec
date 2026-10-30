// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;

namespace Microsoft.TypeSpec.Generator
{
    // Syntax-only conditional certificate. Binding and source observations are still
    // checked at the original occurrence by StructuralTypeNameReducer.
    internal static class StructuralOptionalReceiverRules
    {
        internal static bool SameStatementScope(MethodDeclarationSyntax original, SyntaxNode variant, ExpressionSyntax receiver)
        {
            if (variant is not MethodDeclarationSyntax next || original.Body == null || next.Body == null ||
                original.Span != next.Span || next.ContainsDiagnostics)
            {
                return false;
            }
            // Deliberately start with the SDK's direct method-body if condition.
            // Do not admit lambdas, local functions or nested statement shapes here.
            IfStatementSyntax? statement = null;
            foreach (var item in original.Body.Statements)
            {
                if (item is IfStatementSyntax condition && condition.Condition.Span.Contains(receiver.Span))
                {
                    statement = condition;
                }
            }

            if (statement == null)
            {
                return false;
            }

            return Same(original, next, statement.Span);
        }

        private static bool Same(SyntaxNodeOrToken original, SyntaxNodeOrToken next, TextSpan affected)
        {
            if (original.RawKind != next.RawKind || original.Span != next.Span || original.IsToken != next.IsToken)
            {
                return false;
            }

            if (original.IsToken)
            {
                return original.AsToken().Text == next.AsToken().Text;
            }
            // A later nested block cannot export its local declarations into the
            // earlier condition. Its enclosing statement/header remains compared.
            // In particular, later declarations in the METHOD BODY are NOT skipped:
            // their scope can cover the earlier Optional occurrence too.
            if (original.AsNode() is BlockSyntax && original.Span.Start >= affected.End)
            {
                return true;
            }

            var before = original.AsNode()!.ChildNodesAndTokens();
            var after = next.AsNode()!.ChildNodesAndTokens();
            if (before.Count != after.Count)
            {
                return false;
            }

            for (var index = 0; index < before.Count; index++)
            {
                if (!Same(before[index], after[index], affected))
                {
                    return false;
                }
            }

            return true;
        }
    }
}

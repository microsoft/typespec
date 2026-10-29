// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using static Microsoft.TypeSpec.Generator.ParenthesesSyntaxFacts;

namespace Microsoft.TypeSpec.Generator
{
    internal static class ProviderSyntaxCleanup
    {
        internal static void AddEdits(IReadOnlyList<SyntaxNode> roots, Compilation compilation, string namespaceName,
            IEnumerable<string> aliases, List<TextSpan> edits)
        {
            var lexical = new HashSet<string>(aliases, StringComparer.Ordinal) { "value", "field" };
            foreach (var root in roots)
            foreach (var node in root.DescendantNodes())
            {
                var token = node switch
                {
                    ParameterSyntax p => p.Identifier,
                    TypeParameterSyntax p => p.Identifier,
                    BaseTypeDeclarationSyntax t => t.Identifier,
                    DelegateDeclarationSyntax d => d.Identifier,
                    LocalFunctionStatementSyntax f => f.Identifier,
                    VariableDeclaratorSyntax v when v.Parent?.Parent is not BaseFieldDeclarationSyntax => v.Identifier,
                    SingleVariableDesignationSyntax d => d.Identifier,
                    CatchDeclarationSyntax c => c.Identifier,
                    ForEachStatementSyntax f => f.Identifier,
                    FromClauseSyntax c => c.Identifier,
                    LetClauseSyntax c => c.Identifier,
                    JoinClauseSyntax c => c.Identifier,
                    JoinIntoClauseSyntax c => c.Identifier,
                    QueryContinuationSyntax c => c.Identifier,
                    _ => default
                };
                if (!token.IsKind(SyntaxKind.None)) lexical.Add(token.ValueText);
            }
            var members = new Dictionary<string, HashSet<string>?>(StringComparer.Ordinal);
            foreach (var root in roots)
            foreach (var node in root.DescendantNodes())
            {
                if (node is ParenthesizedExpressionSyntax expression && !expression.Ancestors().Any(static parent => parent is ParenthesizedExpressionSyntax))
                {
                    var chain = new List<ParenthesizedExpressionSyntax>();
                    ExpressionSyntax payload = expression;
                    while (payload is ParenthesizedExpressionSyntax wrapper) { chain.Add(wrapper); payload = wrapper.Expression; }
                    var removeAll = SafeExpression(payload) && CanRemove(expression, payload);
                    // Retained chains can be cast-disambiguating: ((f))(1).
                    if (!removeAll || !SafeBoundaries(chain[0].OpenParenToken, chain[^1].OpenParenToken,
                        payload, chain[^1].CloseParenToken, chain[0].CloseParenToken)) continue;
                    foreach (var wrapper in chain)
                    {
                        if (wrapper.ContainsDiagnostics || wrapper.ContainsDirectives || wrapper.OpenParenToken.IsMissing || wrapper.CloseParenToken.IsMissing) continue;
                        edits.Add(wrapper.OpenParenToken.Span); edits.Add(wrapper.CloseParenToken.Span);
                    }
                }
                else if (node is ParenthesizedPatternSyntax pattern && !pattern.Ancestors().Any(static parent => parent is ParenthesizedPatternSyntax or ParenthesizedExpressionSyntax))
                {
                    var chain = new List<ParenthesizedPatternSyntax>();
                    PatternSyntax payload = pattern;
                    while (payload is ParenthesizedPatternSyntax wrapper) { chain.Add(wrapper); payload = wrapper.Pattern; }
                    if (!SafePattern(payload)) continue;
                    var removeAll = pattern.Parent is IsPatternExpressionSyntax or CasePatternSwitchLabelSyntax or SwitchExpressionArmSyntax or SubpatternSyntax ||
                        pattern.Parent is BinaryPatternSyntax binary && PatternPrecedence(payload) >= PatternPrecedence(binary) ||
                        pattern.Parent is UnaryPatternSyntax && PatternPrecedence(payload) > 2;
                    if (!removeAll || !SafeBoundaries(chain[0].OpenParenToken, chain[^1].OpenParenToken,
                        payload, chain[^1].CloseParenToken, chain[0].CloseParenToken)) continue;
                    foreach (var wrapper in chain)
                    {
                        if (wrapper.ContainsDiagnostics || wrapper.ContainsDirectives) continue;
                        edits.Add(wrapper.OpenParenToken.Span); edits.Add(wrapper.CloseParenToken.Span);
                    }
                }
                else if (node is MemberAccessExpressionSyntax { Expression: ThisExpressionSyntax, Name: IdentifierNameSyntax name } member)
                {
                    var identifier = name.Identifier.ValueText;
                    if (identifier == "Object" || lexical.Contains(identifier) || SyntaxFacts.GetContextualKeywordKind(identifier) != SyntaxKind.None ||
                        member.Parent is InvocationExpressionSyntax call && call.Expression == member || member.ContainsDiagnostics || member.ContainsDirectives) continue;
                    var declaration = member.Ancestors().OfType<TypeDeclarationSyntax>().FirstOrDefault();
                    if (declaration == null) continue;
                    var names = declaration.AncestorsAndSelf().OfType<TypeDeclarationSyntax>().Reverse().Select(static d =>
                        d.Identifier.ValueText + (d.TypeParameterList is { } p ? "`" + p.Parameters.Count : string.Empty));
                    var metadata = (namespaceName.Length == 0 ? string.Empty : namespaceName + ".") + string.Join("+", names);
                    if (!members.TryGetValue(metadata, out var eligible))
                    {
                        var type = compilation.GetTypeByMetadataName(metadata);
                        eligible = EligibleMembers(type, compilation);
                        members.Add(metadata, eligible);
                    }
                    if (eligible?.Contains(identifier) != true) continue;
                    var prefix = TextSpan.FromBounds(member.SpanStart, name.SpanStart);
                    // Do not erase comments or directives attached to this/dot.
                    if (root.SyntaxTree.GetText().ToString(prefix) != "this.") continue;
                    edits.Add(prefix);
                }
            }
        }

        private static HashSet<string>? EligibleMembers(INamedTypeSymbol? type, Compilation compilation)
        {
            if (type == null || type.DeclaringSyntaxReferences.Any(static reference =>
                reference.GetSyntax().ChildNodes().OfType<ParameterListSyntax>().Any())) return null;
            var groups = new Dictionary<string, List<ISymbol>>(StringComparer.Ordinal);
            for (var current = type; current != null; current = current.BaseType)
            {
                if (current.TypeKind == TypeKind.Error) return null;
                foreach (var member in current.GetMembers())
                {
                    if (!groups.TryGetValue(member.Name, out var list)) groups.Add(member.Name, list = new List<ISymbol>());
                    list.Add(member);
                }
            }
            var result = new HashSet<string>(StringComparer.Ordinal);
            foreach (var (name, values) in groups)
            {
                if (values.Count != 1) continue;
                var member = values[0];
                if (member.IsStatic || !compilation.IsSymbolAccessibleWithin(member, type)) continue;
                if (member is IFieldSymbol || member is IPropertySymbol { IsIndexer: false, ExplicitInterfaceImplementations.Length: 0 }) result.Add(name);
            }
            return result;
        }

        private static bool SafeBoundaries(SyntaxToken outerOpen, SyntaxToken innerOpen, SyntaxNode payload, SyntaxToken innerClose, SyntaxToken outerClose)
        {
            var first = payload.GetFirstToken(); var last = payload.GetLastToken();
            var previous = outerOpen.GetPreviousToken(); var next = outerClose.GetNextToken();
            var separatedLeft = previous.HasTrailingTrivia || outerOpen.HasLeadingTrivia || innerOpen.HasTrailingTrivia || first.HasLeadingTrivia;
            var separatedRight = last.HasTrailingTrivia || innerClose.HasLeadingTrivia || outerClose.HasTrailingTrivia || next.HasLeadingTrivia;
            return (separatedLeft || TokensStaySeparate(previous, first)) && (separatedRight || TokensStaySeparate(last, next));
        }

        private static bool SafeExpression(ExpressionSyntax expression) => !expression.ContainsDiagnostics && !expression.ContainsDirectives &&
            (expression is BinaryExpressionSyntax && Precedence(expression) > 0 || expression is IsPatternExpressionSyntax or CastExpressionSyntax or
             ConditionalExpressionSyntax or IdentifierNameSyntax or LiteralExpressionSyntax or MemberAccessExpressionSyntax or InvocationExpressionSyntax or
             ElementAccessExpressionSyntax or ObjectCreationExpressionSyntax or TypeOfExpressionSyntax or SizeOfExpressionSyntax or DefaultExpressionSyntax or ThisExpressionSyntax);

        private static bool CanRemove(ParenthesizedExpressionSyntax wrapper, ExpressionSyntax payload)
        {
            switch (wrapper.Parent)
            {
                case IfStatementSyntax s: return s.Condition == wrapper;
                case WhileStatementSyntax s: return s.Condition == wrapper;
                case DoStatementSyntax s: return s.Condition == wrapper;
                case ForStatementSyntax s: return s.Condition == wrapper;
                case ReturnStatementSyntax s: return s.Expression == wrapper;
                case YieldStatementSyntax s: return s.Expression == wrapper;
                case ThrowStatementSyntax s: return s.Expression == wrapper;
                case SwitchStatementSyntax s: return s.Expression == wrapper;
                case EqualsValueClauseSyntax s: return s.Value == wrapper;
                case ArrowExpressionClauseSyntax s: return s.Expression == wrapper;
                case CommonForEachStatementSyntax s: return s.Expression == wrapper;
                case LockStatementSyntax s: return s.Expression == wrapper;
                case UsingStatementSyntax s: return s.Expression == wrapper;
                case CatchFilterClauseSyntax s: return s.FilterExpression == wrapper;
                case CheckedExpressionSyntax s: return s.Expression == wrapper;
                case ArgumentSyntax s:
                    return s.Expression == wrapper && s.Parent?.Parent is InvocationExpressionSyntax or ObjectCreationExpressionSyntax &&
                        !payload.DescendantNodesAndSelf().Any(static n => n.IsKind(SyntaxKind.LessThanExpression) || n.IsKind(SyntaxKind.GreaterThanExpression));
                case AssignmentExpressionSyntax s: return s.Right == wrapper && Precedence(payload) > 1;
                case ConditionalExpressionSyntax s: return s.Condition == wrapper && Precedence(payload) > 2;
                case BinaryExpressionSyntax s:
                    var child = Precedence(payload); var parent = Precedence(s);
                    if (child <= 0 || parent <= 0) return false;
                    if (child != parent) return child > parent;
                    return s.IsKind(SyntaxKind.CoalesceExpression) ? s.Right == wrapper : s.Left == wrapper;
                default: return false;
            }
        }

        private static bool SafePattern(PatternSyntax pattern) => pattern switch
        {
            ParenthesizedPatternSyntax p => SafePattern(p.Pattern),
            BinaryPatternSyntax p => SafePattern(p.Left) && SafePattern(p.Right),
            UnaryPatternSyntax p => SafePattern(p.Pattern),
            RelationalPatternSyntax { Expression: LiteralExpressionSyntax } => true,
            ConstantPatternSyntax { Expression: LiteralExpressionSyntax } => true,
            TypePatternSyntax { Type: PredefinedTypeSyntax } => true,
            _ => false
        };
        private static int PatternPrecedence(PatternSyntax pattern) => pattern.Kind() switch
        {
            SyntaxKind.OrPattern => 1,
            SyntaxKind.AndPattern => 2,
            SyntaxKind.NotPattern => 3,
            _ => 4
        };
    }
}

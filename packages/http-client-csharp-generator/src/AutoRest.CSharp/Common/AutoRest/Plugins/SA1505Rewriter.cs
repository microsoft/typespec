// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace AutoRest.CSharp.Common.AutoRest.Plugins
{
    /// <summary>
    /// This Roslyn <see cref="CSharpSyntaxRewriter">CSharpSyntaxRewriter</see> will delete extra newlines after the
    /// open brace of a class/struct/enum definition. It is for resolving <see href="https://github.com/DotNetAnalyzers/StyleCopAnalyzers/blob/master/documentation/SA1505.md">SA1505</see> error.
    /// </summary>
    internal class SA1505Rewriter : CSharpSyntaxRewriter
    {
        public override SyntaxNode? VisitClassDeclaration(ClassDeclarationSyntax node)
            => base.VisitClassDeclaration((ClassDeclarationSyntax)RemoveEOLAfterOpenBrace(node));

        public override SyntaxNode? VisitStructDeclaration(StructDeclarationSyntax node)
            => base.VisitStructDeclaration((StructDeclarationSyntax)RemoveEOLAfterOpenBrace(node));

        public override SyntaxNode? VisitEnumDeclaration(EnumDeclarationSyntax node)
            => base.VisitEnumDeclaration((EnumDeclarationSyntax)RemoveEOLAfterOpenBrace(node));

        private BaseTypeDeclarationSyntax RemoveEOLAfterOpenBrace(BaseTypeDeclarationSyntax node)
        {
            // all extra EOL after open brace are the leading trivia of the next token
            var nextToken = node.OpenBraceToken.GetNextToken();
            if (nextToken.IsMissing)
            {
                return node;
            }

            var leadingTrivia = nextToken.LeadingTrivia;
            if (leadingTrivia.Count == 0 || !leadingTrivia[0].IsKind(SyntaxKind.EndOfLineTrivia))
            {
                return node;
            }

            var newLeadingTrvia = leadingTrivia.SkipWhile(t => t.IsKind(SyntaxKind.EndOfLineTrivia));
            var newNextToken = nextToken.WithLeadingTrivia(newLeadingTrvia);
            return node.ReplaceToken(nextToken, newNextToken);
        }
    }
}

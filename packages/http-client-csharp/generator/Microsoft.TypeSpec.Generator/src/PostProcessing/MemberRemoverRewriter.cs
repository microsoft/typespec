// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Microsoft.TypeSpec.Generator
{
    internal class MemberRemoverRewriter : CSharpSyntaxRewriter
    {
        public override SyntaxNode? VisitCompilationUnit(CompilationUnitSyntax node)
        {
            var visitedNode = base.VisitCompilationUnit(node);
            return visitedNode is CompilationUnitSyntax cu && !cu.Members.Any() ? SyntaxFactory.CompilationUnit() : visitedNode;
        }

        public override SyntaxNode? VisitNamespaceDeclaration(NamespaceDeclarationSyntax node)
        {
            var visitedNode = base.VisitNamespaceDeclaration(node);
            return visitedNode is NamespaceDeclarationSyntax ns && !ns.Members.Any() ? null : visitedNode;
        }
    }
}

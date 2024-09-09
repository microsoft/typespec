// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Microsoft.Generator.CSharp
{
    internal class MemberRemoverRewriter : CSharpSyntaxRewriter
    {
        private readonly Project _project;
        private readonly SemanticModel _semanticModel;

        public MemberRemoverRewriter(Project project, SemanticModel semanticModel)
        {
            _project = project;
            _semanticModel = semanticModel;
        }

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

        public override SyntaxNode? VisitConstructorDeclaration(ConstructorDeclarationSyntax node)
        {
            var symbol = _semanticModel.GetDeclaredSymbol(node);
            return ShouldRemoveMember(symbol) ? null : base.VisitConstructorDeclaration(node);
        }

        public override SyntaxNode? VisitPropertyDeclaration(PropertyDeclarationSyntax node)
        {
            var symbol = _semanticModel.GetDeclaredSymbol(node);
            return ShouldRemoveMember(symbol) ? null : base.VisitPropertyDeclaration(node);
        }

        public override SyntaxNode? VisitMethodDeclaration(MethodDeclarationSyntax node)
        {
            var symbol = _semanticModel.GetDeclaredSymbol(node);
            return ShouldRemoveMember(symbol) ? null : base.VisitMethodDeclaration(node);
        }

        public override SyntaxNode? VisitOperatorDeclaration(OperatorDeclarationSyntax node)
        {
            var symbol = _semanticModel.GetDeclaredSymbol(node);
            return ShouldRemoveMember(symbol) ? null : base.VisitOperatorDeclaration(node);
        }

        public override SyntaxNode? VisitConversionOperatorDeclaration(ConversionOperatorDeclarationSyntax node)
        {
            var symbol = _semanticModel.GetDeclaredSymbol(node);
            return ShouldRemoveMember(symbol) ? null : base.VisitConversionOperatorDeclaration(node);
        }

        public override SyntaxNode? VisitFieldDeclaration(FieldDeclarationSyntax node)
        {
            var symbol = node.Declaration.Variables.Count == 1
                ? _semanticModel.GetDeclaredSymbol(node.Declaration.Variables[0])
                : null;

            return ShouldRemoveMember(symbol) ? null : base.VisitFieldDeclaration(node);
        }

        private bool ShouldRemoveMember(ISymbol? symbol)
        {
            if (symbol != null)
            {
                INamedTypeSymbol? containingType = symbol.ContainingType;
                IMethodSymbol? methodSymbol = symbol as IMethodSymbol;

                while (containingType != null)
                {
                    var members = containingType.GetMembers(symbol.Name);
                    foreach (var member in members)
                    {
                        if (!SymbolEqualityComparer.Default.Equals(member, symbol) &&
                            IsDeclaredInNonGeneratedCode(member))
                        {
                            if (methodSymbol != null &&
                                member is IMethodSymbol memberMethodSymbol &&
                                !methodSymbol.Parameters.SequenceEqual(
                                    memberMethodSymbol.Parameters, (s1, s2) => SymbolEqualityComparer.Default.Equals(s1, s2.Type)))
                            {
                                continue;
                            }

                            return true;
                        }
                    }

                    // Skip traversing parents for constructors and explicit interface implementations
                    if (methodSymbol != null &&
                        (methodSymbol.MethodKind == MethodKind.Constructor ||
                         !methodSymbol.ExplicitInterfaceImplementations.IsEmpty))
                    {
                        break;
                    }
                    containingType = containingType.BaseType;
                }
            }

            return false;
        }

        private bool IsDeclaredInNonGeneratedCode(ISymbol member)
        {
            var references = member.DeclaringSyntaxReferences;

            if (references.Length == 0)
            {
                return false;
            }

            foreach (var reference in references)
            {
                Document? document = _project.GetDocument(reference.SyntaxTree);

                if (document != null && GeneratedCodeWorkspace.IsGeneratedDocument(document))
                {
                    return false;
                }
            }

            return true;
        }

        private readonly struct Supression
        {
            private readonly string? _name;
            private readonly ISymbol?[] _types;

            public Supression(string? name, ISymbol?[] types)
            {
                _name = name;
                _types = types;
            }

            public bool Matches(ISymbol symbol)
            {
                if (symbol is IMethodSymbol methodSymbol)
                {
                    string name = methodSymbol.Name;
                    // Use friendly name for ctors
                    if (methodSymbol.MethodKind == MethodKind.Constructor)
                    {
                        name = methodSymbol.ContainingType.Name;
                    }

                    return  _name == name &&
                            _types.SequenceEqual(methodSymbol.Parameters.Select(p => p.Type), SymbolEqualityComparer.Default);
                }
                else
                {
                    return symbol.Name == _name;
                }
            }
        }
    }
}

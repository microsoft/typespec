// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.Generator.CSharp.SourceInput;

namespace Microsoft.Generator.CSharp
{
#pragma warning disable RS1024
    internal class MemberRemoverRewriter : CSharpSyntaxRewriter
    {
        private static readonly SymbolDisplayFormat _fullyQualifiedNameFormat
            = new SymbolDisplayFormat(typeQualificationStyle: SymbolDisplayTypeQualificationStyle.NameAndContainingTypesAndNamespaces);

        private readonly Project _project;
        private readonly SemanticModel _semanticModel;
        private readonly Dictionary<INamedTypeSymbol, List<Supression>> _suppressionCache;

        public MemberRemoverRewriter(Project project, SemanticModel semanticModel)
        {
            _project = project;
            _semanticModel = semanticModel;
            _suppressionCache = new Dictionary<INamedTypeSymbol, List<Supression>>();
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

        private List<Supression>? GetSuppressions(INamedTypeSymbol namedTypeSymbol)
        {
            if (_suppressionCache.TryGetValue(namedTypeSymbol, out var suppressions))
            {
                return suppressions;
            }

            foreach (var attributeData in namedTypeSymbol.GetAttributes())
            {
                if (attributeData.AttributeClass?.Name.Equals(CodeGenAttributes.CodeGenSuppressAttributeName) == true)
                {
                    ValidateArguments(namedTypeSymbol, attributeData);

                    suppressions ??= new List<Supression>();
                    var name = attributeData.ConstructorArguments[0].Value as string;
                    var parameterTypes = attributeData.ConstructorArguments[1].Values.Select(v => (ISymbol?)v.Value).ToArray();
                    suppressions.Add(new Supression(name, parameterTypes));
                }
            }

            if (suppressions != null)
            {
                _suppressionCache.Add(namedTypeSymbol, suppressions);
            }
            return suppressions;

            static void ValidateArguments(INamedTypeSymbol typeSymbol, AttributeData attributeData)
            {
                var arguments = attributeData.ConstructorArguments;
                if (arguments.Length == 0)
                {
                    var fullName = typeSymbol.ToDisplayString(_fullyQualifiedNameFormat);
                    throw new InvalidOperationException($"CodeGenSuppress attribute on {fullName} must specify a method name as its first argument.");
                }

                if (arguments.Length == 1 || arguments[0].Kind != TypedConstantKind.Primitive || arguments[0].Value is not string)
                {
                    var attribute = GetText(attributeData.ApplicationSyntaxReference);
                    var fullName = typeSymbol.ToDisplayString(_fullyQualifiedNameFormat);
                    throw new InvalidOperationException($"{attribute} attribute on {fullName} must specify a method name as its first argument.");
                }

                if (arguments.Length == 2 && arguments[1].Kind == TypedConstantKind.Array)
                {
                    ValidateTypeArguments(typeSymbol, attributeData, arguments[1].Values);
                }
                else
                {
                    ValidateTypeArguments(typeSymbol, attributeData, arguments.Skip(1));
                }
            }

            static void ValidateTypeArguments(INamedTypeSymbol typeSymbol, AttributeData attributeData, IEnumerable<TypedConstant> arguments)
            {
                foreach (var argument in arguments)
                {
                    if (argument.Kind == TypedConstantKind.Type)
                    {
                        if (argument.Value is IErrorTypeSymbol errorType)
                        {
                            var attribute = GetText(attributeData.ApplicationSyntaxReference);
                            var fileLinePosition = GetFileLinePosition(attributeData.ApplicationSyntaxReference);
                            var filePath = fileLinePosition.Path;
                            var line = fileLinePosition.StartLinePosition.Line + 1;
                            throw new InvalidOperationException($"The undefined type '{errorType.Name}' is referenced in the '{attribute}' attribute ({filePath}, line: {line}). Please define this type or remove it from the attribute.");
                        }
                    }
                    else
                    {
                        var fullName = typeSymbol.ToDisplayString(_fullyQualifiedNameFormat);
                        var attribute = GetText(attributeData.ApplicationSyntaxReference);
                        throw new InvalidOperationException($"Argument '{argument.ToCSharpString()}' in attribute '{attribute}' applied to '{fullName}' must be a type.");
                    }
                }
            }
        }

        public static string GetText(SyntaxReference? syntaxReference)
            => syntaxReference?.SyntaxTree.GetText().ToString(syntaxReference.Span) ?? string.Empty;

        public static FileLinePositionSpan GetFileLinePosition(SyntaxReference? syntaxReference)
            => syntaxReference?.SyntaxTree.GetLocation(syntaxReference.Span).GetLineSpan() ?? default;

        private bool ShouldRemoveMember(ISymbol? symbol)
        {
            if (symbol != null)
            {
                INamedTypeSymbol? containingType = symbol.ContainingType;
                IMethodSymbol? methodSymbol = symbol as IMethodSymbol;

                var suppressions = GetSuppressions(symbol.ContainingType);
                if (suppressions != null)
                {
                    foreach (var suppression in suppressions)
                    {
                        if (suppression.Matches(symbol))
                        {
                            return true;
                        }
                    }
                }

                while (containingType != null)
                {
                    var members = containingType.GetMembers(symbol.Name);
                    foreach (var member in members)
                    {
                        if (!member.Equals(symbol) &&
                            IsDeclaredInNonGeneratedCode(member))
                        {
                            if (methodSymbol != null &&
                                member is IMethodSymbol memberMethodSymbol &&
                                !methodSymbol.Parameters.SequenceEqual(memberMethodSymbol.Parameters, (s1, s2) => s1.Type.Equals(s2.Type)))
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

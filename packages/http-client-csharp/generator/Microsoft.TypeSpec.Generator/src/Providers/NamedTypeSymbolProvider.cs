// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml;
using System.Xml.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal sealed class NamedTypeSymbolProvider : TypeProvider
    {
        private INamedTypeSymbol _namedTypeSymbol;
        private readonly Compilation _compilation;
        private string? _metadataName;
        private TypeProvider? _baseTypeProvider;

        public NamedTypeSymbolProvider(INamedTypeSymbol namedTypeSymbol, Compilation compilation)
        {
            _namedTypeSymbol = namedTypeSymbol;
            _compilation = compilation;
        }

        internal string MetadataName
        {
            get
            {
                if (_metadataName != null)
                {
                    return _metadataName;
                }

                var ns = _namedTypeSymbol.ContainingNamespace.GetFullyQualifiedNameFromDisplayString();
                _metadataName = string.IsNullOrEmpty(ns) ? _namedTypeSymbol.MetadataName : $"{ns}.{_namedTypeSymbol.MetadataName}";
                return _metadataName;
            }
        }

        internal string MetadataSimpleName => _namedTypeSymbol.Name;

        private protected sealed override NamedTypeSymbolProvider? BuildCustomCodeView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => null;
        private protected sealed override TypeProvider? BuildLastContractView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => null;

        protected override string BuildRelativeFilePath() => throw new InvalidOperationException("This type should not be writing in generation");

        protected override string BuildName() => _namedTypeSymbol.Name;

        protected override string BuildNamespace() => _namedTypeSymbol.ContainingNamespace.GetFullyQualifiedNameFromDisplayString();

        protected override IReadOnlyList<AttributeStatement> BuildAttributes()
            => [.._namedTypeSymbol.GetAttributes().Select(a => new AttributeStatement(a))];

        internal override TypeProvider? BaseTypeProvider => _baseTypeProvider ??= BuildBaseTypeProvider();

        protected override CSharpType? BuildBaseType()
        {
            if (ShouldSkipBaseType(_namedTypeSymbol.BaseType))
            {
                return null;
            }

            return _namedTypeSymbol.BaseType!.GetCSharpType();
        }

        private TypeProvider? BuildBaseTypeProvider()
        {
            if (ShouldSkipBaseType(_namedTypeSymbol.BaseType))
            {
                return null;
            }

            return new NamedTypeSymbolProvider(_namedTypeSymbol.BaseType!, _compilation);
        }

        private bool ShouldSkipBaseType(INamedTypeSymbol? baseType)
            => baseType == null
                || baseType.SpecialType == SpecialType.System_Object
                || baseType.SpecialType == SpecialType.System_ValueType
                || baseType.SpecialType == SpecialType.System_Array
                || baseType.SpecialType == SpecialType.System_Enum
                || TypeSymbolExtensions.ContainsTypeAsArgument(baseType, _namedTypeSymbol);

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
        {
            var declaredModifiers = GetAccessModifiers(_namedTypeSymbol.DeclaredAccessibility);
            if (_namedTypeSymbol.IsReadOnly)
            {
                declaredModifiers |= TypeSignatureModifiers.ReadOnly;
            }
            if (_namedTypeSymbol.IsStatic)
            {
                declaredModifiers |= TypeSignatureModifiers.Static;
            }
            if (_namedTypeSymbol.IsAbstract)
            {
                declaredModifiers |= TypeSignatureModifiers.Abstract;
            }
            switch (_namedTypeSymbol.TypeKind)
            {
                case TypeKind.Class:
                    declaredModifiers |= TypeSignatureModifiers.Class;
                    if (_namedTypeSymbol.IsSealed)
                    {
                        declaredModifiers |= TypeSignatureModifiers.Sealed;
                    }
                    break;
                case TypeKind.Enum:
                    declaredModifiers |= TypeSignatureModifiers.Enum;
                    break;
                case TypeKind.Struct:
                    declaredModifiers |= TypeSignatureModifiers.Struct;
                    break;
                case TypeKind.Interface:
                    declaredModifiers |= TypeSignatureModifiers.Interface;
                    break;
            }
            return declaredModifiers;

            static TypeSignatureModifiers GetAccessModifiers(Accessibility accessibility) => accessibility switch
            {
                Accessibility.Private => TypeSignatureModifiers.Private,
                Accessibility.Protected => TypeSignatureModifiers.Protected,
                Accessibility.Internal => TypeSignatureModifiers.Internal,
                Accessibility.Public => TypeSignatureModifiers.Public,
                Accessibility.ProtectedOrInternal => TypeSignatureModifiers.Protected | TypeSignatureModifiers.Internal,
                _ => TypeSignatureModifiers.None
            };
        }

        protected internal override FieldProvider[] BuildFields()
        {
            List<FieldProvider> fields = new List<FieldProvider>();
            foreach (var fieldSymbol in _namedTypeSymbol.GetMembers().OfType<IFieldSymbol>())
            {
                if (!fieldSymbol.Name.EndsWith("k__BackingField"))
                {
                    var modifiers = GetFieldsAccessModifier(fieldSymbol.DeclaredAccessibility);
                    if (fieldSymbol.IsStatic)
                    {
                        modifiers |= FieldModifiers.Static;
                    }

                    var fieldProvider = new FieldProvider(
                        modifiers,
                        fieldSymbol.Type.GetCSharpType(),
                        fieldSymbol.Name,
                        this,
                        GetSymbolXmlDoc(fieldSymbol, "summary"),
                        initializationValue: GetFieldInitializer(fieldSymbol),
                        attributes: fieldSymbol.GetAttributes().Select(a => new AttributeStatement(a)).ToArray())
                    {
                        OriginalName = GetOriginalName(fieldSymbol)
                    };

                    fields.Add(fieldProvider);
                }
            }
            return [.. fields];
        }

        protected internal override PropertyProvider[] BuildProperties()
        {
            List<PropertyProvider> properties = new List<PropertyProvider>();
            foreach (var propertySymbol in _namedTypeSymbol.GetMembers().OfType<IPropertySymbol>())
            {
                var propertyProvider = new PropertyProvider(
                    GetSymbolXmlDoc(propertySymbol, "summary"),
                    GetAccessModifier(propertySymbol.DeclaredAccessibility),
                    propertySymbol.Type.GetCSharpType(),
                    propertySymbol.Name,
                    new AutoPropertyBody(
                        propertySymbol.SetMethod is not null,
                        InitializationExpression: GetPropertyInitializer(propertySymbol)),
                    this,
                    attributes: propertySymbol.GetAttributes().Select(a => new AttributeStatement(a)).ToArray())
                {
                    OriginalName = GetOriginalName(propertySymbol),
                    CustomProvider = new(() => propertySymbol.Type is INamedTypeSymbol propertyNamedTypeSymbol
                        ? new NamedTypeSymbolProvider(propertyNamedTypeSymbol, _compilation)
                        : null)
                };
                properties.Add(propertyProvider);
            }
            return [.. properties];
        }

        private ValueExpression? GetPropertyInitializer(IPropertySymbol propertySymbol)
        {
            var syntaxReference = propertySymbol.DeclaringSyntaxReferences.FirstOrDefault();
            if (syntaxReference?.GetSyntax() is PropertyDeclarationSyntax propertySyntax)
            {
                var initializerValue = propertySyntax.Initializer?.Value;
                if (initializerValue == null)
                {
                    return null;
                }

                // Get the semantic model to evaluate constant values
                var semanticModel = _compilation.GetSemanticModel(propertySyntax.SyntaxTree);
                // Check if this is an enum member access
                var symbolInfo = semanticModel.GetSymbolInfo(initializerValue);
                if (symbolInfo.Symbol is IFieldSymbol fieldSymbol
                    && fieldSymbol.ContainingType?.TypeKind == TypeKind.Enum)
                {
                    var enumType = fieldSymbol.ContainingType.GetCSharpType();
                    return new MemberExpression(TypeReferenceExpression.FromType(enumType), fieldSymbol.Name);
                }

                var constantValue = semanticModel.GetConstantValue(initializerValue);

                if (constantValue.HasValue)
                {
                    return Literal(constantValue.Value);
                }

                // For non-constant expressions, return the expression text
                return Literal(initializerValue.ToString());
            }
            return null;
        }

        private static ValueExpression? GetFieldInitializer(IFieldSymbol fieldSymbol)
        {
            if (fieldSymbol.ContainingType?.TypeKind == TypeKind.Enum)
            {
                if (fieldSymbol.HasConstantValue && fieldSymbol.ConstantValue != null)
                {
                    return Literal(fieldSymbol.ConstantValue);
                }
                return null;
            }

            return null;
        }

        private static string? GetOriginalName(ISymbol symbol)
        {
            var codeGenAttribute = symbol.GetAttributes().SingleOrDefault(
                a => a.AttributeClass?.Name == CodeGenAttributes.CodeGenMemberAttributeName);
            string? originalName = null;
            if (codeGenAttribute != null)
            {
                CodeGenAttributes.TryGetCodeGenMemberAttributeValue(codeGenAttribute, out originalName);
            }

            return originalName;
        }

        protected internal override ConstructorProvider[] BuildConstructors()
        {
            List<ConstructorProvider> constructors = new List<ConstructorProvider>();
            foreach (var constructorSymbol in _namedTypeSymbol.Constructors)
            {
                if (constructorSymbol.IsImplicitlyDeclared)
                {
                    continue;
                }

                var initializer = ExtractConstructorInitializer(constructorSymbol);
                var signature = new ConstructorSignature(
                    Type,
                    GetSymbolXmlDoc(constructorSymbol, "summary"),
                    GetAccessModifier(constructorSymbol.DeclaredAccessibility),
                    [.. constructorSymbol.Parameters.Select(p => ConvertToParameterProvider(constructorSymbol, p))],
                    initializer: initializer);
                constructors.Add(new ConstructorProvider(signature, MethodBodyStatement.Empty, this));
            }
            return [.. constructors];
        }

        protected internal override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();
            foreach (var methodSymbol in _namedTypeSymbol.GetMembers().OfType<IMethodSymbol>())
            {
                // skip property accessors
                if (methodSymbol.AssociatedSymbol is IPropertySymbol)
                {
                    continue;
                }

                // skip constructors
                if (methodSymbol.MethodKind == MethodKind.Constructor)
                {
                    continue;
                }

                var modifiers = GetAccessModifier(methodSymbol.DeclaredAccessibility);

                // We want the simple name for the method, not the full name which matches the behavior for generated types
                var format = new SymbolDisplayFormat(
                    memberOptions: SymbolDisplayMemberOptions.None,
                    kindOptions: SymbolDisplayKindOptions.None);

                AddAdditionalModifiers(methodSymbol, ref modifiers);

                bool isPartialDeclaration = IsPartialMethodDeclaration(methodSymbol);
                if (isPartialDeclaration)
                {
                    modifiers |= MethodSignatureModifiers.Partial;
                }

                var explicitInterface = methodSymbol.ExplicitInterfaceImplementations.FirstOrDefault();

                // For conversion operators, use the target type name as the method name to match generated code
                string methodName;
                if (methodSymbol.MethodKind == MethodKind.Conversion)
                {
                    // Use the return type name for conversion operators (explicit/implicit)
                    methodName = methodSymbol.ReturnType.Name;
                }
                else
                {
                    methodName = methodSymbol.ToDisplayString(format);
                }

                var signature = new MethodSignature(
                    methodName,
                    GetSymbolXmlDoc(methodSymbol, "summary"),
                    // remove private modifier for explicit interface implementations
                    explicitInterface != null ? modifiers & ~MethodSignatureModifiers.Private : modifiers,
                    GetNullableCSharpType(methodSymbol.ReturnType),
                    GetSymbolXmlDoc(methodSymbol, "returns"),
                    [.. methodSymbol.Parameters.Select(p => ConvertToParameterProvider(methodSymbol, p))],
                    ExplicitInterface: explicitInterface?.ContainingType?.GetCSharpType());

                methods.Add(new MethodProvider(signature, MethodBodyStatement.Empty, this));
            }
            return [.. methods];
        }

        protected internal override IReadOnlyList<CSharpType> BuildBodyDependencyTypes()
        {
            var dependencies = new HashSet<CSharpType>();
            foreach (var syntaxReference in _namedTypeSymbol.DeclaringSyntaxReferences)
            {
                var syntax = syntaxReference.GetSyntax();
                if (IsGeneratedSourceFile(syntax.SyntaxTree.FilePath))
                {
                    continue;
                }

                AddBodyDependencyTypes(syntax, dependencies);
            }

            return [.. dependencies];
        }

        protected internal override IReadOnlyList<CSharpType> BuildSignatureDependencyTypes()
        {
            var dependencies = new HashSet<CSharpType>();
            foreach (var syntaxReference in _namedTypeSymbol.DeclaringSyntaxReferences)
            {
                var syntax = syntaxReference.GetSyntax();
                if (IsGeneratedSourceFile(syntax.SyntaxTree.FilePath) ||
                    syntax is not TypeDeclarationSyntax typeDeclaration ||
                    !IsPublic(typeDeclaration.Modifiers))
                {
                    continue;
                }

                var semanticModel = _compilation.GetSemanticModel(typeDeclaration.SyntaxTree);
                var namespaceCandidates = GetNamespaceCandidates(typeDeclaration);
                AddSyntaxTypeReferences(typeDeclaration.BaseList, dependencies, semanticModel, namespaceCandidates);
                foreach (var member in typeDeclaration.Members)
                {
                    if (IsPublicApiMember(member))
                    {
                        AddPublicSignatureDependencyTypes(member, dependencies);
                    }
                }
            }

            return [.. dependencies];
        }

        private void AddBodyDependencyTypes(SyntaxNode syntax, HashSet<CSharpType> dependencies)
        {
            var semanticModel = _compilation.GetSemanticModel(syntax.SyntaxTree);
            AddSyntaxTypeReferences(syntax, dependencies, semanticModel, GetNamespaceCandidates(syntax));

            foreach (var invocation in syntax.DescendantNodes().OfType<InvocationExpressionSyntax>())
            {
                if (GetInvocationName(invocation) == "SetDelimited")
                {
                    dependencies.Add(CreateUnresolvedDependencyType("SetDelimited"));
                }
            }
        }

        private void AddPublicSignatureDependencyTypes(MemberDeclarationSyntax member, HashSet<CSharpType> dependencies)
        {
            var semanticModel = _compilation.GetSemanticModel(member.SyntaxTree);
            var namespaceCandidates = GetNamespaceCandidates(member);
            switch (member)
            {
                case MethodDeclarationSyntax method:
                    AddSyntaxTypeReferences(method.ReturnType, dependencies, semanticModel, namespaceCandidates);
                    AddSyntaxTypeReferences(method.ParameterList, dependencies, semanticModel, namespaceCandidates);
                    AddSyntaxTypeReferences(method.ConstraintClauses, dependencies, semanticModel, namespaceCandidates);
                    break;
                case ConstructorDeclarationSyntax constructor:
                    AddSyntaxTypeReferences(constructor.ParameterList, dependencies, semanticModel, namespaceCandidates);
                    break;
                case ConversionOperatorDeclarationSyntax conversion:
                    AddSyntaxTypeReferences(conversion.Type, dependencies, semanticModel, namespaceCandidates);
                    AddSyntaxTypeReferences(conversion.ParameterList, dependencies, semanticModel, namespaceCandidates);
                    break;
                case OperatorDeclarationSyntax @operator:
                    AddSyntaxTypeReferences(@operator.ReturnType, dependencies, semanticModel, namespaceCandidates);
                    AddSyntaxTypeReferences(@operator.ParameterList, dependencies, semanticModel, namespaceCandidates);
                    break;
                case PropertyDeclarationSyntax property:
                    AddSyntaxTypeReferences(property.Type, dependencies, semanticModel, namespaceCandidates);
                    break;
                case IndexerDeclarationSyntax indexer:
                    AddSyntaxTypeReferences(indexer.Type, dependencies, semanticModel, namespaceCandidates);
                    AddSyntaxTypeReferences(indexer.ParameterList, dependencies, semanticModel, namespaceCandidates);
                    break;
                case FieldDeclarationSyntax field:
                    AddSyntaxTypeReferences(field.Declaration.Type, dependencies, semanticModel, namespaceCandidates);
                    break;
                case EventFieldDeclarationSyntax eventField:
                    AddSyntaxTypeReferences(eventField.Declaration.Type, dependencies, semanticModel, namespaceCandidates);
                    break;
                case EventDeclarationSyntax @event:
                    AddSyntaxTypeReferences(@event.Type, dependencies, semanticModel, namespaceCandidates);
                    break;
                case DelegateDeclarationSyntax @delegate:
                    AddSyntaxTypeReferences(@delegate.ReturnType, dependencies, semanticModel, namespaceCandidates);
                    AddSyntaxTypeReferences(@delegate.ParameterList, dependencies, semanticModel, namespaceCandidates);
                    AddSyntaxTypeReferences(@delegate.ConstraintClauses, dependencies, semanticModel, namespaceCandidates);
                    break;
                case BaseTypeDeclarationSyntax type:
                    AddSyntaxTypeReferences(type.BaseList, dependencies, semanticModel, namespaceCandidates);
                    break;
            }
        }

        private static void AddSyntaxTypeReferences(SyntaxNode? node, HashSet<CSharpType> dependencies, SemanticModel semanticModel, IReadOnlyList<string> namespaceCandidates)
        {
            if (node == null)
            {
                return;
            }

            foreach (var type in node.DescendantNodesAndSelf().OfType<TypeSyntax>())
            {
                if (type.IsPartOfStructuredTrivia())
                {
                    continue;
                }

                AddSyntaxTypeReference(type, dependencies, semanticModel, namespaceCandidates);
            }
        }

        private static void AddSyntaxTypeReferences(IEnumerable<SyntaxNode> nodes, HashSet<CSharpType> dependencies, SemanticModel semanticModel, IReadOnlyList<string> namespaceCandidates)
        {
            foreach (var node in nodes)
            {
                AddSyntaxTypeReferences(node, dependencies, semanticModel, namespaceCandidates);
            }
        }

        private static bool IsPublicApiMember(MemberDeclarationSyntax member)
            => member switch
            {
                EventDeclarationSyntax @event => IsPublic(@event.Modifiers),
                EventFieldDeclarationSyntax @event => IsPublic(@event.Modifiers),
                BaseFieldDeclarationSyntax field => IsPublic(field.Modifiers),
                BaseMethodDeclarationSyntax method => IsPublic(method.Modifiers),
                BasePropertyDeclarationSyntax property => IsPublic(property.Modifiers),
                DelegateDeclarationSyntax @delegate => IsPublic(@delegate.Modifiers),
                BaseTypeDeclarationSyntax type => IsPublic(type.Modifiers),
                _ => false
            };

        private static bool IsPublic(SyntaxTokenList modifiers)
            => modifiers.Any(static modifier =>
                modifier.IsKind(SyntaxKind.PublicKeyword) ||
                modifier.IsKind(SyntaxKind.ProtectedKeyword));

        private static bool IsGeneratedSourceFile(string filePath) =>
            filePath.Contains("/Generated/", StringComparison.Ordinal) ||
            filePath.Contains("\\Generated\\", StringComparison.Ordinal);

        private static CSharpType CreateUnresolvedDependencyType(string name, int genericArgumentCount = 0)
            => new(
                name,
                string.Empty,
                isValueType: false,
                isNullable: false,
                declaringType: null,
                args: [.. Enumerable.Range(0, genericArgumentCount).Select(static _ => CreateUnresolvedDependencyType(string.Empty))],
                isPublic: false,
                isStruct: false);

        private static void AddSyntaxTypeReference(TypeSyntax type, HashSet<CSharpType> dependencies, SemanticModel semanticModel, IReadOnlyList<string> namespaceCandidates)
        {
            if (TryAddSemanticTypeReference(type, dependencies, semanticModel))
            {
                return;
            }

            if (!IsSyntacticTypeReference(type))
            {
                return;
            }

            switch (type)
            {
                case IdentifierNameSyntax identifier:
                    AddUnresolvedDependencyType(dependencies, identifier.Identifier.ValueText, namespaceCandidates);
                    break;
                case GenericNameSyntax genericName:
                    AddUnresolvedDependencyType(dependencies, genericName.Identifier.ValueText, namespaceCandidates, genericName.TypeArgumentList.Arguments.Count);
                    foreach (var argument in genericName.TypeArgumentList.Arguments)
                    {
                        AddSyntaxTypeReference(argument, dependencies, semanticModel, namespaceCandidates);
                    }
                    break;
                case QualifiedNameSyntax qualifiedName:
                    AddQualifiedUnresolvedDependencyType(dependencies, qualifiedName);
                    AddSyntaxTypeReference(qualifiedName.Right, dependencies, semanticModel, namespaceCandidates);
                    break;
                case AliasQualifiedNameSyntax aliasQualifiedName:
                    AddSyntaxTypeReference(aliasQualifiedName.Name, dependencies, semanticModel, namespaceCandidates);
                    break;
                case ArrayTypeSyntax arrayType:
                    AddSyntaxTypeReference(arrayType.ElementType, dependencies, semanticModel, namespaceCandidates);
                    break;
                case NullableTypeSyntax nullableType:
                    AddSyntaxTypeReference(nullableType.ElementType, dependencies, semanticModel, namespaceCandidates);
                    break;
                case PointerTypeSyntax pointerType:
                    AddSyntaxTypeReference(pointerType.ElementType, dependencies, semanticModel, namespaceCandidates);
                    break;
                case TupleTypeSyntax tupleType:
                    foreach (var element in tupleType.Elements)
                    {
                        AddSyntaxTypeReference(element.Type, dependencies, semanticModel, namespaceCandidates);
                    }
                    break;
            }
        }

        private static bool TryAddSemanticTypeReference(TypeSyntax type, HashSet<CSharpType> dependencies, SemanticModel semanticModel)
        {
            var typeSymbol = semanticModel.GetTypeInfo(type).Type ??
                semanticModel.GetTypeInfo(type).ConvertedType ??
                (semanticModel.GetSymbolInfo(type).Symbol as INamedTypeSymbol);
            if (typeSymbol is not INamedTypeSymbol namedTypeSymbol ||
                namedTypeSymbol.TypeKind == TypeKind.Error ||
                namedTypeSymbol.SpecialType == SpecialType.System_Void)
            {
                return false;
            }

            dependencies.Add(namedTypeSymbol.GetCSharpType());
            return true;
        }

        private static void AddUnresolvedDependencyType(HashSet<CSharpType> dependencies, string name, IReadOnlyList<string> namespaceCandidates, int genericArgumentCount = 0)
        {
            if (string.Equals(name, "var", StringComparison.Ordinal) ||
                string.Equals(name, "dynamic", StringComparison.Ordinal))
            {
                return;
            }

            dependencies.Add(CreateUnresolvedDependencyType(name, genericArgumentCount));
            foreach (var ns in namespaceCandidates)
            {
                dependencies.Add(CreateDependencyType(name, ns, genericArgumentCount));
            }
        }

        private static void AddQualifiedUnresolvedDependencyType(HashSet<CSharpType> dependencies, QualifiedNameSyntax qualifiedName)
        {
            var fullName = qualifiedName.ToString();
            var lastDot = fullName.LastIndexOf('.');
            if (lastDot <= 0 || lastDot == fullName.Length - 1)
            {
                return;
            }

            dependencies.Add(CreateDependencyType(fullName.Substring(lastDot + 1), fullName.Substring(0, lastDot)));
        }

        private static CSharpType CreateDependencyType(string name, string ns, int genericArgumentCount = 0)
            => new(
                name,
                ns,
                isValueType: false,
                isNullable: false,
                declaringType: null,
                args: [.. Enumerable.Range(0, genericArgumentCount).Select(static _ => CreateUnresolvedDependencyType(string.Empty))],
                isPublic: false,
                isStruct: false);

        private static IReadOnlyList<string> GetNamespaceCandidates(SyntaxNode node)
        {
            var namespaces = new HashSet<string>(StringComparer.Ordinal);
            for (var current = node; current != null; current = current.Parent)
            {
                switch (current)
                {
                    case BaseNamespaceDeclarationSyntax namespaceDeclaration:
                        namespaces.Add(namespaceDeclaration.Name.ToString());
                        break;
                }
            }

            if (node.SyntaxTree.GetRoot() is CompilationUnitSyntax compilationUnit)
            {
                foreach (var usingDirective in compilationUnit.Usings)
                {
                    if (usingDirective.Alias == null && !usingDirective.StaticKeyword.IsKind(SyntaxKind.StaticKeyword) && usingDirective.Name != null)
                    {
                        namespaces.Add(usingDirective.Name.ToString());
                    }
                }
            }

            return [.. namespaces];
        }

        private static bool IsSyntacticTypeReference(TypeSyntax type)
        {
            var parent = type.Parent;
            return parent switch
            {
                ArrayTypeSyntax arrayType => arrayType.ElementType == type && IsSyntacticTypeReference(arrayType),
                NullableTypeSyntax nullableType => nullableType.ElementType == type && IsSyntacticTypeReference(nullableType),
                PointerTypeSyntax pointerType => pointerType.ElementType == type && IsSyntacticTypeReference(pointerType),
                TupleElementSyntax tupleElement => tupleElement.Type == type,
                TypeArgumentListSyntax typeArgumentList => typeArgumentList.Arguments.Contains(type),
                QualifiedNameSyntax qualifiedName => qualifiedName.Right == type && IsSyntacticTypeReference(qualifiedName),
                AliasQualifiedNameSyntax aliasQualifiedName => aliasQualifiedName.Name == type && IsSyntacticTypeReference(aliasQualifiedName),
                SimpleBaseTypeSyntax simpleBaseType => simpleBaseType.Type == type,
                ParameterSyntax parameter => parameter.Type == type,
                VariableDeclarationSyntax variableDeclaration => variableDeclaration.Type == type,
                PropertyDeclarationSyntax property => property.Type == type,
                IndexerDeclarationSyntax indexer => indexer.Type == type,
                MethodDeclarationSyntax method => method.ReturnType == type,
                LocalFunctionStatementSyntax localFunction => localFunction.ReturnType == type,
                DelegateDeclarationSyntax @delegate => @delegate.ReturnType == type,
                OperatorDeclarationSyntax @operator => @operator.ReturnType == type,
                ConversionOperatorDeclarationSyntax conversion => conversion.Type == type,
                TypeConstraintSyntax typeConstraint => typeConstraint.Type == type,
                ObjectCreationExpressionSyntax objectCreation => objectCreation.Type == type,
                MemberAccessExpressionSyntax memberAccess => memberAccess.Expression == type && LooksLikeTypeName(type),
                CastExpressionSyntax cast => cast.Type == type,
                DefaultExpressionSyntax @default => @default.Type == type,
                SizeOfExpressionSyntax sizeOf => sizeOf.Type == type,
                TypeOfExpressionSyntax typeOf => typeOf.Type == type,
                DeclarationExpressionSyntax declaration => declaration.Type == type,
                _ => false
            };
        }

        private static bool LooksLikeTypeName(TypeSyntax type)
            => type switch
            {
                IdentifierNameSyntax identifier => IsUppercaseIdentifier(identifier.Identifier.ValueText),
                GenericNameSyntax genericName => IsUppercaseIdentifier(genericName.Identifier.ValueText),
                QualifiedNameSyntax qualifiedName => LooksLikeTypeName(qualifiedName.Right),
                AliasQualifiedNameSyntax aliasQualifiedName => LooksLikeTypeName(aliasQualifiedName.Name),
                _ => false
            };

        private static bool IsUppercaseIdentifier(string name)
            => name.Length > 0 && char.IsUpper(name[0]);

        private static string? GetInvocationName(InvocationExpressionSyntax invocation)
            => invocation.Expression switch
            {
                IdentifierNameSyntax identifier => identifier.Identifier.ValueText,
                MemberAccessExpressionSyntax memberAccess => memberAccess.Name.Identifier.ValueText,
                GenericNameSyntax genericName => genericName.Identifier.ValueText,
                _ => null
            };

        private static bool IsPartialMethodDeclaration(IMethodSymbol methodSymbol)
        {
            foreach (var syntaxReference in methodSymbol.DeclaringSyntaxReferences)
            {
                if (syntaxReference.GetSyntax() is MethodDeclarationSyntax methodSyntax)
                {
                    bool hasPartialModifier = methodSyntax.Modifiers.Any(m => m.IsKind(SyntaxKind.PartialKeyword));
                    bool hasNoBody = methodSyntax.Body == null && methodSyntax.ExpressionBody == null;
                    if (hasPartialModifier && hasNoBody)
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        protected override bool GetIsEnum() => _namedTypeSymbol.TypeKind == TypeKind.Enum;

        protected override CSharpType BuildEnumUnderlyingType() => GetIsEnum() ? new CSharpType(typeof(int)) : throw new InvalidOperationException("This type is not an enum");

        private static ParameterProvider ConvertToParameterProvider(IMethodSymbol methodSymbol, IParameterSymbol parameterSymbol)
        {
            return new ParameterProvider(
                parameterSymbol.Name,
                FormattableStringHelpers.FromString(GetParameterXmlDocumentation(methodSymbol, parameterSymbol)) ?? FormattableStringHelpers.Empty,
                parameterSymbol.Type.GetCSharpType(),
                defaultValue: CreateDefaultValue(parameterSymbol),
                isIn: parameterSymbol.RefKind == RefKind.In,
                isOut: parameterSymbol.RefKind == RefKind.Out,
                isRef: parameterSymbol.RefKind == RefKind.Ref);
        }

        private void AddAdditionalModifiers(IMethodSymbol methodSymbol, ref MethodSignatureModifiers modifiers)
        {
            if (methodSymbol.IsVirtual)
            {
                modifiers |= MethodSignatureModifiers.Virtual;
            }
            if (methodSymbol.IsOverride)
            {
                modifiers |= MethodSignatureModifiers.Override;
            }
            if (methodSymbol.IsAsync)
            {
                modifiers |= MethodSignatureModifiers.Async;
            }
            if (methodSymbol.IsStatic)
            {
                modifiers |= MethodSignatureModifiers.Static;
            }
            // Handle conversion operators (explicit and implicit)
            if (methodSymbol.MethodKind == MethodKind.Conversion)
            {
                modifiers |= MethodSignatureModifiers.Operator;
                // Check if it's explicit or implicit
                if (methodSymbol.Name == "op_Explicit")
                {
                    modifiers |= MethodSignatureModifiers.Explicit;
                }
                else if (methodSymbol.Name == "op_Implicit")
                {
                    modifiers |= MethodSignatureModifiers.Implicit;
                }
            }
            // Handle user-defined operators
            else if (methodSymbol.MethodKind == MethodKind.UserDefinedOperator)
            {
                modifiers |= MethodSignatureModifiers.Operator;
            }
        }

        private static FormattableString? GetSymbolXmlDoc(ISymbol propertySymbol, string tag)
        {
            var xmlDocumentation = propertySymbol.GetDocumentationCommentXml();
            if (!string.IsNullOrEmpty(xmlDocumentation))
            {
                XDocument xDocument = ParseXml(propertySymbol, xmlDocumentation);
                XElement? tagElement = xDocument.Descendants(tag).FirstOrDefault();
                try
                {
                    if (tagElement != null)
                    {
                        string processedContent = ProcessXmlContent(tagElement);
                        return FormattableStringHelpers.FromString(processedContent);
                    }
                }
                catch
                {
                    return FormattableStringHelpers.FromString(tagElement?.Value.Trim());
                }
            }
            return null;
        }

        private static string ProcessXmlContent(XElement element)
        {
            const string SeeTagName = "see";
            const string CrefAttributeName = "cref";
            const string SeeTagOpen = "<see cref=\"";
            const string SeeTagClose = "\"/>";

            var result = new StringBuilder(Math.Max(128, element.ToString().Length));

            foreach (var node in element.Nodes())
            {
                switch (node)
                {
                    case XText textNode:
                        result.Append(textNode.Value);
                        break;

                    case XElement childElement when string.Equals(childElement.Name.LocalName, SeeTagName, StringComparison.Ordinal):
                        var cref = childElement.Attribute(CrefAttributeName)?.Value;

                        if (!string.IsNullOrEmpty(cref))
                        {
                            // Find the type prefix ('T:') separator and strip it
                            int colonIndex = cref.IndexOf(':');
                            string cleanCref = colonIndex >= 0 ? cref.Substring(colonIndex + 1) : cref;

                            result.Append(SeeTagOpen)
                                  .Append(cleanCref)
                                  .Append(SeeTagClose);
                        }
                        else
                        {
                            result.Append(childElement.ToString());
                        }
                        break;

                    case XElement childElement:
                        result.Append(ProcessXmlContent(childElement));
                        break;
                }
            }

            string resultString = result.ToString();
            return resultString.Length > 0 && (char.IsWhiteSpace(resultString[0]) ||
                   char.IsWhiteSpace(resultString[resultString.Length - 1]))
                ? resultString.Trim()
                : resultString;
        }

        private static XDocument ParseXml(ISymbol docsSymbol, string xmlDocumentation)
        {
            XDocument xDocument;
            try
            {
                xDocument = XDocument.Parse(xmlDocumentation);
            }
            catch (XmlException ex)
            {
                var files = new List<string>();
                foreach (var reference in docsSymbol.DeclaringSyntaxReferences)
                {
                    files.Add(reference.SyntaxTree.FilePath);
                }

                throw new InvalidOperationException($"Failed to parse XML documentation for {docsSymbol.Name}. " +
                                                    $"The malformed XML documentation is located in one or more of the following files: {string.Join(',', files)}", ex);
            }

            return xDocument;
        }

        private static string? GetParameterXmlDocumentation(IMethodSymbol methodSymbol, IParameterSymbol parameterSymbol)
        {
            var xmlDocumentation = methodSymbol.GetDocumentationCommentXml();

            if (string.IsNullOrWhiteSpace(xmlDocumentation))
            {
                return null;
            }

            var xmlDoc = ParseXml(methodSymbol, xmlDocumentation);
            var paramElement = xmlDoc.Descendants("param")
                                     .FirstOrDefault(e => e.Attribute("name")?.Value == parameterSymbol.Name);

            return paramElement?.Value.Trim();
        }

        private static MethodSignatureModifiers GetAccessModifier(Accessibility accessibility) => accessibility switch
        {
            Accessibility.Private => MethodSignatureModifiers.Private,
            Accessibility.Protected => MethodSignatureModifiers.Protected,
            Accessibility.Internal => MethodSignatureModifiers.Internal,
            Accessibility.Public => MethodSignatureModifiers.Public,
            _ => MethodSignatureModifiers.None
        };

        private static FieldModifiers GetFieldsAccessModifier(Accessibility accessibility) => accessibility switch
        {
            Accessibility.Private => FieldModifiers.Private,
            Accessibility.Protected => FieldModifiers.Protected,
            Accessibility.Internal => FieldModifiers.Internal,
            Accessibility.Public => FieldModifiers.Public,
            _ => FieldModifiers.Public
        };

        private CSharpType? GetNullableCSharpType(ITypeSymbol typeSymbol)
        {
            var fullyQualifiedName = typeSymbol.GetFullyQualifiedName();
            if (fullyQualifiedName == "System.Void")
            {
                return null;
            }
            return typeSymbol.GetCSharpType();
        }

        private static ValueExpression? CreateDefaultValue(IParameterSymbol parameterSymbol)
        {
            if (!parameterSymbol.HasExplicitDefaultValue)
            {
                return null;
            }

            var explicitDefaultValue = parameterSymbol.ExplicitDefaultValue;
            if (explicitDefaultValue == null)
            {
                return Default;
            }

            return explicitDefaultValue switch
            {
                string stringValue => Literal(stringValue),
                bool boolValue => boolValue ? True : False,
                int intValue => Int(intValue),
                double doubleValue => Double(doubleValue),
                float floatValue => Float(floatValue),
                long longValue => Long(longValue),
                _ => Default
            };
        }

        private ConstructorInitializer? ExtractConstructorInitializer(IMethodSymbol constructorSymbol)
        {
            // Get the first syntax reference for the constructor
            var syntaxReference = constructorSymbol.DeclaringSyntaxReferences.FirstOrDefault();
            if (syntaxReference == null)
            {
                return null;
            }

            // Get the syntax node and cast to constructor declaration
            var syntaxNode = syntaxReference.GetSyntax();
            if (syntaxNode is not ConstructorDeclarationSyntax constructorSyntax)
            {
                return null;
            }

            // Check if there's an initializer
            if (constructorSyntax.Initializer == null)
            {
                return null;
            }

            // Determine if it's 'this' or 'base'
            var isBase = constructorSyntax.Initializer.ThisOrBaseKeyword.IsKind(SyntaxKind.BaseKeyword);

            // Extract arguments from the initializer
            var arguments = new List<ValueExpression>();
            foreach (var arg in constructorSyntax.Initializer.ArgumentList.Arguments)
            {
                // Convert argument syntax to appropriate expression
                var argumentExpression = ConvertArgumentToExpression(arg);
                if (argumentExpression != null)
                {
                    arguments.Add(argumentExpression);
                }
            }

            return new ConstructorInitializer(isBase, arguments);
        }

        private ValueExpression? ConvertArgumentToExpression(ArgumentSyntax argument)
        {
            // For now, we'll handle the most common cases
            // This could be extended to handle more complex expressions if needed
            var expression = argument.Expression;

            return expression switch
            {
                // Handle literal expressions
                LiteralExpressionSyntax literal => ConvertLiteralToExpression(literal),

                // Handle identifier (parameter/variable names)
                IdentifierNameSyntax identifier => new VariableExpression(typeof(object), identifier.Identifier.ValueText),

                // For other expression types, we'll create a literal string representation
                // This is a fallback - more specific handling could be added as needed
                _ => Literal(expression.ToString())
            };
        }

        private ValueExpression ConvertLiteralToExpression(LiteralExpressionSyntax literal)
        {
            return literal.Token.Kind() switch
            {
                SyntaxKind.StringLiteralToken => Literal(literal.Token.ValueText),
                SyntaxKind.NumericLiteralToken =>
                    int.TryParse(literal.Token.ValueText, out var intValue) ? Literal(intValue) :
                    double.TryParse(literal.Token.ValueText, out var doubleValue) ? Literal(doubleValue) :
                    Literal(literal.Token.ValueText),
                SyntaxKind.TrueKeyword => True,
                SyntaxKind.FalseKeyword => False,
                SyntaxKind.NullKeyword => Null,
                _ => Literal(literal.Token.ValueText)
            };
        }
    }
}

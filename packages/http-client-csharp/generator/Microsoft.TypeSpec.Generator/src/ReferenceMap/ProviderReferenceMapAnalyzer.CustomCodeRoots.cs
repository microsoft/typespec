// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator
{
    internal static partial class ProviderReferenceMapAnalyzer
    {
        private static HashSet<string> GetCustomCodeGeneratedTypeRoots(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                AddCustomCodeViewGeneratedTypeRoot(roots, customCodeView, generatedTypeNames);
                AddCustomCodeViewRoots(roots, customCodeView, generatedTypeNames, publicOnly: false);
            }

            return roots;
        }

        private static HashSet<string> GetCustomCodePublicGeneratedTypeRoots(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                if (!customCodeView.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                {
                    continue;
                }

                AddCustomCodeViewGeneratedTypeRoot(roots, customCodeView, generatedTypeNames);
                AddCustomCodeViewRoots(roots, customCodeView, generatedTypeNames, publicOnly: true);
            }

            return roots;
        }

        private static IEnumerable<TypeProvider> GetCustomCodeViews(IReadOnlyList<TypeProvider> providers)
        {
            var visited = new HashSet<string>(StringComparer.Ordinal);
            var modelFactoryCustomCodeView = CodeModelGenerator.Instance.OutputLibrary.ModelFactory.Value.CustomCodeView;
            if (modelFactoryCustomCodeView != null && visited.Add(GetCustomCodeViewIdentity(modelFactoryCustomCodeView)))
            {
                yield return modelFactoryCustomCodeView;
            }

            foreach (var provider in providers)
            {
                var customCodeView = provider.CustomCodeView;
                if (customCodeView == null || !visited.Add(GetCustomCodeViewIdentity(customCodeView)))
                {
                    continue;
                }

                yield return customCodeView;
            }

            foreach (var customTypeProvider in CodeModelGenerator.Instance.SourceInputModel.GetCustomizationTypeProviders())
            {
                if (visited.Add(GetCustomCodeViewIdentity(customTypeProvider)))
                {
                    yield return customTypeProvider;
                }
            }
        }

        private static string GetCustomCodeViewIdentity(TypeProvider customCodeView) =>
            customCodeView is NamedTypeSymbolProvider namedTypeSymbolProvider
                ? namedTypeSymbolProvider.MetadataName
                : GetProviderTypeName(customCodeView.Type);

        private static void AddCustomRequestHeaderExtensionsRoot(HashSet<string> roots, IReadOnlyList<TypeProvider> providers, HashSet<string> nodes)
        {
            if (!HasCustomRequestHeaderExtensionsReference(providers))
            {
                return;
            }

            AddMatchingNamesWithSimpleNameSuffix(roots, "RequestHeaderExtensions", nodes);
            AddMatchingNamesWithSimpleNameSuffix(roots, "RequestHeadersExtensions", nodes);
        }

        private static void AddCustomCodeExtensionRoots(HashSet<string> roots, IReadOnlyList<TypeProvider> providers, HashSet<string> nodes)
        {
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                AddMatchingName(roots, $"{GetCustomCodeViewSimpleName(customCodeView)}Extensions", nodes);
            }
        }

        private static string GetCustomCodeViewSimpleName(TypeProvider customCodeView) =>
            customCodeView is NamedTypeSymbolProvider namedTypeSymbolProvider
                ? namedTypeSymbolProvider.MetadataSimpleName
                : customCodeView.Type.Name;

        private static void AddCustomCodeViewGeneratedTypeRoot(HashSet<string> roots, TypeProvider customCodeView, HashSet<string> generatedTypeNames)
        {
            if (customCodeView is NamedTypeSymbolProvider namedTypeSymbolProvider)
            {
                AddExactMetadataNameMatch(roots, namedTypeSymbolProvider.MetadataName, generatedTypeNames);
                return;
            }

            AddTypeReference(roots, customCodeView.Type, generatedTypeNames);
        }

        private static void AddCustomizationBackedExtensionRoots(HashSet<string> roots, HashSet<string> nodes)
        {
            foreach (var node in nodes)
            {
                var simpleName = GetSimpleName(node);
                if (!simpleName.EndsWith("Extensions", StringComparison.Ordinal))
                {
                    continue;
                }

                var namespaceName = GetNamespaceName(node);
                if (namespaceName == null)
                {
                    continue;
                }

                var customTypeName = simpleName.Substring(0, simpleName.Length - "Extensions".Length);
                if (CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCustomization(namespaceName, customTypeName) != null)
                {
                    roots.Add(node);
                }
            }
        }

        private static void AddCustomCodeViewRoots(HashSet<string> roots, TypeProvider customCodeView, HashSet<string> generatedTypeNames, bool publicOnly)
        {
            AddTypeReference(roots, customCodeView.BaseType, generatedTypeNames);
            AddProviderBodyDependencyTypes(roots, customCodeView.SignatureDependencyTypes, generatedTypeNames, includeSimpleNameReferences: true, includeUnqualifiedSimpleNameReferences: true, includeExtensionReferences: !publicOnly);
            if (!publicOnly)
            {
                AddProviderBodyDependencyTypes(roots, customCodeView.BodyDependencyTypes, generatedTypeNames);
                AddCustomCodeViewNamespaceBodyDependencyTypes(roots, customCodeView, generatedTypeNames);
                AddAttributes(roots, customCodeView.Attributes, generatedTypeNames, serializationProviderNamesByType: null, includeArguments: true);
                AddMatchingName(roots, $"{GetCustomCodeViewSimpleName(customCodeView)}Extensions", generatedTypeNames);
            }

            foreach (var implementedType in customCodeView.Implements)
            {
                AddTypeReference(roots, implementedType, generatedTypeNames);
            }

            foreach (var constructor in customCodeView.Constructors)
            {
                if (publicOnly && !IsPublic(constructor.Signature.Modifiers))
                {
                    continue;
                }

                AddSignatureReferences(roots, constructor.Signature, generatedTypeNames, serializationProviderNamesByType: null, includeAttributes: !publicOnly);
            }

            foreach (var method in customCodeView.Methods)
            {
                if (publicOnly && !IsPublic(method.Signature.Modifiers))
                {
                    continue;
                }

                AddSignatureReferences(roots, method.Signature, generatedTypeNames, serializationProviderNamesByType: null, includeAttributes: !publicOnly);
            }

            foreach (var property in customCodeView.Properties)
            {
                if (publicOnly && !IsPublic(property.Modifiers))
                {
                    continue;
                }

                AddTypeReference(roots, property.Type, generatedTypeNames);
                AddTypeReference(roots, property.ExplicitInterface, generatedTypeNames);
                if (!publicOnly)
                {
                    AddAttributes(roots, property.Attributes, generatedTypeNames, serializationProviderNamesByType: null, includeArguments: true);
                }
            }

            foreach (var field in customCodeView.Fields)
            {
                if (publicOnly && !IsPublic(field.Modifiers))
                {
                    continue;
                }

                AddTypeReference(roots, field.Type, generatedTypeNames);
                if (!publicOnly)
                {
                    AddAttributes(roots, field.Attributes, generatedTypeNames, serializationProviderNamesByType: null, includeArguments: true);
                }
            }
        }

        private static void AddCustomCodeViewNamespaceBodyDependencyTypes(HashSet<string> roots, TypeProvider customCodeView, HashSet<string> generatedTypeNames)
        {
            var customNamespace = customCodeView.Type.Namespace;
            if (string.IsNullOrEmpty(customNamespace))
            {
                return;
            }

            var customMemberNames = GetCustomCodeViewMemberNames(customCodeView);
            foreach (var dependency in customCodeView.BodyDependencyTypes)
            {
                AddNamespaceBodyDependencyType(roots, dependency, customNamespace, customMemberNames, generatedTypeNames);
            }
        }

        private static void AddNamespaceBodyDependencyType(HashSet<string> roots, CSharpType? dependency, string customNamespace, HashSet<string> customMemberNames, HashSet<string> generatedTypeNames)
        {
            if (dependency == null)
            {
                return;
            }

            if (string.IsNullOrEmpty(dependency.Namespace) &&
                dependency.Arguments.Count == 0 &&
                !customMemberNames.Contains(dependency.Name))
            {
                AddExactMetadataNameMatch(roots, $"{customNamespace}.{dependency.Name}", generatedTypeNames);
            }

            foreach (var argument in dependency.Arguments)
            {
                AddNamespaceBodyDependencyType(roots, argument, customNamespace, customMemberNames, generatedTypeNames);
            }
        }

        private static HashSet<string> GetCustomCodeViewMemberNames(TypeProvider customCodeView)
        {
            var memberNames = new HashSet<string>(StringComparer.Ordinal);
            foreach (var property in customCodeView.Properties)
            {
                memberNames.Add(property.Name);
            }

            foreach (var field in customCodeView.Fields)
            {
                memberNames.Add(field.Name);
            }

            foreach (var method in customCodeView.Methods)
            {
                memberNames.Add(method.Signature.Name);
            }

            return memberNames;
        }

        private static HashSet<string> GetApiBaselineGeneratedTypeRoots(HashSet<string> generatedTypeNames)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            var projectDirectory = CodeModelGenerator.Instance.Configuration.ProjectDirectory;
            if (string.IsNullOrEmpty(projectDirectory))
            {
                return roots;
            }

            var apiDirectory = Path.GetFullPath(Path.Combine(projectDirectory, "..", "api"));
            if (!Directory.Exists(apiDirectory))
            {
                return roots;
            }

            var apiText = string.Join("\n", Directory.GetFiles(apiDirectory, "*.cs", SearchOption.AllDirectories).Select(File.ReadAllText));
            var apiDeclaredTypeNames = GetApiDeclaredTypeNames(apiText);
            foreach (var fullName in generatedTypeNames)
            {
                var simpleName = StripGenericArity(GetSimpleName(fullName));
                var normalizedFullName = StripGenericArity(fullName);
                if (!ContainsApiTypeReference(apiText, apiDeclaredTypeNames, normalizedFullName, simpleName))
                {
                    continue;
                }

                roots.Add(fullName);
            }

            return roots;
        }

        private static HashSet<string> GetApiDeclaredTypeNames(string apiText)
        {
            var declaredTypeNames = new HashSet<string>(StringComparer.Ordinal);
            string? currentNamespace = null;
            foreach (var line in apiText.Split('\n'))
            {
                var namespaceMatch = Regex.Match(line, @"^namespace\s+([\w.]+)\s*\{?\s*$");
                if (namespaceMatch.Success)
                {
                    currentNamespace = namespaceMatch.Groups[1].Value;
                    continue;
                }

                if (currentNamespace == null)
                {
                    continue;
                }

                var declarationMatch = Regex.Match(line, @"^    \S.*?\b(class|struct|interface|enum)\s+([A-Za-z_][A-Za-z0-9_]*)(?!\s*<)(?!\w)");
                if (declarationMatch.Success)
                {
                    declaredTypeNames.Add($"{currentNamespace}.{declarationMatch.Groups[2].Value}");
                }
            }

            return declaredTypeNames;
        }

        private static bool ContainsApiTypeReference(string apiText, HashSet<string> apiDeclaredTypeNames, string fullName, string simpleName)
        {
            var fullNamePattern = $@"(?<![\w.]){Regex.Escape(fullName)}(?!\s*<)(?![\w.])";
            if (Regex.IsMatch(apiText, fullNamePattern))
            {
                return true;
            }

            return apiDeclaredTypeNames.Contains(fullName);
        }

        private static HashSet<string> GetCustomCodeInternalGeneratedTypeDeclarations(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var declarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                if (!customCodeView.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal))
                {
                    continue;
                }

                if (customCodeView is NamedTypeSymbolProvider namedTypeSymbolProvider)
                {
                    AddExactMetadataNameMatch(declarations, namedTypeSymbolProvider.MetadataName, generatedTypeNames);
                }
                else
                {
                    AddTypeReference(declarations, customCodeView.Type, generatedTypeNames);
                }
            }

            return declarations;
        }

        private static void AddExactMetadataNameMatch(HashSet<string> target, string metadataName, HashSet<string> generatedTypeNames)
        {
            var normalizedName = NormalizeMetadataTypeName(metadataName);
            if (!string.IsNullOrEmpty(normalizedName) && generatedTypeNames.Contains(normalizedName))
            {
                target.Add(normalizedName);
            }
        }

        private static string NormalizeMetadataTypeName(string metadataName)
        {
            var arrayIndex = metadataName.IndexOf('[', StringComparison.Ordinal);
            if (arrayIndex > 0)
            {
                metadataName = metadataName.Substring(0, arrayIndex);
            }

            return metadataName;
        }

        private static HashSet<string> GetGeneratedPersistableModelProxyTypeNames(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var proxyTypes = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (provider.Attributes.Any(static attribute => IsAttributeNamed(attribute, "PersistableModelProxy")))
                {
                    AddTypeReference(proxyTypes, provider.Type, generatedTypeNames);
                }
            }

            return proxyTypes;
        }

        private static HashSet<string> GetGeneratedInternalTypeDeclarations(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var declarations = GetGeneratedTypeDeclarationsByLastContractAccessibility(providers, generatedTypeNames, TypeSignatureModifiers.Internal);
            declarations.UnionWith(GetGeneratedTypeDeclarationsByExistingSourceAccessibility(providers, generatedTypeNames, TypeSignatureModifiers.Internal));
            return declarations;
        }

        private static HashSet<string> GetGeneratedPublicTypeDeclarations(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
            => GetGeneratedTypeDeclarationsByLastContractAccessibility(providers, generatedTypeNames, TypeSignatureModifiers.Public);

        private static HashSet<string> GetGeneratedPublicTypeDeclarationsFromLastContract(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
            => HasApiBaselineDirectory()
                ? new HashSet<string>(StringComparer.Ordinal)
                : GetGeneratedPublicTypeDeclarations(providers, generatedTypeNames);

        private static HashSet<string> GetGeneratedTypeDeclarationsByLastContractAccessibility(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> generatedTypeNames,
            TypeSignatureModifiers accessibility)
        {
            var declarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                var lastContractView = CodeModelGenerator.Instance.SourceInputModel.FindForTypeInLastContractIncludingInternal(
                    provider.Type.Namespace,
                    provider.Type.Name,
                    provider.DeclaringTypeProvider?.Type.Name);
                if (lastContractView?.DeclarationModifiers.HasFlag(accessibility) != true)
                {
                    continue;
                }

                AddTypeReference(declarations, provider.Type, generatedTypeNames);
            }

            return declarations;
        }

        private static HashSet<string> GetGeneratedTypeDeclarationsByExistingSourceAccessibility(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> generatedTypeNames,
            TypeSignatureModifiers accessibility)
        {
            var projectDirectory = CodeModelGenerator.Instance.Configuration.ProjectDirectory;
            if (string.IsNullOrEmpty(projectDirectory))
            {
                return [];
            }

            var declarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (!generatedTypeNames.Contains(GetProviderTypeName(provider.Type)) ||
                    !ExistingSourceHasAccessibility(projectDirectory, provider, accessibility))
                {
                    continue;
                }

                AddTypeReference(declarations, provider.Type, generatedTypeNames);
            }

            return declarations;
        }

        private static bool ExistingSourceHasAccessibility(string projectDirectory, TypeProvider provider, TypeSignatureModifiers accessibility)
        {
            var relativeFilePath = provider.DeclaringTypeProvider?.RelativeFilePath ?? provider.RelativeFilePath;
            var path = Path.GetFullPath(Path.Combine(projectDirectory, relativeFilePath));
            if (!File.Exists(path))
            {
                return false;
            }

            var root = CSharpSyntaxTree.ParseText(File.ReadAllText(path)).GetCompilationUnitRoot();
            foreach (var declaration in root.DescendantNodes().OfType<BaseTypeDeclarationSyntax>())
            {
                if (!string.Equals(declaration.Identifier.ValueText, provider.Type.Name, StringComparison.Ordinal) ||
                    !IsDeclaringTypeMatch(declaration, provider.DeclaringTypeProvider))
                {
                    continue;
                }

                return HasAccessibility(declaration.Modifiers, accessibility);
            }

            return false;
        }

        private static bool IsDeclaringTypeMatch(BaseTypeDeclarationSyntax declaration, TypeProvider? declaringTypeProvider)
        {
            var declaringType = declaration.Parent as BaseTypeDeclarationSyntax;
            if (declaringTypeProvider == null)
            {
                return declaringType == null;
            }

            return declaringType != null &&
                string.Equals(declaringType.Identifier.ValueText, declaringTypeProvider.Type.Name, StringComparison.Ordinal);
        }

        private static bool HasAccessibility(SyntaxTokenList modifiers, TypeSignatureModifiers accessibility) =>
            accessibility switch
            {
                TypeSignatureModifiers.Internal => modifiers.Any(SyntaxKind.InternalKeyword),
                TypeSignatureModifiers.Public => modifiers.Any(SyntaxKind.PublicKeyword),
                _ => false
            };

        private static HashSet<string> GetGeneratedImplementationInternalTypeDeclarations(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> generatedInternalDeclarations)
        {
            var implementationDeclarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (!provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Static))
                {
                    continue;
                }

                AddTypeReference(implementationDeclarations, provider.Type, generatedInternalDeclarations);
            }

            foreach (var name in generatedInternalDeclarations)
            {
                if (GetSimpleName(name).StartsWith("Internal", StringComparison.Ordinal))
                {
                    implementationDeclarations.Add(name);
                }
            }

            return implementationDeclarations;
        }

        private static bool IsGeneratedInternalImplementation(TypeProvider provider)
            => provider.RelativeFilePath.Contains(
                $"{Path.DirectorySeparatorChar}Generated{Path.DirectorySeparatorChar}Internal{Path.DirectorySeparatorChar}",
                StringComparison.Ordinal);

        private static HashSet<string> GetSimpleNames(HashSet<string> names)
        {
            var simpleNames = new HashSet<string>(StringComparer.Ordinal);
            foreach (var name in names)
            {
                simpleNames.Add(GetSimpleName(name));
            }

            return simpleNames;
        }
    }
}

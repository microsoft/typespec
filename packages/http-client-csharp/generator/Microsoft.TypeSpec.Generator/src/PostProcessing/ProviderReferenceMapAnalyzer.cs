// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.FindSymbols;

namespace Microsoft.TypeSpec.Generator
{
    internal static class ProviderReferenceMapAnalyzer
    {
        private static ProviderReferenceMapResult? _latestResult;
        private static readonly ConditionalWeakTable<HashSet<string>, Dictionary<string, string[]>> _simpleNameLookupCache = new();

        public static ProviderReferenceMapResult? LatestResult => _latestResult;

        public static void Analyze(IReadOnlyList<TypeProvider> providers, Project project)
        {
            var graph = BuildGraph(providers);
            var publicGraph = BuildGraph(providers, publicOnly: true);

            // Generated-code dependencies come from providers. Custom code still needs Roslyn
            // because arbitrary user C# can reference generated types in ways providers cannot see.
            var customPublicRoots = GetCustomCodePublicGeneratedTypeRoots(project, graph.Nodes);
            customPublicRoots.UnionWith(GetApiBaselineGeneratedTypeRoots(graph.Nodes));
            var customRemovalRoots = GetCustomCodeGeneratedTypeRoots(project, graph.Nodes);
            var customInternalDeclarations = GetCustomCodeInternalGeneratedTypeDeclarations(project, graph.Nodes);
            var generatedInternalDeclarations = GetGeneratedInternalTypeDeclarations(providers, graph.Nodes);

            // Helper types are rooted after an initial reachability pass so unused infrastructure
            // such as change-tracking dictionaries can still be removed when no reachable type needs them.
            var generatedDiscriminatorBaseNames = GetGeneratedPersistableModelProxyTypeNames(project, publicGraph.Nodes);
            var internalizeReferences = CloneReferences(publicGraph.References);
            var internalizeRoots = GetRootNames(providers, graph.Nodes, helperRoots: [], includeModelFactory: false, includeAdditionalRoots: true, includeUnionVariantRoots: true, publicClientRootsOnly: true);
            var generatedPublicReachable = GetReachableTypes(internalizeRoots, internalizeReferences);
            AddDerivedModelReferences(providers, publicGraph.Nodes, internalizeReferences, generatedPublicReachable, generatedDiscriminatorBaseNames);
            internalizeRoots.UnionWith(customPublicRoots);
            var internalizeReachableWithoutHelpers = GetReachableTypes(internalizeRoots, internalizeReferences);
            AddDerivedModelReferences(providers, publicGraph.Nodes, internalizeReferences, internalizeReachableWithoutHelpers, generatedDiscriminatorBaseNames);
            internalizeReachableWithoutHelpers = GetReachableTypes(internalizeRoots, internalizeReferences);
            var publicizeRoots = internalizeRoots.ToHashSet(StringComparer.Ordinal);
            var internalizeHelperRoots = GetHelperRootNames(providers, graph.Nodes, internalizeReachableWithoutHelpers);
            internalizeRoots.UnionWith(internalizeHelperRoots);
            var internalizeReachable = GetReachableTypes(internalizeRoots, internalizeReferences);
            var internalizeDeclaredNodes = GetPostProcessorDeclaredNodes(providers, graph.Nodes, publicOnly: true);
            var customInternalBoundaryNodes = graph.Nodes
                .Where(name => publicGraph.References.TryGetValue(name, out var references) && references.Overlaps(customInternalDeclarations))
                .ToHashSet(StringComparer.Ordinal);
            var publicizeDeclaredNodes = GetPostProcessorDeclaredNodes(providers, graph.Nodes, publicOnly: false)
                .Except(internalizeDeclaredNodes, StringComparer.Ordinal);
            var generatedImplementationInternalDeclarations = GetGeneratedImplementationInternalTypeDeclarations(generatedInternalDeclarations).ToHashSet(StringComparer.Ordinal);
            var publicApiTraversalNodes = internalizeDeclaredNodes
                .Except(generatedInternalDeclarations, StringComparer.Ordinal)
                .Concat(publicizeDeclaredNodes)
                .Except(generatedImplementationInternalDeclarations, StringComparer.Ordinal)
                .ToHashSet(StringComparer.Ordinal);
            var publicizeReachable = GetReachableTypes(publicizeRoots, internalizeReferences, publicApiTraversalNodes);
            var internalizeCandidates = internalizeDeclaredNodes
                .Except(publicizeReachable, StringComparer.Ordinal)
                .Union(internalizeDeclaredNodes.Intersect(customInternalBoundaryNodes, StringComparer.Ordinal), StringComparer.Ordinal)
                .OrderBy(static name => name, StringComparer.Ordinal)
                .ToArray();
            var publicizeCandidates = publicizeDeclaredNodes
                .Except(customInternalDeclarations, StringComparer.Ordinal)
                .Except(customInternalBoundaryNodes, StringComparer.Ordinal)
                .Except(internalizeHelperRoots, StringComparer.Ordinal)
                .Except(GetRootNames(providers, graph.Nodes, helperRoots: [], includeModelFactory: true, includeAdditionalRoots: true, includeUnionVariantRoots: true, publicClientRootsOnly: true), StringComparer.Ordinal)
                .Intersect(publicizeReachable, StringComparer.Ordinal)
                // Preserve generated types that the last contract already made internal unless a public API/custom root explicitly requires them.
                .Where(name => !generatedInternalDeclarations.Contains(name) || publicizeRoots.Contains(name))
                .Where(name => publicizeRoots.Contains(name) ||
                    HasPublicApiPredecessor(name, internalizeReferences, publicizeReachable, generatedImplementationInternalDeclarations))
                .OrderBy(static name => name, StringComparer.Ordinal)
                .ToArray();

            // Body-only generated dependencies are needed to avoid deleting helper files, but they do
            // not contribute to public API reachability for internalization.
            AddGeneratedBodyReferences(project, providers, graph);

            var removeRoots = GetRootNames(providers, graph.Nodes, helperRoots: [], includeModelFactory: true, includeAdditionalRoots: true, includeUnionVariantRoots: true, publicClientRootsOnly: false);
            removeRoots.UnionWith(customRemovalRoots);
            RemoveUnusedRequestHeaderExtensionsRoot(removeRoots, graph.References, project);
            var removeReachableWithoutHelpers = GetReachableTypes(removeRoots, graph.References);
            AddDerivedModelReferences(providers, graph.Nodes, graph.References, removeReachableWithoutHelpers, generatedDiscriminatorBaseNames);
            removeReachableWithoutHelpers = GetReachableTypes(removeRoots, graph.References);
            var removeHelperRoots = GetHelperRootNames(providers, graph.Nodes, removeReachableWithoutHelpers, graph.References);
            removeRoots.UnionWith(removeHelperRoots);
            var removeReachable = GetReachableTypes(removeRoots, graph.References);
            var removeDeclaredNodes = GetPostProcessorDeclaredNodes(providers, graph.Nodes, publicOnly: false);
            var removeCandidates = removeDeclaredNodes.Except(removeReachable, StringComparer.Ordinal).OrderBy(static name => name, StringComparer.Ordinal).ToArray();

            var helperRoots = internalizeHelperRoots.Concat(removeHelperRoots).ToHashSet(StringComparer.Ordinal);

            _latestResult = new ProviderReferenceMapResult(
                project.Id,
                internalizeCandidates.ToHashSet(StringComparer.Ordinal),
                publicizeCandidates.ToHashSet(StringComparer.Ordinal),
                removeCandidates.ToHashSet(StringComparer.Ordinal));
        }

        private static HashSet<string> GetCustomCodeGeneratedTypeRoots(Project project, HashSet<string> generatedTypeNames)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            var compilation = project.GetCompilationAsync().GetAwaiter().GetResult();
            if (compilation == null)
            {
                return roots;
            }

            foreach (var document in project.Documents)
            {
                if (IsGeneratedDocument(document))
                {
                    continue;
                }

                var root = document.GetSyntaxRootAsync().GetAwaiter().GetResult();
                if (root == null)
                {
                    continue;
                }

                var model = compilation.GetSemanticModel(root.SyntaxTree);
                foreach (var declaration in root.DescendantNodes().OfType<BaseTypeDeclarationSyntax>())
                {
                    AddSymbolRoot(roots, model.GetDeclaredSymbol(declaration) as ITypeSymbol, generatedTypeNames);
                }

                foreach (var typeSyntax in root.DescendantNodes().OfType<TypeSyntax>())
                {
                    AddSymbolRoot(roots, model.GetTypeInfo(typeSyntax).Type, generatedTypeNames);
                }

                foreach (var objectCreation in root.DescendantNodes().OfType<ObjectCreationExpressionSyntax>())
                {
                    AddSymbolRoot(roots, model.GetSymbolInfo(objectCreation).Symbol?.ContainingType, generatedTypeNames);
                }

                foreach (var invocation in root.DescendantNodes().OfType<InvocationExpressionSyntax>())
                {
                    AddSymbolRoot(roots, model.GetSymbolInfo(invocation).Symbol?.ContainingType, generatedTypeNames);
                }
            }

            return roots;
        }

        private static HashSet<string> GetCustomCodePublicGeneratedTypeRoots(Project project, HashSet<string> generatedTypeNames)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            var compilation = project.GetCompilationAsync().GetAwaiter().GetResult();
            if (compilation == null)
            {
                return roots;
            }

            foreach (var document in project.Documents)
            {
                if (IsGeneratedDocument(document))
                {
                    continue;
                }

                var root = document.GetSyntaxRootAsync().GetAwaiter().GetResult();
                if (root == null)
                {
                    continue;
                }

                var semanticModel = compilation.GetSemanticModel(root.SyntaxTree);
                foreach (var declaration in root.DescendantNodes().OfType<BaseTypeDeclarationSyntax>())
                {
                    if (semanticModel.GetDeclaredSymbol(declaration) is not INamedTypeSymbol symbol ||
                        symbol.DeclaredAccessibility != Accessibility.Public)
                    {
                        continue;
                    }

                    AddSymbolRoot(roots, symbol, generatedTypeNames);
                    AddSymbolRoot(roots, symbol.BaseType, generatedTypeNames);
                    foreach (var interfaceType in symbol.Interfaces)
                    {
                        AddSymbolRoot(roots, interfaceType, generatedTypeNames);
                    }

                    foreach (var member in symbol.GetMembers())
                    {
                        if (member.DeclaredAccessibility != Accessibility.Public ||
                            !IsDeclaredInSyntaxTree(member, declaration.SyntaxTree, declaration.Span))
                        {
                            continue;
                        }

                        switch (member)
                        {
                            case IMethodSymbol method:
                                AddSymbolRoot(roots, method.ReturnType, generatedTypeNames);
                                foreach (var parameter in method.Parameters)
                                {
                                    AddSymbolRoot(roots, parameter.Type, generatedTypeNames);
                                }
                                break;
                            case IPropertySymbol property:
                                AddSymbolRoot(roots, property.Type, generatedTypeNames);
                                break;
                            case IFieldSymbol field:
                                AddSymbolRoot(roots, field.Type, generatedTypeNames);
                                break;
                            case IEventSymbol eventSymbol:
                                AddSymbolRoot(roots, eventSymbol.Type, generatedTypeNames);
                                break;
                        }
                    }
                }
            }

            return roots;
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
            foreach (var fullName in generatedTypeNames)
            {
                var simpleName = StripGenericArity(GetSimpleName(fullName));
                var normalizedFullName = StripGenericArity(fullName);
                if (!ContainsApiTypeReference(apiText, normalizedFullName, simpleName))
                {
                    continue;
                }

                roots.Add(fullName);
            }

            return roots;
        }

        private static bool ContainsApiTypeReference(string apiText, string fullName, string simpleName)
        {
            var fullNamePattern = $@"(?<![\w.]){Regex.Escape(fullName)}(?!\s*<)(?![\w.])";
            if (Regex.IsMatch(apiText, fullNamePattern))
            {
                return true;
            }

            var declarationPattern = $@"(?m)^    \S.*?\b(class|struct|interface|enum)\s+{Regex.Escape(simpleName)}(?!\s*<)(?!\w)";
            return Regex.IsMatch(apiText, declarationPattern);
        }

        private static bool IsDeclaredInSyntaxTree(ISymbol symbol, SyntaxTree syntaxTree, Microsoft.CodeAnalysis.Text.TextSpan span)
        {
            foreach (var syntaxReference in symbol.DeclaringSyntaxReferences)
            {
                if (syntaxReference.SyntaxTree == syntaxTree && span.Contains(syntaxReference.Span))
                {
                    return true;
                }
            }

            return false;
        }

        private static HashSet<string> GetCustomCodeInternalGeneratedTypeDeclarations(Project project, HashSet<string> generatedTypeNames)
        {
            var declarations = new HashSet<string>(StringComparer.Ordinal);
            var compilation = project.GetCompilationAsync().GetAwaiter().GetResult();
            if (compilation == null)
            {
                return declarations;
            }

            foreach (var document in project.Documents)
            {
                if (IsGeneratedDocument(document))
                {
                    continue;
                }

                var root = document.GetSyntaxRootAsync().GetAwaiter().GetResult();
                if (root == null)
                {
                    continue;
                }

                var semanticModel = compilation.GetSemanticModel(root.SyntaxTree);
                foreach (var declaration in root.DescendantNodes().OfType<BaseTypeDeclarationSyntax>())
                {
                    if (semanticModel.GetDeclaredSymbol(declaration) is not INamedTypeSymbol symbol ||
                        symbol.DeclaredAccessibility != Accessibility.Internal)
                    {
                        continue;
                    }

                    AddMatchingName(declarations, symbol.GetFullyQualifiedName(), generatedTypeNames);
                }
            }

            return declarations;
        }

        private static HashSet<string> GetGeneratedPersistableModelProxyTypeNames(Project project, HashSet<string> generatedTypeNames)
        {
            var proxyTypes = new HashSet<string>(StringComparer.Ordinal);
            var compilation = project.GetCompilationAsync().GetAwaiter().GetResult();
            if (compilation == null)
            {
                return proxyTypes;
            }

            foreach (var document in project.Documents)
            {
                if (!IsGeneratedDocument(document))
                {
                    continue;
                }

                var root = document.GetSyntaxRootAsync().GetAwaiter().GetResult();
                if (root == null)
                {
                    continue;
                }

                var semanticModel = compilation.GetSemanticModel(root.SyntaxTree);
                foreach (var declaration in root.DescendantNodes().OfType<BaseTypeDeclarationSyntax>())
                {
                    if (!declaration.AttributeLists
                        .SelectMany(static list => list.Attributes)
                        .Any(static attribute => attribute.Name.ToString().Contains("PersistableModelProxy", StringComparison.Ordinal)))
                    {
                        continue;
                    }

                    if (semanticModel.GetDeclaredSymbol(declaration) is INamedTypeSymbol symbol)
                    {
                        AddMatchingName(proxyTypes, symbol.GetFullyQualifiedName(), generatedTypeNames);
                    }
                }
            }

            return proxyTypes;
        }

        private static HashSet<string> GetGeneratedInternalTypeDeclarations(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var declarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (provider.LastContractView?.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal) != true)
                {
                    continue;
                }

                AddMatchingName(declarations, GetProviderTypeName(provider.Type), generatedTypeNames);
            }

            return declarations;
        }

        private static IEnumerable<string> GetGeneratedImplementationInternalTypeDeclarations(HashSet<string> generatedInternalDeclarations) =>
            generatedInternalDeclarations.Where(static name => GetSimpleName(name).StartsWith("Internal", StringComparison.Ordinal));

        private static void AddSymbolRoot(HashSet<string> roots, ITypeSymbol? symbol, HashSet<string> generatedTypeNames)
        {
            if (symbol is not INamedTypeSymbol namedType)
            {
                return;
            }

            AddMatchingSymbolName(roots, namedType, generatedTypeNames);
            foreach (var typeArgument in namedType.TypeArguments)
            {
                AddSymbolRoot(roots, typeArgument, generatedTypeNames);
            }
        }

        private static void AddMatchingSymbolName(HashSet<string> target, INamedTypeSymbol symbol, HashSet<string> generatedTypeNames)
        {
            try
            {
                AddMatchingName(target, symbol.GetFullyQualifiedName(), generatedTypeNames);
            }
            catch (ArgumentOutOfRangeException)
            {
                // Some custom-code symbols cannot be represented by the legacy fully-qualified-name
                // helper. A simple-name match is enough to discover generated roots.
                AddMatchingName(target, symbol.Name, generatedTypeNames);
            }
        }

        private static ProviderReferenceGraph BuildGraph(IReadOnlyList<TypeProvider> providers, bool publicOnly = false)
        {
            var generatedProviders = GetGeneratedProviders(providers);
            var serializationProviderNamesByType = providers
                .Where(static provider => provider.SerializationProviders.Count > 0)
                .ToDictionary(
                    static provider => GetProviderTypeName(provider.Type),
                    static provider => provider.SerializationProviders
                        .Select(static serializationProvider => GetProviderTypeName(serializationProvider.Type))
                        .ToArray(),
                    StringComparer.Ordinal);
            IReadOnlyDictionary<string, string[]>? serializationReferenceNamesByType = publicOnly ? null : serializationProviderNamesByType;
            var nodes = generatedProviders
                .Select(static provider => GetProviderTypeName(provider.Type))
                .ToHashSet(StringComparer.Ordinal);
            var references = nodes.ToDictionary(static name => name, _ => new HashSet<string>(StringComparer.Ordinal), StringComparer.Ordinal);

            foreach (var provider in generatedProviders)
            {
                var current = GetProviderTypeName(provider.Type);
                AddTypeReference(references[current], provider.Type, nodes, serializationReferenceNamesByType);
                AddTypeReference(references[current], provider.BaseType, nodes, serializationReferenceNamesByType);
                AddTypeReference(references[current], provider.DeclaringTypeProvider?.Type, nodes, serializationReferenceNamesByType);

                if (IsKept(provider.Type, CodeModelGenerator.Instance.NonRootTypes, nodes))
                {
                    continue;
                }

                // Model factory signatures mention many models. The existing Roslyn post-processor
                // removes factory methods for unreachable models, so model factory should only
                // contribute helper dependencies, not model reachability edges.
                if (IsModelFactoryProvider(provider))
                {
                    continue;
                }

                foreach (var implementedType in provider.Implements)
                {
                    AddTypeReference(references[current], implementedType, nodes, serializationReferenceNamesByType);
                }

                if (!publicOnly)
                {
                    foreach (var nestedType in provider.NestedTypes)
                    {
                        AddTypeReference(references[current], nestedType.Type, nodes, serializationReferenceNamesByType);
                    }
                }

                if (!publicOnly)
                {
                    foreach (var serializationProvider in provider.SerializationProviders)
                    {
                        AddTypeReference(references[current], serializationProvider.Type, nodes, serializationReferenceNamesByType);
                    }
                }

                foreach (var property in provider.Properties)
                {
                    if (publicOnly && !IsPublic(property.Modifiers))
                    {
                        continue;
                    }

                    AddTypeReference(references[current], property.Type, nodes, serializationReferenceNamesByType);
                    AddTypeReference(references[current], property.ExplicitInterface, nodes, serializationReferenceNamesByType);
                    if (!publicOnly)
                    {
                        AddAttributes(references[current], property.Attributes, nodes, serializationReferenceNamesByType);
                    }
                }

                foreach (var field in provider.Fields)
                {
                    if (publicOnly && !field.Modifiers.HasFlag(FieldModifiers.Public))
                    {
                        continue;
                    }

                    AddTypeReference(references[current], field.Type, nodes, serializationReferenceNamesByType);
                    if (!publicOnly)
                    {
                        AddAttributes(references[current], field.Attributes, nodes, serializationReferenceNamesByType);
                    }
                }

                foreach (var constructor in provider.Constructors)
                {
                    if (publicOnly && !IsPublic(constructor.Signature.Modifiers))
                    {
                        continue;
                    }

                    AddSignatureReferences(references[current], constructor.Signature, nodes, serializationReferenceNamesByType, includeAttributes: !publicOnly);
                }

                foreach (var method in provider.Methods)
                {
                    if (publicOnly && !IsPublic(method.Signature.Modifiers))
                    {
                        continue;
                    }

                    AddSignatureReferences(references[current], method.Signature, nodes, serializationReferenceNamesByType, includeAttributes: !publicOnly);
                    if (!publicOnly)
                    {
                        AddTypeReference(references[current], GetCollectionDefinitionType(method), nodes, serializationReferenceNamesByType);
                    }
                }
            }

            return new ProviderReferenceGraph(nodes, references);
        }

        private static CSharpType? GetCollectionDefinitionType(MethodProvider method)
        {
            var property = method.GetType().GetProperty("CollectionDefinition");
            return property?.GetValue(method) is TypeProvider collectionDefinition
                ? collectionDefinition.Type
                : null;
        }

        private static bool IsPublic(MethodSignatureModifiers modifiers) => modifiers.HasFlag(MethodSignatureModifiers.Public);

        private static Dictionary<string, HashSet<string>> CloneReferences(IReadOnlyDictionary<string, HashSet<string>> references)
        {
            return references.ToDictionary(
                static item => item.Key,
                static item => item.Value.ToHashSet(StringComparer.Ordinal),
                StringComparer.Ordinal);
        }

        private static void AddDerivedModelReferences(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes,
            Dictionary<string, HashSet<string>> references,
            HashSet<string> publicBaseModels,
            HashSet<string> generatedDiscriminatorBaseNames)
        {
            var modelProviders = providers.OfType<ModelProvider>().ToArray();
            var publicModelProviders = modelProviders
                .Where(static provider => provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                .ToArray();
            var discriminatorProviders = publicModelProviders
                .Where(static provider => provider.DiscriminatorProperty != null || provider.DiscriminatorValue != null)
                .Where(static provider => !provider.IsUnknownDiscriminatorModel)
                .ToArray();
            var discriminatorBaseNames = publicModelProviders
                .Where(static provider => provider.DiscriminatorProperty != null)
                .Select(static provider => GetProviderTypeName(provider.Type))
                .ToHashSet(StringComparer.Ordinal);
            discriminatorBaseNames.UnionWith(generatedDiscriminatorBaseNames);
            var addedReference = true;
            while (addedReference)
            {
                addedReference = false;
                foreach (var provider in discriminatorProviders)
                {
                    var providerName = GetProviderTypeName(provider.Type);
                    if (!nodes.Contains(providerName))
                    {
                        continue;
                    }

                    if (!publicBaseModels.Contains(providerName))
                    {
                        continue;
                    }

                    foreach (var derivedModel in provider.DerivedModels)
                    {
                        if (derivedModel.IsUnknownDiscriminatorModel ||
                            !derivedModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                        {
                            continue;
                        }

                        var before = references[providerName].Count;
                        AddTypeReference(references[providerName], derivedModel.Type, nodes);
                        var derivedName = GetProviderTypeName(derivedModel.Type);
                        if (nodes.Contains(derivedName) && publicBaseModels.Add(derivedName) || references[providerName].Count != before)
                        {
                            addedReference = true;
                        }
                    }
                }

                foreach (var provider in modelProviders)
                {
                    if (provider.IsUnknownDiscriminatorModel ||
                        !provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                    {
                        continue;
                    }

                    var providerName = GetProviderTypeName(provider.Type);
                    if (!nodes.Contains(providerName))
                    {
                        continue;
                    }

                    var baseTypeName = provider.BaseType == null ? null : GetProviderTypeName(provider.BaseType);
                    if (baseTypeName == null ||
                        !discriminatorBaseNames.Contains(baseTypeName) ||
                        !nodes.Contains(baseTypeName) ||
                        !publicBaseModels.Contains(baseTypeName))
                    {
                        continue;
                    }

                    var before = references[baseTypeName].Count;
                    references[baseTypeName].Add(providerName);
                    if (publicBaseModels.Add(providerName) || references[baseTypeName].Count != before)
                    {
                        addedReference = true;
                    }
                }
            }
        }

        private static IReadOnlyList<TypeProvider> GetGeneratedProviders(IReadOnlyList<TypeProvider> providers)
        {
            var generatedProviders = new List<TypeProvider>();
            foreach (var provider in providers)
            {
                AddGeneratedProvider(generatedProviders, provider);
            }

            return generatedProviders;
        }

        private static void AddGeneratedProvider(List<TypeProvider> generatedProviders, TypeProvider provider)
        {
            generatedProviders.Add(provider);
            foreach (var nestedType in provider.NestedTypes)
            {
                AddGeneratedProvider(generatedProviders, nestedType);
            }

            foreach (var serializationProvider in provider.SerializationProviders)
            {
                AddGeneratedProvider(generatedProviders, serializationProvider);
            }
        }

        private static void AddGeneratedBodyReferences(Project project, IReadOnlyList<TypeProvider> providers, ProviderReferenceGraph graph)
        {
            var compilation = project.GetCompilationAsync().GetAwaiter().GetResult();
            if (compilation == null)
            {
                return;
            }

            foreach (var provider in GetBodyReferenceProviders(providers))
            {
                if (IsModelFactoryProvider(provider))
                {
                    continue;
                }

                if (!IsGeneratedBodyReferenceCandidate(provider))
                {
                    continue;
                }

                var providerName = GetProviderTypeName(provider.Type);
                if (!graph.Nodes.Contains(providerName))
                {
                    continue;
                }

                var bodyDependencyTypes = provider.BodyDependencyTypes;
                AddProviderBodyDependencyTypes(graph.References[providerName], bodyDependencyTypes, graph.Nodes);

                if (bodyDependencyTypes.Count > 0)
                {
                    continue;
                }

                var symbol = compilation.GetTypeByMetadataName(providerName);
                if (symbol == null)
                {
                    continue;
                }

                if (!IsSerializationProvider(provider))
                {
                    AddGeneratedReferencesToHelper(project, compilation, graph, providerName, symbol);
                    if (provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Static))
                    {
                        foreach (var method in symbol.GetMembers().OfType<IMethodSymbol>())
                        {
                            if (method.IsExtensionMethod)
                            {
                                AddGeneratedReferencesToHelper(project, compilation, graph, providerName, method);
                            }
                        }
                    }
                }

                AddGeneratedBodyTypeReferences(project, compilation, graph, providerName, symbol);
            }
        }

        private static void AddProviderBodyDependencyTypes(HashSet<string> references, IReadOnlyList<CSharpType> dependencies, HashSet<string> nodes)
        {
            foreach (var dependency in dependencies)
            {
                AddTypeReference(references, dependency, nodes);
            }
        }

        private static IReadOnlyList<TypeProvider> GetBodyReferenceProviders(IReadOnlyList<TypeProvider> providers)
        {
            var bodyReferenceProviders = new List<TypeProvider>();
            foreach (var provider in providers)
            {
                bodyReferenceProviders.Add(provider);
                bodyReferenceProviders.AddRange(provider.SerializationProviders);
            }

            return bodyReferenceProviders;
        }

        private static bool IsGeneratedBodyReferenceCandidate(TypeProvider provider)
        {
            if (provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Static))
            {
                return true;
            }

            var relativePath = provider.RelativeFilePath.Replace('\\', '/');
            return IsSerializationProvider(provider) ||
                relativePath.EndsWith("/Internal/ClientUriBuilder.cs", StringComparison.Ordinal) ||
                provider.HelperDependencyNames.Count > 0 ||
                provider.BodyDependencyTypes.Count > 0;
        }

        private static bool IsGeneratedHelperSimpleName(string name) =>
            string.Equals(name, "ChangeTrackingDictionary", StringComparison.Ordinal) ||
            string.Equals(name, "ChangeTrackingList", StringComparison.Ordinal);

        private static void AddGeneratedBodyTypeReferences(Project project, Compilation compilation, ProviderReferenceGraph graph, string ownerName, INamedTypeSymbol ownerSymbol)
        {
            foreach (var syntaxReference in ownerSymbol.DeclaringSyntaxReferences)
            {
                var document = project.GetDocument(syntaxReference.SyntaxTree);
                if (document == null || !IsGeneratedDocument(document))
                {
                    continue;
                }

                var root = syntaxReference.SyntaxTree.GetRoot();
                var semanticModel = compilation.GetSemanticModel(syntaxReference.SyntaxTree);
                foreach (var typeSyntax in root.DescendantNodes().OfType<TypeSyntax>())
                {
                    // Declaration names are the owner itself. The old Roslyn map captures references,
                    // not a declaration making itself reachable.
                    if (typeSyntax.Parent is BaseTypeDeclarationSyntax baseTypeDeclaration && baseTypeDeclaration.Identifier.Span == typeSyntax.Span)
                    {
                        continue;
                    }

                    var typeInfo = semanticModel.GetTypeInfo(typeSyntax).Type;
                    AddBodyTypeReference(graph.References[ownerName], typeInfo, graph.Nodes);
                    AddUnresolvedBodyTypeSyntaxReference(graph.References[ownerName], typeSyntax, typeInfo, graph.Nodes);
                }
            }
        }

        private static void AddUnresolvedBodyTypeSyntaxReference(HashSet<string> references, TypeSyntax typeSyntax, ITypeSymbol? symbol, HashSet<string> nodes)
        {
            if (symbol is INamedTypeSymbol { TypeKind: not TypeKind.Error })
            {
                return;
            }

            var simpleName = typeSyntax switch
            {
                QualifiedNameSyntax qualifiedName => qualifiedName.Right.Identifier.ValueText,
                AliasQualifiedNameSyntax aliasQualifiedName => aliasQualifiedName.Name.Identifier.ValueText,
                GenericNameSyntax genericName => genericName.Identifier.ValueText,
                IdentifierNameSyntax identifierName => identifierName.Identifier.ValueText,
                _ => null
            };

            if (simpleName != null && IsGeneratedHelperSimpleName(simpleName))
            {
                AddMatchingName(references, simpleName, nodes);
            }
        }

        private static void AddBodyTypeReference(HashSet<string> references, ITypeSymbol? symbol, HashSet<string> nodes)
        {
            if (symbol is not INamedTypeSymbol namedType || namedType.TypeKind == TypeKind.Error)
            {
                return;
            }

            if (IsGeneratedHelperSimpleName(namedType.Name))
            {
                AddMatchingName(references, namedType.Name, nodes);
            }
            AddMatchingName(references, namedType.GetFullyQualifiedName(), nodes);
            if (namedType.TypeKind == TypeKind.Enum)
            {
                AddMatchingName(references, $"{namedType.Name}Extensions", nodes);
            }

            foreach (var typeArgument in namedType.TypeArguments)
            {
                AddBodyTypeReference(references, typeArgument, nodes);
            }
        }

        private static void AddGeneratedReferencesToHelper(Project project, Compilation compilation, ProviderReferenceGraph graph, string helperName, ISymbol symbol)
        {
            foreach (var reference in SymbolFinder.FindReferencesAsync(symbol, project.Solution).GetAwaiter().GetResult())
            {
                foreach (var location in reference.Locations)
                {
                    var document = location.Document;
                    if (!IsGeneratedDocument(document))
                    {
                        continue;
                    }

                    var root = document.GetSyntaxRootAsync().GetAwaiter().GetResult();
                    if (root == null)
                    {
                        continue;
                    }

                    var node = root.FindNode(location.Location.SourceSpan);
                    var owner = node.AncestorsAndSelf().OfType<BaseTypeDeclarationSyntax>().FirstOrDefault();
                    if (owner == null)
                    {
                        continue;
                    }

                    var semanticModel = compilation.GetSemanticModel(owner.SyntaxTree);
                    if (semanticModel.GetDeclaredSymbol(owner) is not INamedTypeSymbol ownerSymbol)
                    {
                        continue;
                    }

                    var ownerName = ownerSymbol.GetFullyQualifiedName();
                    if (graph.Nodes.Contains(ownerName))
                    {
                        graph.References[ownerName].Add(helperName);
                    }
                }
            }
        }

        private static HashSet<string> GetRootNames(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes,
            HashSet<string> helperRoots,
            bool includeModelFactory,
            bool includeAdditionalRoots,
            bool includeUnionVariantRoots,
            bool publicClientRootsOnly)
        {
            var generator = CodeModelGenerator.Instance;
            var roots = new HashSet<string>(StringComparer.Ordinal);
            var modelFactoryName = GetProviderTypeName(generator.OutputLibrary.ModelFactory.Value.Type);

            foreach (var provider in providers)
            {
                var name = GetProviderTypeName(provider.Type);
                if (IsClientProviderRoot(provider, publicClientRootsOnly) ||
                    includeAdditionalRoots && provider.DeclaringTypeProvider == null && IsKept(provider.Type, generator.AdditionalRootTypes, nodes) ||
                    includeModelFactory && string.Equals(name, modelFactoryName, StringComparison.Ordinal) ||
                    includeModelFactory && helperRoots.Contains(name))
                {
                    roots.Add(name);
                }
            }

            AddLastContractModelFactorySignatureRoots(providers, roots, nodes);

            if (!includeUnionVariantRoots)
            {
                return roots;
            }

            foreach (var root in generator.TypeFactory.UnionVariantTypesToKeep)
            {
                AddMatchingName(roots, root, nodes);
            }

            foreach (var root in generator.AdditionalRootTypes)
            {
                AddMatchingName(roots, root, nodes);
            }

            return roots;
        }

        private static void AddLastContractModelFactorySignatureRoots(IReadOnlyList<TypeProvider> providers, HashSet<string> roots, HashSet<string> nodes)
        {
            foreach (var provider in providers.Where(IsModelFactoryProvider))
            {
                foreach (var method in provider.LastContractView?.Methods ?? [])
                {
                    if (!method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) ||
                        IsImplementationOnlyModelFactoryMethod(method))
                    {
                        continue;
                    }

                    AddTypeReference(roots, method.Signature.ReturnType, nodes);
                    foreach (var parameter in method.Signature.Parameters)
                    {
                        AddTypeReference(roots, parameter.Type, nodes);
                    }
                }
            }
        }

        private static bool IsImplementationOnlyModelFactoryMethod(MethodProvider method)
        {
            var returnType = method.Signature.ReturnType;
            if (returnType == null)
            {
                return true;
            }

            var returnTypeName = GetSimpleName(GetProviderTypeName(returnType));
            return returnTypeName.StartsWith("Paged", StringComparison.Ordinal) ||
                returnTypeName.EndsWith("Request", StringComparison.Ordinal);
        }

        private static HashSet<string> GetPostProcessorDeclaredNodes(IReadOnlyList<TypeProvider> providers, HashSet<string> nodes, bool publicOnly)
        {
            var generator = CodeModelGenerator.Instance;
            var excludedNames = generator.NonRootTypes;
            return GetGeneratedProviders(providers)
                .Where(provider => !IsModelFactoryProvider(provider))
                .Where(provider => !publicOnly || provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                .Select(provider => GetProviderTypeName(provider.Type))
                .Where(name => nodes.Contains(name))
                .Where(name => !excludedNames.Contains(name) && !excludedNames.Contains(GetSimpleName(name)))
                .ToHashSet(StringComparer.Ordinal);
        }

        private static bool IsKept(CSharpType type, HashSet<string> roots, HashSet<string> nodes) =>
            roots.Contains(type.Name) || roots.Contains(GetProviderTypeName(type)) && nodes.Contains(GetProviderTypeName(type));

        private static bool IsClientProviderRoot(TypeProvider provider, bool publicOnly) =>
            provider.RelativeFilePath.EndsWith("Client.cs", StringComparison.Ordinal) &&
            (!publicOnly || !HasApiBaselineDirectory() && provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));

        private static bool HasApiBaselineDirectory()
        {
            var projectDirectory = CodeModelGenerator.Instance.Configuration.ProjectDirectory;
            return !string.IsNullOrEmpty(projectDirectory) &&
                Directory.Exists(Path.GetFullPath(Path.Combine(projectDirectory, "..", "api")));
        }

        private static bool IsModelFactoryProvider(TypeProvider provider)
        {
            if (provider is ModelFactoryProvider)
            {
                return true;
            }

            var relativePath = provider.RelativeFilePath.Replace('\\', '/');
            return relativePath.EndsWith("ModelFactory.cs", StringComparison.Ordinal);
        }

        private static HashSet<string> GetHelperRootNames(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes,
            HashSet<string> reachableTypes,
            IReadOnlyDictionary<string, HashSet<string>>? references = null)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                var providerName = GetProviderTypeName(provider.Type);
                var isModelFactory = IsModelFactoryProvider(provider);
                if (!reachableTypes.Contains(providerName) && !isModelFactory)
                {
                    continue;
                }

                AddHelperDependencies(roots, provider.HelperDependencyNames, nodes, references == null ? null : references[providerName]);

                foreach (var property in provider.Properties)
                {
                    AddInitializationHelperRoot(roots, property.Type, nodes);
                    AddParameterValidationHelperRoot(roots, property.AsParameter, nodes);
                }

                foreach (var field in provider.Fields)
                {
                    AddParameterValidationHelperRoot(roots, field.AsParameter, nodes);
                }

                foreach (var constructor in provider.Constructors)
                {
                    foreach (var parameter in constructor.Signature.Parameters)
                    {
                        AddParameterValidationHelperRoot(roots, parameter, nodes);
                    }
                }

                foreach (var method in provider.Methods)
                {
                    // Only factory methods for reachable models can instantiate collection helpers.
                    if (isModelFactory &&
                        (method.Signature.ReturnType == null || !reachableTypes.Contains(GetProviderTypeName(method.Signature.ReturnType))))
                    {
                        continue;
                    }

                    foreach (var parameter in method.Signature.Parameters)
                    {
                        AddParameterValidationHelperRoot(roots, parameter, nodes);
                        if (isModelFactory)
                        {
                            AddModelFactoryCollectionInitializationHelperRoot(roots, parameter.Type, nodes);
                        }
                    }
                }
            }

            return roots;
        }

        private static void AddParameterValidationHelperRoot(HashSet<string> roots, ParameterProvider parameter, HashSet<string> nodes)
        {
            if (parameter.Validation != ParameterValidationType.None)
            {
                AddMatchingName(roots, "Argument", nodes);
            }
        }

        private static void AddHelperDependencies(
            HashSet<string> roots,
            IReadOnlyList<string> dependencies,
            HashSet<string> nodes,
            HashSet<string>? referencedNames)
        {
            foreach (var dependency in dependencies)
            {
                if (referencedNames == null)
                {
                    AddMatchingName(roots, dependency, nodes);
                    continue;
                }

                var matches = new HashSet<string>(StringComparer.Ordinal);
                AddMatchingName(matches, dependency, nodes);
                roots.UnionWith(matches.Intersect(referencedNames, StringComparer.Ordinal));
            }
        }

        private static void RemoveUnusedRequestHeaderExtensionsRoot(
            HashSet<string> roots,
            IReadOnlyDictionary<string, HashSet<string>> references,
            Project project)
        {
            var hasCustomReference = HasCustomRequestHeaderExtensionsReference(project);
            var unusedRequestHeaderExtensions = roots
                .Where(static root => root.EndsWith(".RequestHeaderExtensions", StringComparison.Ordinal))
                .Where(_ => !hasCustomReference)
                .Where(root => !references.Any(reference =>
                    !string.Equals(reference.Key, root, StringComparison.Ordinal) &&
                    reference.Value.Contains(root)))
                .ToArray();

            roots.ExceptWith(unusedRequestHeaderExtensions);
        }

        private static bool HasCustomRequestHeaderExtensionsReference(Project project)
        {
            foreach (var document in project.Documents)
            {
                if (IsGeneratedDocument(document))
                {
                    continue;
                }

                var text = document.GetTextAsync().GetAwaiter().GetResult().ToString();
                if (text.Contains("RequestHeaderExtensions", StringComparison.Ordinal) ||
                    text.Contains("SetDelimited", StringComparison.Ordinal))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool IsSerializationProvider(TypeProvider provider)
        {
            var relativePath = provider.RelativeFilePath.Replace('\\', '/');
            return relativePath.EndsWith(".Serialization.cs", StringComparison.Ordinal) ||
                relativePath.EndsWith(".Serialization.Multipart.cs", StringComparison.Ordinal);
        }

        private static bool IsGeneratedDocument(Document document)
        {
            if (GeneratedCodeWorkspace.IsGeneratedDocument(document) || GeneratedCodeWorkspace.IsGeneratedTestDocument(document))
            {
                return true;
            }

            var filePath = document.FilePath?.Replace('\\', '/');
            return filePath != null &&
                (filePath.Contains("/Generated/", StringComparison.Ordinal) ||
                    filePath.Contains("/GeneratedTests/", StringComparison.Ordinal));
        }

        private static void AddInitializationHelperRoot(HashSet<string> roots, CSharpType? type, HashSet<string> nodes)
        {
            if (type == null)
            {
                return;
            }

            var initializationType = type.PropertyInitializationType;
            if (!string.Equals(initializationType.FullyQualifiedName, type.FullyQualifiedName, StringComparison.Ordinal))
            {
                AddMatchingName(roots, initializationType.Name, nodes);
            }

            if (type is { IsList: true, IsReadOnlyMemory: false })
            {
                AddMatchingName(roots, "ChangeTrackingList", nodes);
            }

            if (type.IsDictionary)
            {
                AddMatchingName(roots, "ChangeTrackingDictionary", nodes);
            }

            foreach (var argument in type.Arguments)
            {
                AddInitializationHelperRoot(roots, argument, nodes);
            }
        }

        private static void AddModelFactoryCollectionInitializationHelperRoot(HashSet<string> roots, CSharpType? type, HashSet<string> nodes)
        {
            if (type == null)
            {
                return;
            }

            if (type is { IsList: true, IsReadOnlyMemory: false })
            {
                AddMatchingName(roots, "ChangeTrackingList", nodes);
            }

            if (type.IsDictionary)
            {
                AddMatchingName(roots, "ChangeTrackingDictionary", nodes);
            }

            foreach (var argument in type.Arguments)
            {
                AddModelFactoryCollectionInitializationHelperRoot(roots, argument, nodes);
            }
        }

        private static void AddMatchingName(HashSet<string> target, string name, HashSet<string> nodes)
        {
            if (nodes.Contains(name))
            {
                target.Add(name);
                return;
            }

            var simpleNameLookup = _simpleNameLookupCache.GetValue(nodes, BuildSimpleNameLookup);
            if (!simpleNameLookup.TryGetValue(name, out var matches))
            {
                return;
            }

            foreach (var match in matches)
            {
                target.Add(match);
            }
        }

        private static Dictionary<string, string[]> BuildSimpleNameLookup(HashSet<string> nodes)
        {
            return nodes
                .GroupBy(static node => StripGenericArity(GetSimpleName(node)), StringComparer.Ordinal)
                .ToDictionary(static group => group.Key, static group => group.ToArray(), StringComparer.Ordinal);
        }

        private static HashSet<string> GetReachableTypes(HashSet<string> roots, IReadOnlyDictionary<string, HashSet<string>> references)
        {
            return GetReachableTypes(roots, references, expandableNodes: null);
        }

        private static HashSet<string> GetReachableTypes(
            HashSet<string> roots,
            IReadOnlyDictionary<string, HashSet<string>> references,
            HashSet<string>? expandableNodes)
        {
            var reachable = new HashSet<string>(StringComparer.Ordinal);
            var queue = new Queue<string>(roots);
            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                if (!reachable.Add(current))
                {
                    continue;
                }

                if (expandableNodes != null && !expandableNodes.Contains(current))
                {
                    continue;
                }

                if (!references.TryGetValue(current, out var children))
                {
                    continue;
                }

                foreach (var child in children)
                {
                    queue.Enqueue(child);
                }
            }

            return reachable;
        }

        private static bool HasPublicApiPredecessor(
            string name,
            IReadOnlyDictionary<string, HashSet<string>> references,
            HashSet<string> publicizeReachable,
            HashSet<string> generatedImplementationInternalDeclarations)
        {
            foreach (var (owner, children) in references)
            {
                if (!publicizeReachable.Contains(owner) ||
                    string.Equals(owner, name, StringComparison.Ordinal) ||
                    generatedImplementationInternalDeclarations.Contains(owner) ||
                    !children.Contains(name))
                {
                    continue;
                }

                return true;
            }

            return false;
        }

        private static void AddSignatureReferences(
            HashSet<string> references,
            MethodSignatureBase signature,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType,
            bool includeAttributes = true)
        {
            AddTypeReference(references, signature.ReturnType, nodes, serializationProviderNamesByType);
            if (includeAttributes)
            {
                AddAttributes(references, signature.Attributes, nodes, serializationProviderNamesByType);
            }

            foreach (var parameter in signature.Parameters)
            {
                AddTypeReference(references, parameter.Type, nodes, serializationProviderNamesByType);
                if (includeAttributes)
                {
                    AddAttributes(references, parameter.Attributes, nodes, serializationProviderNamesByType);
                }
            }

            if (signature is MethodSignature methodSignature)
            {
                AddTypeReference(references, methodSignature.ExplicitInterface, nodes, serializationProviderNamesByType);
                if (methodSignature.GenericArguments != null)
                {
                    foreach (var genericArgument in methodSignature.GenericArguments)
                    {
                        AddTypeReference(references, genericArgument, nodes, serializationProviderNamesByType);
                    }
                }

                if (methodSignature.GenericParameterConstraints != null)
                {
                    foreach (var constraint in methodSignature.GenericParameterConstraints)
                    {
                        AddTypeReference(references, constraint.Type, nodes, serializationProviderNamesByType);
                    }
                }
            }

            if (signature is ConstructorSignature constructorSignature)
            {
                AddTypeReference(references, constructorSignature.Type, nodes, serializationProviderNamesByType);
            }
        }

        private static void AddAttributes(
            HashSet<string> references,
            IReadOnlyList<AttributeStatement> attributes,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType)
        {
            foreach (var attribute in attributes)
            {
                AddTypeReference(references, attribute.Type, nodes, serializationProviderNamesByType);
            }
        }

        private static void AddTypeReference(
            HashSet<string> references,
            CSharpType? type,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType = null)
        {
            if (type == null)
            {
                return;
            }

            var providerTypeName = GetProviderTypeName(type);
            if (nodes.Contains(providerTypeName))
            {
                references.Add(providerTypeName);
                if (serializationProviderNamesByType != null && serializationProviderNamesByType.TryGetValue(providerTypeName, out var serializationProviderNames))
                {
                    foreach (var serializationProviderName in serializationProviderNames)
                    {
                        references.Add(serializationProviderName);
                    }
                }
            }

            AddTypeReference(references, type.BaseType, nodes, serializationProviderNamesByType);
            AddTypeReference(references, type.DeclaringType, nodes, serializationProviderNamesByType);
            foreach (var argument in type.Arguments)
            {
                AddTypeReference(references, argument, nodes, serializationProviderNamesByType);
            }
        }

        private static string GetSimpleName(string fullyQualifiedName)
        {
            var lastDot = fullyQualifiedName.LastIndexOf('.');
            return lastDot < 0 ? fullyQualifiedName : fullyQualifiedName.Substring(lastDot + 1);
        }

        private static string GetProviderTypeName(CSharpType type)
        {
            var name = type.Arguments.Count > 0 && !type.Name.Contains('`', StringComparison.Ordinal)
                ? $"{type.Name}`{type.Arguments.Count}"
                : type.Name;
            return string.IsNullOrEmpty(type.Namespace) ? name : $"{type.Namespace}.{name}";
        }

        private static string StripGenericArity(string name)
        {
            var tick = name.IndexOf('`');
            return tick < 0 ? name : name.Substring(0, tick);
        }

        private sealed record ProviderReferenceGraph(
            HashSet<string> Nodes,
            Dictionary<string, HashSet<string>> References);
    }
}

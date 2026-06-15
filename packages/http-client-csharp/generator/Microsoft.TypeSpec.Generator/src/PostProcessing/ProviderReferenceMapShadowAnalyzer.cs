// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.FindSymbols;

namespace Microsoft.TypeSpec.Generator
{
    internal static class ProviderReferenceMapShadowAnalyzer
    {
        private const string EnableEnvironmentVariable = "TYPESPEC_PROVIDER_REFERENCE_MAP_SHADOW";
        private const string UseShadowEnvironmentVariable = "TYPESPEC_PROVIDER_REFERENCE_MAP_USE_SHADOW";
        private const string ReportEnvironmentVariable = "TYPESPEC_PROVIDER_REFERENCE_MAP_SHADOW_REPORT";
        private const string OutputDirectoryEnvironmentVariable = "TYPESPEC_PROVIDER_REFERENCE_MAP_SHADOW_DIR";

        private static ProviderReferenceMapShadowResult? _latestResult;

        public static bool IsEnabled => string.Equals(
            Environment.GetEnvironmentVariable(EnableEnvironmentVariable),
            "true",
            StringComparison.OrdinalIgnoreCase);

        public static ProviderReferenceMapShadowResult? LatestResult => _latestResult;

        public static bool UseShadowMap => string.Equals(
            Environment.GetEnvironmentVariable(UseShadowEnvironmentVariable),
            "true",
            StringComparison.OrdinalIgnoreCase);

        private static bool ShouldWriteReports => string.Equals(
            Environment.GetEnvironmentVariable(ReportEnvironmentVariable),
            "true",
            StringComparison.OrdinalIgnoreCase);

        public static void Analyze(IReadOnlyList<TypeProvider> providers, Project project)
        {
            if (!IsEnabled)
            {
                _latestResult = null;
                return;
            }

            var graph = BuildGraph(providers);
            var publicGraph = BuildGraph(providers, publicOnly: true);
            var customRoots = GetCustomCodeGeneratedTypeRoots(project, graph.Nodes);
            var internalizeReferences = CloneReferences(publicGraph.References);
            AddDerivedModelReferences(providers, publicGraph.Nodes, internalizeReferences);
            var internalizeRoots = GetRootNames(providers, graph.Nodes, helperRoots: [], includeModelFactory: false);
            internalizeRoots.UnionWith(customRoots);
            var internalizeReachableWithoutHelpers = GetReachableTypes(internalizeRoots, internalizeReferences);
            var internalizeHelperRoots = GetHelperRootNames(providers, graph.Nodes, internalizeReachableWithoutHelpers);
            internalizeRoots.UnionWith(internalizeHelperRoots);
            var internalizeReachable = GetReachableTypes(internalizeRoots, internalizeReferences);
            var internalizeDeclaredNodes = GetPostProcessorDeclaredNodes(providers, graph.Nodes, publicOnly: true);
            var internalizeCandidates = internalizeDeclaredNodes.Except(internalizeReachable, StringComparer.Ordinal).OrderBy(static name => name, StringComparer.Ordinal).ToArray();

            AddGeneratedBodyReferences(project, providers, graph);

            var removeRoots = GetRootNames(providers, graph.Nodes, helperRoots: [], includeModelFactory: true);
            removeRoots.UnionWith(customRoots);
            var removeReachableWithoutHelpers = GetReachableTypes(removeRoots, graph.References);
            var removeHelperRoots = GetHelperRootNames(providers, graph.Nodes, removeReachableWithoutHelpers);
            removeRoots.UnionWith(removeHelperRoots);
            var removeReachable = GetReachableTypes(removeRoots, graph.References);
            var removeDeclaredNodes = GetPostProcessorDeclaredNodes(providers, graph.Nodes, publicOnly: false);
            var removeCandidates = removeDeclaredNodes.Except(removeReachable, StringComparer.Ordinal).OrderBy(static name => name, StringComparer.Ordinal).ToArray();

            var helperRoots = internalizeHelperRoots.Concat(removeHelperRoots).ToHashSet(StringComparer.Ordinal);

            _latestResult = new ProviderReferenceMapShadowResult(
                project.Id,
                internalizeCandidates.ToHashSet(StringComparer.Ordinal),
                removeCandidates.ToHashSet(StringComparer.Ordinal));

            if (ShouldWriteReports)
            {
                WriteReport(graph, customRoots, helperRoots, internalizeRoots, internalizeReachable, internalizeCandidates, removeRoots, removeReachable, removeCandidates);
            }
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
                if (GeneratedCodeWorkspace.IsGeneratedDocument(document) || GeneratedCodeWorkspace.IsGeneratedTestDocument(document))
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

        private static void AddSymbolRoot(HashSet<string> roots, ITypeSymbol? symbol, HashSet<string> generatedTypeNames)
        {
            if (symbol is not INamedTypeSymbol namedType)
            {
                return;
            }

            AddMatchingName(roots, namedType.GetFullyQualifiedName(), generatedTypeNames);
            foreach (var typeArgument in namedType.TypeArguments)
            {
                AddSymbolRoot(roots, typeArgument, generatedTypeNames);
            }
        }

        public static void WriteComparisonReport(string passName, IEnumerable<string> roslynCandidates, IEnumerable<string> providerCandidates)
        {
            if (!IsEnabled || !ShouldWriteReports)
            {
                return;
            }

            var roslynSet = roslynCandidates.ToHashSet(StringComparer.Ordinal);
            var providerSet = providerCandidates.ToHashSet(StringComparer.Ordinal);
            var missingFromProvider = roslynSet.Except(providerSet, StringComparer.Ordinal).OrderBy(static name => name, StringComparer.Ordinal).ToArray();
            var extraInProvider = providerSet.Except(roslynSet, StringComparer.Ordinal).OrderBy(static name => name, StringComparer.Ordinal).ToArray();

            var directory = GetOutputDirectory();
            Directory.CreateDirectory(directory);
            var path = Path.Combine(directory, $"provider-reference-map-shadow-comparison-{passName}-{DateTime.UtcNow:yyyyMMddHHmmssfff}.txt");
            var builder = new StringBuilder();
            builder.AppendLine($"Provider reference map shadow comparison: {passName}");
            builder.AppendLine($"Roslyn candidates: {roslynSet.Count}");
            builder.AppendLine($"Provider candidates: {providerSet.Count}");
            builder.AppendLine($"Missing from provider: {missingFromProvider.Length}");
            builder.AppendLine($"Extra in provider: {extraInProvider.Length}");
            builder.AppendLine();
            builder.AppendLine("Missing from provider:");
            foreach (var item in missingFromProvider)
            {
                builder.AppendLine($"  {item}");
            }

            builder.AppendLine();
            builder.AppendLine("Extra in provider:");
            foreach (var item in extraInProvider)
            {
                builder.AppendLine($"  {item}");
            }

            File.WriteAllText(path, builder.ToString());
            CodeModelGenerator.Instance.Emitter.Debug($"Provider reference map shadow comparison written to {path}");
        }

        private static ProviderReferenceGraph BuildGraph(IReadOnlyList<TypeProvider> providers, bool publicOnly = false)
        {
            var generatedProviders = GetGeneratedProviders(providers);
            var nodes = generatedProviders
                .Select(static provider => GetProviderTypeName(provider.Type))
                .ToHashSet(StringComparer.Ordinal);
            var references = nodes.ToDictionary(static name => name, _ => new HashSet<string>(StringComparer.Ordinal), StringComparer.Ordinal);

            foreach (var provider in generatedProviders)
            {
                var current = GetProviderTypeName(provider.Type);
                AddTypeReference(references[current], provider.Type, nodes);
                AddTypeReference(references[current], provider.BaseType, nodes);
                AddTypeReference(references[current], provider.DeclaringTypeProvider?.Type, nodes);

                if (IsKept(provider.Type, CodeModelGenerator.Instance.NonRootTypes, nodes))
                {
                    continue;
                }

                if (IsModelFactoryProvider(provider))
                {
                    continue;
                }

                foreach (var implementedType in provider.Implements)
                {
                    AddTypeReference(references[current], implementedType, nodes);
                }

                foreach (var nestedType in provider.NestedTypes)
                {
                    AddTypeReference(references[current], nestedType.Type, nodes);
                }

                foreach (var serializationProvider in provider.SerializationProviders)
                {
                    AddTypeReference(references[current], serializationProvider.Type, nodes);
                }

                foreach (var property in provider.Properties)
                {
                    if (publicOnly && !IsPublic(property.Modifiers))
                    {
                        continue;
                    }

                    AddTypeReference(references[current], property.Type, nodes);
                    AddTypeReference(references[current], property.ExplicitInterface, nodes);
                    AddAttributes(references[current], property.Attributes, nodes);
                }

                foreach (var field in provider.Fields)
                {
                    if (publicOnly && !field.Modifiers.HasFlag(FieldModifiers.Public))
                    {
                        continue;
                    }

                    AddTypeReference(references[current], field.Type, nodes);
                    AddAttributes(references[current], field.Attributes, nodes);
                }

                foreach (var constructor in provider.Constructors)
                {
                    if (publicOnly && !IsPublic(constructor.Signature.Modifiers))
                    {
                        continue;
                    }

                    AddSignatureReferences(references[current], constructor.Signature, nodes);
                }

                foreach (var method in provider.Methods)
                {
                    if (publicOnly && !IsPublic(method.Signature.Modifiers))
                    {
                        continue;
                    }

                    AddSignatureReferences(references[current], method.Signature, nodes);
                    AddTypeReference(references[current], GetCollectionDefinitionType(method), nodes);
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
            Dictionary<string, HashSet<string>> references)
        {
            foreach (var provider in providers.OfType<ModelProvider>())
            {
                var providerName = GetProviderTypeName(provider.Type);
                if (!nodes.Contains(providerName))
                {
                    continue;
                }

                foreach (var derivedModel in provider.DerivedModels)
                {
                    AddTypeReference(references[providerName], derivedModel.Type, nodes);
                }
            }
        }

        private static IReadOnlyList<TypeProvider> GetGeneratedProviders(IReadOnlyList<TypeProvider> providers)
        {
            var generatedProviders = new List<TypeProvider>();
            foreach (var provider in providers)
            {
                generatedProviders.Add(provider);
                generatedProviders.AddRange(provider.SerializationProviders);
            }

            return generatedProviders;
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

                AddProviderBodyDependencyTypes(graph.References[providerName], provider.BodyDependencyTypes, graph.Nodes);

                if (provider.BodyDependencyTypes.Count > 0)
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
                provider.BodyDependencyTypes.Count > 0;
        }

        private static void AddGeneratedBodyTypeReferences(Project project, Compilation compilation, ProviderReferenceGraph graph, string ownerName, INamedTypeSymbol ownerSymbol)
        {
            foreach (var syntaxReference in ownerSymbol.DeclaringSyntaxReferences)
            {
                var document = project.GetDocument(syntaxReference.SyntaxTree);
                if (document == null || !GeneratedCodeWorkspace.IsGeneratedDocument(document))
                {
                    continue;
                }

                var root = syntaxReference.SyntaxTree.GetRoot();
                var semanticModel = compilation.GetSemanticModel(syntaxReference.SyntaxTree);
                foreach (var typeSyntax in root.DescendantNodes().OfType<TypeSyntax>())
                {
                    if (typeSyntax.Parent is BaseTypeDeclarationSyntax baseTypeDeclaration && baseTypeDeclaration.Identifier.Span == typeSyntax.Span)
                    {
                        continue;
                    }

                    AddBodyTypeReference(graph.References[ownerName], semanticModel.GetTypeInfo(typeSyntax).Type, graph.Nodes);
                }
            }
        }

        private static void AddBodyTypeReference(HashSet<string> references, ITypeSymbol? symbol, HashSet<string> nodes)
        {
            if (symbol is not INamedTypeSymbol namedType || namedType.TypeKind == TypeKind.Error)
            {
                return;
            }

            AddMatchingName(references, namedType.GetFullyQualifiedName(), nodes);
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
                    if (!GeneratedCodeWorkspace.IsGeneratedDocument(document))
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

        private static HashSet<string> GetRootNames(IReadOnlyList<TypeProvider> providers, HashSet<string> nodes, HashSet<string> helperRoots, bool includeModelFactory)
        {
            var generator = CodeModelGenerator.Instance;
            var roots = new HashSet<string>(StringComparer.Ordinal);
            var modelFactoryName = GetProviderTypeName(generator.OutputLibrary.ModelFactory.Value.Type);

            foreach (var provider in providers)
            {
                var name = GetProviderTypeName(provider.Type);
                if (IsClientProviderRoot(provider) ||
                    IsKept(provider.Type, generator.AdditionalRootTypes, nodes) ||
                    includeModelFactory && string.Equals(name, modelFactoryName, StringComparison.Ordinal) ||
                    includeModelFactory && helperRoots.Contains(name))
                {
                    roots.Add(name);
                }
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

        private static bool IsClientProviderRoot(TypeProvider provider) =>
            provider.RelativeFilePath.EndsWith("Client.cs", StringComparison.Ordinal);

        private static bool IsModelFactoryProvider(TypeProvider provider) => provider is ModelFactoryProvider;

        private static HashSet<string> GetHelperRootNames(IReadOnlyList<TypeProvider> providers, HashSet<string> nodes, HashSet<string> reachableTypes)
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

                AddHelperDependencies(roots, provider.HelperDependencyNames, nodes);

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

        private static bool IsSerializationProvider(TypeProvider provider)
        {
            var relativePath = provider.RelativeFilePath.Replace('\\', '/');
            return relativePath.EndsWith(".Serialization.cs", StringComparison.Ordinal) ||
                relativePath.EndsWith(".Serialization.Multipart.cs", StringComparison.Ordinal);
        }

        private static void AddHelperDependencies(HashSet<string> roots, IReadOnlyList<string> dependencies, HashSet<string> nodes)
        {
            foreach (var dependency in dependencies)
            {
                AddMatchingName(roots, dependency, nodes);
            }
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

            foreach (var node in nodes)
            {
                if (string.Equals(StripGenericArity(GetSimpleName(node)), name, StringComparison.Ordinal))
                {
                    target.Add(node);
                }
            }
        }

        private static HashSet<string> GetReachableTypes(HashSet<string> roots, IReadOnlyDictionary<string, HashSet<string>> references)
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

        private static void AddSignatureReferences(HashSet<string> references, MethodSignatureBase signature, HashSet<string> nodes)
        {
            AddTypeReference(references, signature.ReturnType, nodes);
            AddAttributes(references, signature.Attributes, nodes);

            foreach (var parameter in signature.Parameters)
            {
                AddTypeReference(references, parameter.Type, nodes);
                AddAttributes(references, parameter.Attributes, nodes);
            }

            if (signature is MethodSignature methodSignature)
            {
                AddTypeReference(references, methodSignature.ExplicitInterface, nodes);
                if (methodSignature.GenericArguments != null)
                {
                    foreach (var genericArgument in methodSignature.GenericArguments)
                    {
                        AddTypeReference(references, genericArgument, nodes);
                    }
                }

                if (methodSignature.GenericParameterConstraints != null)
                {
                    foreach (var constraint in methodSignature.GenericParameterConstraints)
                    {
                        AddTypeReference(references, constraint.Type, nodes);
                    }
                }
            }

            if (signature is ConstructorSignature constructorSignature)
            {
                AddTypeReference(references, constructorSignature.Type, nodes);
            }
        }

        private static void AddAttributes(HashSet<string> references, IReadOnlyList<AttributeStatement> attributes, HashSet<string> nodes)
        {
            foreach (var attribute in attributes)
            {
                AddTypeReference(references, attribute.Type, nodes);
            }
        }

        private static void AddTypeReference(HashSet<string> references, CSharpType? type, HashSet<string> nodes)
        {
            if (type == null)
            {
                return;
            }

            var providerTypeName = GetProviderTypeName(type);
            if (nodes.Contains(providerTypeName))
            {
                references.Add(providerTypeName);
            }

            AddTypeReference(references, type.BaseType, nodes);
            AddTypeReference(references, type.DeclaringType, nodes);
            foreach (var argument in type.Arguments)
            {
                AddTypeReference(references, argument, nodes);
            }
        }

        private static void WriteReport(
            ProviderReferenceGraph graph,
            HashSet<string> customRoots,
            HashSet<string> helperRoots,
            HashSet<string> internalizeRoots,
            HashSet<string> internalizeReachable,
            IReadOnlyList<string> internalizeCandidates,
            HashSet<string> removeRoots,
            HashSet<string> removeReachable,
            IReadOnlyList<string> removeCandidates)
        {
            var directory = GetOutputDirectory();

            Directory.CreateDirectory(directory);
            var path = Path.Combine(directory, $"provider-reference-map-shadow-{DateTime.UtcNow:yyyyMMddHHmmssfff}.txt");
            var builder = new StringBuilder();
            builder.AppendLine("Provider reference map shadow report");
            builder.AppendLine($"Declared providers: {graph.Nodes.Count}");
            builder.AppendLine($"Internalize roots: {internalizeRoots.Count}");
            builder.AppendLine($"Internalize reachable: {internalizeReachable.Count}");
            builder.AppendLine($"Internalize candidates: {internalizeCandidates.Count}");
            builder.AppendLine($"Custom roots: {customRoots.Count}");
            builder.AppendLine($"Helper roots: {helperRoots.Count}");
            builder.AppendLine($"Remove roots: {removeRoots.Count}");
            builder.AppendLine($"Remove reachable: {removeReachable.Count}");
            builder.AppendLine($"Remove candidates: {removeCandidates.Count}");
            builder.AppendLine();
            builder.AppendLine("Custom roots:");
            foreach (var root in customRoots.OrderBy(static name => name, StringComparer.Ordinal))
            {
                builder.AppendLine($"  {root}");
            }

            builder.AppendLine();
            builder.AppendLine("Helper roots:");
            foreach (var root in helperRoots.OrderBy(static name => name, StringComparer.Ordinal))
            {
                builder.AppendLine($"  {root}");
            }

            builder.AppendLine();
            builder.AppendLine("Internalize roots:");
            foreach (var root in internalizeRoots.OrderBy(static name => name, StringComparer.Ordinal))
            {
                builder.AppendLine($"  {root}");
            }

            builder.AppendLine();
            builder.AppendLine("Internalize candidates:");
            foreach (var candidate in internalizeCandidates)
            {
                builder.AppendLine($"  {candidate}");
            }

            builder.AppendLine();
            builder.AppendLine("Remove roots:");
            foreach (var root in removeRoots.OrderBy(static name => name, StringComparer.Ordinal))
            {
                builder.AppendLine($"  {root}");
            }

            builder.AppendLine();
            builder.AppendLine("Remove candidates:");
            foreach (var candidate in removeCandidates)
            {
                builder.AppendLine($"  {candidate}");
            }

            builder.AppendLine();
            builder.AppendLine("References:");
            foreach (var (type, references) in graph.References.OrderBy(static item => item.Key, StringComparer.Ordinal))
            {
                builder.AppendLine($"  {type}");
                foreach (var reference in references.OrderBy(static name => name, StringComparer.Ordinal))
                {
                    builder.AppendLine($"    -> {reference}");
                }
            }

            File.WriteAllText(path, builder.ToString());
            CodeModelGenerator.Instance.Emitter.Debug($"Provider reference map shadow report written to {path}");
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

        private static string GetOutputDirectory()
        {
            var directory = Environment.GetEnvironmentVariable(OutputDirectoryEnvironmentVariable);
            return string.IsNullOrWhiteSpace(directory)
                ? Path.Combine(Path.GetTempPath(), "typespec-provider-reference-map-shadow")
                : Path.GetFullPath(directory);
        }
    }
}

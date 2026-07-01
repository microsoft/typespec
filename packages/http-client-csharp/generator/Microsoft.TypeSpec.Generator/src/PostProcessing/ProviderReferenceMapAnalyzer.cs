// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Microsoft.TypeSpec.Generator
{
    internal static class ProviderReferenceMapAnalyzer
    {
        private static ProviderReferenceMapResult? _latestResult;
        private static readonly ConditionalWeakTable<HashSet<string>, Dictionary<string, string[]>> _simpleNameLookupCache = new();
        private static TypeProvider? _preWriteModelFactory;
        private static MethodProvider[]? _preWriteModelFactoryMethods;

        public static ProviderReferenceMapResult? LatestResult => _latestResult;
        public static bool PreWriteAccessibilityApplied { get; private set; }

        public static void ResetPreWriteAccessibility()
        {
            RestorePreWriteModelFactoryMethods();
            PreWriteAccessibilityApplied = false;
        }

        public static void ApplyPreWriteAccessibility(IReadOnlyList<TypeProvider> providers, Project customCodeProject)
        {
            PreWriteAccessibilityApplied = false;
            if (Configuration.UnreferencedTypesHandling == Configuration.UnreferencedTypesHandlingOption.KeepAll)
            {
                return;
            }

            // Accessibility is applied to providers before TypeProviderWriter runs so generated source
            // starts with the final public/internal shape instead of being rewritten by Roslyn later.
            var (internalizeCandidates, publicizeCandidates) = GetPreWriteAccessibilityCandidates(providers, customCodeProject);
            foreach (var provider in GetGeneratedProviders(providers))
            {
                var providerName = GetProviderTypeName(provider.Type);
                if (internalizeCandidates.Contains(providerName))
                {
                    provider.PreserveXmlDocs();
                    provider.Update(modifiers: MakeInternal(provider.DeclarationModifiers));
                }
                else if (publicizeCandidates.Contains(providerName))
                {
                    provider.Update(modifiers: MakePublic(provider.DeclarationModifiers));
                }
            }

            RemoveMethodsFromModelFactory(internalizeCandidates.Select(GetSimpleName).ToHashSet(StringComparer.Ordinal));
            PreWriteAccessibilityApplied = true;
        }

        public static void RestorePreWriteModelFactoryMethods()
        {
            if (_preWriteModelFactory == null || _preWriteModelFactoryMethods == null)
            {
                return;
            }

            _preWriteModelFactory.Update(methods: _preWriteModelFactoryMethods);
            _preWriteModelFactory = null;
            _preWriteModelFactoryMethods = null;
        }

        public static void Analyze(IReadOnlyList<TypeProvider> providers, Project project)
        {
            var generatedProviders = GetGeneratedProviders(providers);
            // The provider graph replaces the old Roslyn-generated-source reference map for generated
            // code. We still keep custom-source syntax/symbol checks because users can reference
            // generated types from arbitrary C# that is not represented by TypeProviders.
            var graph = BuildGraph(generatedProviders);
            var publicGraph = BuildGraph(generatedProviders, publicOnly: true);

            // Generated-code dependencies come from providers. Custom code still needs Roslyn
            // because arbitrary user C# can reference generated types in ways providers cannot see.
            var customPublicRoots = GetCustomCodePublicGeneratedTypeRoots(project, graph.Nodes);
            var apiBaselineGeneratedTypeRoots = GetApiBaselineGeneratedTypeRoots(graph.Nodes);
            customPublicRoots.UnionWith(apiBaselineGeneratedTypeRoots);
            var generatedPublicDeclarations = GetGeneratedPublicTypeDeclarations(generatedProviders, graph.Nodes);
            customPublicRoots.UnionWith(generatedPublicDeclarations);
            var customRemovalRoots = GetCustomCodeGeneratedTypeRoots(project, graph.Nodes);
            customRemovalRoots.UnionWith(apiBaselineGeneratedTypeRoots);
            customRemovalRoots.UnionWith(generatedPublicDeclarations);
            var customInternalDeclarations = GetCustomCodeInternalGeneratedTypeDeclarations(project, graph.Nodes);
            var generatedInternalDeclarations = GetGeneratedInternalTypeDeclarations(generatedProviders, graph.Nodes);

            // Helper types are rooted after an initial reachability pass so unused infrastructure
            // such as change-tracking dictionaries can still be removed when no reachable type needs them.
            var generatedDiscriminatorBaseNames = GetGeneratedPersistableModelProxyTypeNames(project, publicGraph.Nodes);
            AddGeneratedXmlDocCrefReferences(project, publicGraph, publicOnly: true);
            var (internalizeCandidates, publicizeCandidates, internalizeHelperRoots) = GetAccessibilityCandidates(
                providers,
                generatedProviders,
                graph,
                publicGraph,
                customPublicRoots,
                customInternalDeclarations,
                generatedInternalDeclarations,
                generatedDiscriminatorBaseNames);

            // Body-only generated dependencies are intentionally added after public reachability is
            // computed: they keep helper files from being removed but must not force public API types
            // to remain public.
            AddGeneratedXmlDocCrefReferences(project, graph, publicOnly: false);
            AddGeneratedBodyReferences(project, providers, graph);

            var removeRoots = GetRootNames(
                providers,
                graph.Nodes,
                helperRoots: [],
                includeModelFactory: true,
                includeAdditionalRoots: true,
                includeUnionVariantRoots: ShouldUseUnionVariantFallbackRoots(),
                publicClientRootsOnly: false);
            removeRoots.UnionWith(customRemovalRoots);
            RemoveUnusedRequestHeaderExtensionsRoot(removeRoots, graph.References, project);
            var removeReachableWithoutHelpers = GetReachableTypes(removeRoots, graph.References);
            AddDerivedModelReferences(providers, graph.Nodes, graph.References, removeReachableWithoutHelpers, generatedDiscriminatorBaseNames);
            removeReachableWithoutHelpers = GetReachableTypes(removeRoots, graph.References);
            AddBasePreservedReferences(generatedProviders, graph.Nodes, graph.References, removeReachableWithoutHelpers);
            var removeHelperRoots = GetHelperRootNames(generatedProviders, graph.Nodes, removeReachableWithoutHelpers, graph.References);
            removeRoots.UnionWith(removeHelperRoots);
            var removeReachable = GetReachableTypes(removeRoots, graph.References);
            AddBasePreservedReferences(generatedProviders, graph.Nodes, graph.References, removeReachable);
            var removeDeclaredNodes = GetPostProcessorDeclaredNodes(generatedProviders, graph.Nodes, publicOnly: false);
            var removeCandidates = removeDeclaredNodes.Except(removeReachable, StringComparer.Ordinal).OrderBy(static name => name, StringComparer.Ordinal).ToArray();
            var helperRoots = internalizeHelperRoots.Concat(removeHelperRoots).ToHashSet(StringComparer.Ordinal);

            _latestResult = new ProviderReferenceMapResult(
                project.Id,
                internalizeCandidates,
                publicizeCandidates,
                removeCandidates.ToHashSet(StringComparer.Ordinal));
        }

        private static (HashSet<string> InternalizeCandidates, HashSet<string> PublicizeCandidates) GetPreWriteAccessibilityCandidates(IReadOnlyList<TypeProvider> providers, Project customCodeProject)
        {
            var generatedProviders = GetGeneratedProviders(providers);
            var graph = BuildGraph(generatedProviders);
            var publicGraph = BuildGraph(generatedProviders, publicOnly: true);
            var customPublicRoots = GetCustomCodePublicGeneratedTypeRoots(generatedProviders, graph.Nodes);
            customPublicRoots.UnionWith(GetCustomCodePublicGeneratedTypeRootsFromSyntax(customCodeProject, graph.Nodes));
            var apiBaselineGeneratedTypeRoots = GetApiBaselineGeneratedTypeRoots(graph.Nodes);
            customPublicRoots.UnionWith(apiBaselineGeneratedTypeRoots);
            var generatedPublicDeclarations = GetGeneratedPublicTypeDeclarations(generatedProviders, graph.Nodes);
            customPublicRoots.UnionWith(generatedPublicDeclarations);
            var customInternalDeclarations = GetCustomCodeInternalGeneratedTypeDeclarations(generatedProviders, graph.Nodes);
            var generatedInternalDeclarations = GetGeneratedInternalTypeDeclarations(generatedProviders, graph.Nodes);
            var generatedDiscriminatorBaseNames = new HashSet<string>(StringComparer.Ordinal);

            var (internalizeCandidates, publicizeCandidates, _) = GetAccessibilityCandidates(
                providers,
                generatedProviders,
                graph,
                publicGraph,
                customPublicRoots,
                customInternalDeclarations,
                generatedInternalDeclarations,
                generatedDiscriminatorBaseNames);

            return (internalizeCandidates, publicizeCandidates);
        }

        private static (HashSet<string> InternalizeCandidates, HashSet<string> PublicizeCandidates, HashSet<string> InternalizeHelperRoots) GetAccessibilityCandidates(
            IReadOnlyList<TypeProvider> providers,
            IReadOnlyList<TypeProvider> generatedProviders,
            ProviderReferenceGraph graph,
            ProviderReferenceGraph publicGraph,
            HashSet<string> customPublicRoots,
            HashSet<string> customInternalDeclarations,
            HashSet<string> generatedInternalDeclarations,
            HashSet<string> generatedDiscriminatorBaseNames)
        {
            var internalizeReferences = CloneReferences(publicGraph.References);
            var internalizeRoots = GetRootNames(providers, graph.Nodes, helperRoots: [], includeModelFactory: false, includeAdditionalRoots: true, includeUnionVariantRoots: false, publicClientRootsOnly: true);
            if (ShouldUseUnionVariantFallbackRoots())
            {
                AddUnionVariantRoots(internalizeRoots, providers, graph.Nodes);
            }

            var generatedPublicReachable = GetReachableTypes(internalizeRoots, internalizeReferences);
            AddDerivedModelReferences(providers, publicGraph.Nodes, internalizeReferences, generatedPublicReachable, generatedDiscriminatorBaseNames);
            internalizeRoots.UnionWith(customPublicRoots);
            var internalizeReachableWithoutHelpers = GetReachableTypes(internalizeRoots, internalizeReferences);
            AddDerivedModelReferences(providers, publicGraph.Nodes, internalizeReferences, internalizeReachableWithoutHelpers, generatedDiscriminatorBaseNames);
            internalizeReachableWithoutHelpers = GetReachableTypes(internalizeRoots, internalizeReferences);
            var publicizeRoots = internalizeRoots.ToHashSet(StringComparer.Ordinal);
            var internalizeHelperRoots = GetHelperRootNames(generatedProviders, graph.Nodes, internalizeReachableWithoutHelpers);
            internalizeRoots.UnionWith(internalizeHelperRoots);
            var internalizeDeclaredNodes = GetPostProcessorDeclaredNodes(generatedProviders, graph.Nodes, publicOnly: true);
            var customInternalBoundaryNodes = graph.Nodes
                .Where(name => publicGraph.References.TryGetValue(name, out var references) && references.Overlaps(customInternalDeclarations))
                .ToHashSet(StringComparer.Ordinal);
            var publicizeDeclaredNodes = GetPostProcessorDeclaredNodes(generatedProviders, graph.Nodes, publicOnly: false)
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
                .Union(internalizeDeclaredNodes
                    .Intersect(customInternalBoundaryNodes, StringComparer.Ordinal)
                    .Except(publicizeRoots, StringComparer.Ordinal), StringComparer.Ordinal)
                .ToHashSet(StringComparer.Ordinal);
            var publicizeCandidates = publicizeDeclaredNodes
                .Except(customInternalDeclarations, StringComparer.Ordinal)
                .Except(customInternalBoundaryNodes, StringComparer.Ordinal)
                .Except(internalizeHelperRoots, StringComparer.Ordinal)
                .Except(GetRootNames(providers, graph.Nodes, helperRoots: [], includeModelFactory: true, includeAdditionalRoots: true, includeUnionVariantRoots: true, publicClientRootsOnly: true), StringComparer.Ordinal)
                .Intersect(publicizeReachable, StringComparer.Ordinal)
                .Where(name => !generatedInternalDeclarations.Contains(name) || publicizeRoots.Contains(name))
                .Where(name => publicizeRoots.Contains(name) ||
                    HasPublicApiPredecessor(name, internalizeReferences, publicizeReachable, generatedImplementationInternalDeclarations))
                .ToHashSet(StringComparer.Ordinal);

            return (internalizeCandidates, publicizeCandidates, internalizeHelperRoots);
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

        private static HashSet<string> GetCustomCodePublicGeneratedTypeRoots(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                if (!customCodeView.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                {
                    continue;
                }

                AddCustomCodeViewRoots(roots, customCodeView, generatedTypeNames, publicOnly: true);
            }

            return roots;
        }

        private static HashSet<string> GetCustomCodePublicGeneratedTypeRootsFromSyntax(Project project, HashSet<string> generatedTypeNames)
        {
            var roots = new HashSet<string>(StringComparer.Ordinal);
            foreach (var document in project.Documents)
            {
                if (GeneratedCodeWorkspace.IsGeneratedDocument(document))
                {
                    continue;
                }

                var root = document.GetSyntaxRootAsync().GetAwaiter().GetResult();
                if (root == null)
                {
                    continue;
                }

                foreach (var typeDeclaration in root.DescendantNodes().OfType<TypeDeclarationSyntax>())
                {
                    if (!IsPublic(typeDeclaration.Modifiers))
                    {
                        continue;
                    }

                    AddMatchingName(roots, typeDeclaration.Identifier.ValueText, generatedTypeNames);

                    if (typeDeclaration.BaseList != null)
                    {
                        AddSyntaxTypeReferences(roots, typeDeclaration.BaseList, generatedTypeNames);
                    }

                    foreach (var member in typeDeclaration.Members)
                    {
                        if (IsPublicApiMember(member))
                        {
                            AddMemberSignatureTypeReferences(roots, member, generatedTypeNames);
                        }
                    }
                }
            }

            return roots;
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

        private static void AddMemberSignatureTypeReferences(HashSet<string> roots, MemberDeclarationSyntax member, HashSet<string> generatedTypeNames)
        {
            switch (member)
            {
                case MethodDeclarationSyntax method:
                    AddSyntaxTypeReferences(roots, method.ReturnType, generatedTypeNames);
                    AddSyntaxTypeReferences(roots, method.ParameterList, generatedTypeNames);
                    AddSyntaxTypeReferences(roots, method.ConstraintClauses, generatedTypeNames);
                    break;
                case ConstructorDeclarationSyntax constructor:
                    AddSyntaxTypeReferences(roots, constructor.ParameterList, generatedTypeNames);
                    break;
                case ConversionOperatorDeclarationSyntax conversion:
                    AddSyntaxTypeReferences(roots, conversion.Type, generatedTypeNames);
                    AddSyntaxTypeReferences(roots, conversion.ParameterList, generatedTypeNames);
                    break;
                case OperatorDeclarationSyntax @operator:
                    AddSyntaxTypeReferences(roots, @operator.ReturnType, generatedTypeNames);
                    AddSyntaxTypeReferences(roots, @operator.ParameterList, generatedTypeNames);
                    break;
                case PropertyDeclarationSyntax property:
                    AddSyntaxTypeReferences(roots, property.Type, generatedTypeNames);
                    break;
                case IndexerDeclarationSyntax indexer:
                    AddSyntaxTypeReferences(roots, indexer.Type, generatedTypeNames);
                    AddSyntaxTypeReferences(roots, indexer.ParameterList, generatedTypeNames);
                    break;
                case FieldDeclarationSyntax field:
                    AddSyntaxTypeReferences(roots, field.Declaration.Type, generatedTypeNames);
                    break;
                case EventFieldDeclarationSyntax eventField:
                    AddSyntaxTypeReferences(roots, eventField.Declaration.Type, generatedTypeNames);
                    break;
                case EventDeclarationSyntax @event:
                    AddSyntaxTypeReferences(roots, @event.Type, generatedTypeNames);
                    break;
                case DelegateDeclarationSyntax @delegate:
                    AddSyntaxTypeReferences(roots, @delegate.ReturnType, generatedTypeNames);
                    AddSyntaxTypeReferences(roots, @delegate.ParameterList, generatedTypeNames);
                    AddSyntaxTypeReferences(roots, @delegate.ConstraintClauses, generatedTypeNames);
                    break;
                case BaseTypeDeclarationSyntax type:
                    if (type.BaseList != null)
                    {
                        AddSyntaxTypeReferences(roots, type.BaseList, generatedTypeNames);
                    }
                    break;
            }
        }

        private static void AddSyntaxTypeReferences(HashSet<string> roots, SyntaxNode node, HashSet<string> generatedTypeNames)
        {
            foreach (var name in node.DescendantNodesAndSelf().OfType<IdentifierNameSyntax>())
            {
                AddMatchingName(roots, name.Identifier.ValueText, generatedTypeNames);
            }

            foreach (var name in node.DescendantNodesAndSelf().OfType<GenericNameSyntax>())
            {
                AddMatchingName(roots, name.Identifier.ValueText, generatedTypeNames);
            }
        }

        private static void AddSyntaxTypeReferences(HashSet<string> roots, IEnumerable<SyntaxNode> nodes, HashSet<string> generatedTypeNames)
        {
            foreach (var node in nodes)
            {
                AddSyntaxTypeReferences(roots, node, generatedTypeNames);
            }
        }

        private static IEnumerable<TypeProvider> GetCustomCodeViews(IReadOnlyList<TypeProvider> providers)
        {
            var visited = new HashSet<TypeProvider>();
            foreach (var provider in providers)
            {
                var customCodeView = provider.CustomCodeView;
                if (customCodeView == null || !visited.Add(customCodeView))
                {
                    continue;
                }

                yield return customCodeView;
            }
        }

        private static void AddCustomCodeViewRoots(HashSet<string> roots, TypeProvider customCodeView, HashSet<string> generatedTypeNames, bool publicOnly)
        {
            AddTypeReference(roots, customCodeView.Type, generatedTypeNames);
            AddTypeReference(roots, customCodeView.BaseType, generatedTypeNames);
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
                    AddAttributes(roots, property.Attributes, generatedTypeNames, serializationProviderNamesByType: null);
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
                    AddAttributes(roots, field.Attributes, generatedTypeNames, serializationProviderNamesByType: null);
                }
            }
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

        private static HashSet<string> GetCustomCodeInternalGeneratedTypeDeclarations(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
        {
            var declarations = new HashSet<string>(StringComparer.Ordinal);
            foreach (var customCodeView in GetCustomCodeViews(providers))
            {
                if (!customCodeView.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal))
                {
                    continue;
                }

                AddTypeReference(declarations, customCodeView.Type, generatedTypeNames);
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
            => GetGeneratedTypeDeclarationsByLastContractAccessibility(providers, generatedTypeNames, Accessibility.Internal);

        private static HashSet<string> GetGeneratedPublicTypeDeclarations(IReadOnlyList<TypeProvider> providers, HashSet<string> generatedTypeNames)
            => GetGeneratedTypeDeclarationsByLastContractAccessibility(providers, generatedTypeNames, Accessibility.Public);

        private static HashSet<string> GetGeneratedTypeDeclarationsByLastContractAccessibility(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> generatedTypeNames,
            Accessibility accessibility)
        {
            var declarations = new HashSet<string>(StringComparer.Ordinal);
            var lastContract = CodeModelGenerator.Instance.SourceInputModel.LastContract;
            foreach (var provider in GetGeneratedProviders(providers))
            {
                var providerTypeName = GetProviderTypeName(provider.Type);
                if (lastContract?.GetTypeByMetadataName(providerTypeName)?.DeclaredAccessibility != accessibility)
                {
                    continue;
                }

                AddMatchingName(declarations, providerTypeName, generatedTypeNames);
            }

            return declarations;
        }

        private static IEnumerable<string> GetGeneratedImplementationInternalTypeDeclarations(HashSet<string> generatedInternalDeclarations) =>
            generatedInternalDeclarations.Where(static name => GetSimpleName(name).StartsWith("Internal", StringComparison.Ordinal));

        private static void AddSymbolRoot(HashSet<string> roots, ITypeSymbol? symbol, HashSet<string> generatedTypeNames)
        {
            if (symbol is IArrayTypeSymbol arrayType)
            {
                AddSymbolRoot(roots, arrayType.ElementType, generatedTypeNames);
                return;
            }

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

        private static ProviderReferenceGraph BuildGraph(IReadOnlyList<TypeProvider> generatedProviders, bool publicOnly = false)
        {
            // Each generated provider becomes a node, and provider metadata supplies the edges:
            // inheritance, signatures, properties, fields, nested/serialization providers, attributes,
            // and selected implementation dependencies. This avoids parsing generated C# just to
            // rediscover generated-to-generated references.
            var serializationProviderNamesByType = generatedProviders
                .Where(static provider => provider.SerializationProviders.Count > 0)
                .GroupBy(static provider => GetProviderTypeName(provider.Type), StringComparer.Ordinal)
                .ToDictionary(
                    static group => group.Key,
                    static group => group
                        .SelectMany(static provider => provider.SerializationProviders)
                        .Select(static serializationProvider => GetProviderTypeName(serializationProvider.Type))
                        .Distinct(StringComparer.Ordinal)
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
                    if (method.IsMethodSuppressed())
                    {
                        continue;
                    }

                    if (publicOnly && !IsPublic(method.Signature.Modifiers))
                    {
                        continue;
                    }

                    AddSignatureReferences(references[current], method.Signature, nodes, serializationReferenceNamesByType, includeAttributes: !publicOnly);
                    if (!publicOnly && !ShouldUseGeneratedSourceReferences(provider))
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
        private static bool IsPublic(FieldModifiers modifiers) => modifiers.HasFlag(FieldModifiers.Public);

        private static TypeSignatureModifiers MakeInternal(TypeSignatureModifiers modifiers)
            => (modifiers & ~(TypeSignatureModifiers.Public | TypeSignatureModifiers.Private | TypeSignatureModifiers.Protected)) | TypeSignatureModifiers.Internal;

        private static TypeSignatureModifiers MakePublic(TypeSignatureModifiers modifiers)
            => (modifiers & ~(TypeSignatureModifiers.Internal | TypeSignatureModifiers.Private | TypeSignatureModifiers.Protected)) | TypeSignatureModifiers.Public;

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

        private static void AddBasePreservedReferences(
            IReadOnlyList<TypeProvider> providers,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, HashSet<string>> references,
            HashSet<string> reachableTypes)
        {
            var basePreservedRoots = new HashSet<string>(StringComparer.Ordinal);
            var addedRoot = true;
            while (addedRoot)
            {
                addedRoot = false;
                foreach (var provider in GetGeneratedProviders(providers))
                {
                    var providerName = GetProviderTypeName(provider.Type);
                    if (!nodes.Contains(providerName) || reachableTypes.Contains(providerName) || basePreservedRoots.Contains(providerName))
                    {
                        continue;
                    }

                    var baseTypeName = provider.BaseType == null ? null : GetProviderTypeName(provider.BaseType);
                    if (baseTypeName == null || !reachableTypes.Contains(baseTypeName))
                    {
                        continue;
                    }

                    if (basePreservedRoots.Add(providerName))
                    {
                        addedRoot = true;
                    }
                }

                if (addedRoot)
                {
                    reachableTypes.UnionWith(GetReachableTypes(basePreservedRoots, references));
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

                var bodyDependencyTypes = ShouldUseGeneratedSourceReferences(provider) ? [] : provider.BodyDependencyTypes;
                AddProviderBodyDependencyTypes(graph.References[providerName], bodyDependencyTypes, graph.Nodes);

                var symbol = compilation.GetTypeByMetadataName(providerName);
                if (symbol == null)
                {
                    continue;
                }

                AddGeneratedBodyTypeReferences(project, compilation, graph, providerName, symbol);
            }
        }

        private static void AddProviderBodyDependencyTypes(HashSet<string> references, IReadOnlyList<CSharpType> dependencies, HashSet<string> nodes)
        {
            foreach (var dependency in dependencies)
            {
                AddProviderBodyDependencyType(references, dependency, nodes);
            }
        }

        private static void AddProviderBodyDependencyType(HashSet<string> references, CSharpType? dependency, HashSet<string> nodes)
        {
            if (dependency == null)
            {
                return;
            }

            AddTypeReference(references, dependency, nodes);
            AddMatchingName(references, $"{dependency.Name}Extensions", nodes);

            foreach (var argument in dependency.Arguments)
            {
                AddProviderBodyDependencyType(references, argument, nodes);
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
            if (ShouldUseGeneratedSourceReferences(provider))
            {
                return true;
            }

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

        private static bool ShouldUseGeneratedSourceReferences(TypeProvider provider) =>
            provider.RelativeFilePath.EndsWith("Client.cs", StringComparison.Ordinal) &&
            provider.BodyDependencyTypes.Count == 0;

        private static void AddGeneratedXmlDocCrefReferences(Project project, ProviderReferenceGraph graph, bool publicOnly)
        {
            var compilation = project.GetCompilationAsync().GetAwaiter().GetResult();
            if (compilation == null)
            {
                return;
            }

            foreach (var providerName in graph.Nodes)
            {
                var symbol = compilation.GetTypeByMetadataName(providerName);
                if (symbol == null || publicOnly && symbol.DeclaredAccessibility != Accessibility.Public)
                {
                    continue;
                }

                foreach (var property in symbol.GetMembers().OfType<IPropertySymbol>())
                {
                    if (publicOnly && property.DeclaredAccessibility != Accessibility.Public)
                    {
                        continue;
                    }

                    var xml = property.GetDocumentationCommentXml();
                    if (string.IsNullOrEmpty(xml) ||
                        !xml.Contains("cref=\"T:", StringComparison.Ordinal))
                    {
                        continue;
                    }

                    var cRefs = XDocument.Parse(xml)
                        .Descendants()
                        .Attributes("cref")
                        .Select(static attribute => attribute.Value)
                        .Where(static cref => cref.Length > 2 && cref[0] == 'T' && cref[1] == ':')
                        .Select(static cref => cref.Substring(2));

                    foreach (var cref in cRefs)
                    {
                        AddMatchingName(graph.References[providerName], cref, graph.Nodes);
                    }
                }
            }
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
                foreach (var node in root.DescendantNodes())
                {
                    if (node is TypeSyntax typeSyntax)
                    {
                        if (IsNamespaceOrUsingName(typeSyntax))
                        {
                            continue;
                        }

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

                    if (node is InvocationExpressionSyntax invocation)
                    {
                        if (semanticModel.GetSymbolInfo(invocation).Symbol is not IMethodSymbol method)
                        {
                            continue;
                        }

                        AddBodyTypeReference(graph.References[ownerName], method.ContainingType, graph.Nodes);
                        AddBodyTypeReference(graph.References[ownerName], method.ReducedFrom?.ContainingType, graph.Nodes);
                    }
                }
            }
        }

        private static bool IsNamespaceOrUsingName(TypeSyntax typeSyntax)
        {
            for (SyntaxNode? node = typeSyntax; node != null; node = node.Parent)
            {
                if (node.Parent is BaseNamespaceDeclarationSyntax namespaceDeclaration && namespaceDeclaration.Name == node ||
                    node.Parent is UsingDirectiveSyntax usingDirective && usingDirective.Name == node)
                {
                    return true;
                }
            }

            return false;
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

            if (simpleName != null)
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

            AddUnionVariantRoots(roots, providers, nodes);

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

        private static void AddUnionVariantRoots(HashSet<string> roots, IReadOnlyList<TypeProvider> providers, HashSet<string> nodes)
        {
            var unionVariantTypesToKeep = CodeModelGenerator.Instance.TypeFactory.UnionVariantTypesToKeep;
            foreach (var provider in GetGeneratedProviders(providers))
            {
                if (!unionVariantTypesToKeep.Contains(provider.Type.Name) ||
                    string.Equals(provider.Type.Namespace, "TypeSpec.Http", StringComparison.Ordinal))
                {
                    continue;
                }

                AddMatchingName(roots, GetProviderTypeName(provider.Type), nodes);
            }
        }

        private static bool ShouldUseUnionVariantFallbackRoots() =>
            !HasApiBaselineDirectory() &&
            CodeModelGenerator.Instance.SourceInputModel.LastContract == null;

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

        private static void RemoveMethodsFromModelFactory(HashSet<string> namesToRemove)
        {
            if (namesToRemove.Count == 0)
            {
                return;
            }

            var modelFactory = CodeModelGenerator.Instance.OutputLibrary.ModelFactory.Value;
            _preWriteModelFactory = modelFactory;
            _preWriteModelFactoryMethods ??= [.. modelFactory.Methods];
            var methodsToKeep = modelFactory.Methods
                .Where(method => !namesToRemove.Contains(method.Signature.Name))
                .ToArray();
            modelFactory.Update(methods: methodsToKeep);
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
                foreach (var argument in attribute.Arguments)
                {
                    AddAttributeArgumentReference(references, argument, nodes, serializationProviderNamesByType);
                }

                foreach (var (_, argument) in attribute.PositionalArguments)
                {
                    AddAttributeArgumentReference(references, argument, nodes, serializationProviderNamesByType);
                }
            }
        }

        private static void AddAttributeArgumentReference(
            HashSet<string> references,
            ValueExpression argument,
            HashSet<string> nodes,
            IReadOnlyDictionary<string, string[]>? serializationProviderNamesByType)
        {
            if (argument is TypeOfExpression typeOf)
            {
                AddTypeReference(references, typeOf.Type, nodes, serializationProviderNamesByType);
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

            if (type.IsArray)
            {
                AddTypeReference(references, type.ElementType, nodes, serializationProviderNamesByType);
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

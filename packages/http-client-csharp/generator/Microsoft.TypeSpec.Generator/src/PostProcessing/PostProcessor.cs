// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.FindSymbols;
using Microsoft.CodeAnalysis.Simplification;
using Microsoft.CodeAnalysis.Text;

namespace Microsoft.TypeSpec.Generator
{
    internal class PostProcessor
    {
        private readonly string? _modelFactoryFullName;
        private readonly HashSet<string> _additionalNonRootTypeNames;
        private readonly HashSet<string> _typesToKeep;
        private INamedTypeSymbol? _modelFactorySymbol;

        private static GeneratedCodeWorkspacePostProcessingProfile? Profile => GeneratedCodeWorkspace.PostProcessingProfile;

        public PostProcessor(
            HashSet<string> typesToKeep,
            string? modelFactoryFullName = null,
            IEnumerable<string>? additionalNonRootTypeNames = null)
        {
            _typesToKeep = typesToKeep;
            _modelFactoryFullName = modelFactoryFullName;
            _additionalNonRootTypeNames = new HashSet<string>(additionalNonRootTypeNames ?? []);
        }

        private record TypeSymbols(
            HashSet<INamedTypeSymbol> DeclaredSymbols,
            INamedTypeSymbol? ModelFactorySymbol,
            IReadOnlyDictionary<INamedTypeSymbol, HashSet<BaseTypeDeclarationSyntax>> DeclaredNodesCache,
            IReadOnlyDictionary<Document, HashSet<INamedTypeSymbol>> DocumentsCache);

        /// <summary>
        /// This method reads the project, returns the types defined in it and build symbol caches to accelerate the calculation
        /// By default, the types defined in shared documents are not included. Please override <see cref="ShouldIncludeDocument(Document)"/> to tweak this behavior.
        /// </summary>
        /// <param name="compilation">The <see cref="Compilation"/> of the <paramref name="project"/> </param>
        /// <param name="project">The project to extract type symbols from</param>
        /// <param name="publicOnly">If <paramref name="publicOnly"/> is true, only public types will be included. If <paramref name="publicOnly"/> is false, all types will be included </param>
        /// <returns>A instance of <see cref="TypeSymbols"/> which includes the information of the declared symbols of the given accessibility, along with some useful cache that is useful in this class. </returns>
        private async Task<TypeSymbols> GetTypeSymbolsAsync(Compilation compilation,
            Project project,
            bool publicOnly = true)
        {
            var result = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default);
            var declarationCache =
                new Dictionary<INamedTypeSymbol, HashSet<BaseTypeDeclarationSyntax>>(SymbolEqualityComparer.Default);
            var documentCache = new Dictionary<Document, HashSet<INamedTypeSymbol>>();

            if (_modelFactoryFullName != null)
            {
                _modelFactorySymbol = compilation.GetTypeByMetadataName(_modelFactoryFullName);
            }

            foreach (var document in project.Documents)
            {
                if (ShouldIncludeDocument(document))
                {
                    var root = await document.GetSyntaxRootAsync();
                    if (root == null)
                    {
                        continue;
                    }

                    var semanticModel = compilation.GetSemanticModel(root.SyntaxTree);

                    foreach (var typeDeclaration in root.DescendantNodes().OfType<BaseTypeDeclarationSyntax>())
                    {
                        var symbol = semanticModel.GetDeclaredSymbol(typeDeclaration);
                        if (symbol == null)
                        {
                            continue;
                        }

                        if (publicOnly && symbol.DeclaredAccessibility != Accessibility.Public &&
                            !document.Name.StartsWith("Internal/", StringComparison.Ordinal))
                        {
                            continue;
                        }

                        AddInList(declarationCache, symbol, typeDeclaration);
                        AddInList(documentCache, document, symbol,
                            () => new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default));

                        // we do not add the model factory and additionalNonRootTypeSymbols to the declared symbol list
                        // so that it will never be included in any process of internalization or removal
                        if (SymbolEqualityComparer.Default.Equals(symbol, _modelFactorySymbol)
                            || _additionalNonRootTypeNames.Contains(symbol.Name)
                            || _additionalNonRootTypeNames.Contains(symbol.GetFullyQualifiedName()))
                        {
                            continue;
                        }

                        result.Add(symbol);
                    }
                }
            }

            return new TypeSymbols(result,
                _modelFactorySymbol,
                declarationCache.ToDictionary(kv => kv.Key, kv => kv.Value.ToHashSet(),
                    (IEqualityComparer<INamedTypeSymbol>)SymbolEqualityComparer.Default),
                documentCache.ToDictionary(kv => kv.Key,
                    kv => kv.Value.ToHashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default)));
        }

        protected virtual bool ShouldIncludeDocument(Document document) =>
            !GeneratedCodeWorkspace.IsGeneratedTestDocument(document);

        /// <summary>
        /// This method marks the "not publicly" referenced types as internal if they are previously defined as public. It will do this job in the following steps:
        /// 1. This method will read all the public types defined in the given <paramref name="project"/>, and build a cache for those symbols
        /// 2. Build a public reference map for those symbols
        /// 3. Finds all the root symbols, please override the <see cref="IsRootDocument(Document)"/> to control which document you would like to include
        /// 4. Visit all the symbols starting from the root symbols following the reference map to get all unvisited symbols
        /// 5. Change the accessibility of the unvisited symbols in step 4 to internal
        /// </summary>
        /// <param name="project">The project to process</param>
        /// <returns>The processed <see cref="Project"/>. <see cref="Project"/> is immutable, therefore this should usually be a new instance </returns>
        public async Task<Project> InternalizeAsync(Project project)
        {
            var compilation = await MeasureAsync<Compilation?>("PostProcessor.Internalize.GetCompilationAsync", () => project.GetCompilationAsync());
            if (compilation == null)
            {
                return project;
            }

            var referenceMapResult = ProviderReferenceMapAnalyzer.LatestResult;

            // first get all the declared symbols
            var definitions = await MeasureAsync("PostProcessor.Internalize.GetTypeSymbolsAsync", () => GetTypeSymbolsAsync(compilation, project, publicOnly: referenceMapResult == null));
            IEnumerable<INamedTypeSymbol> symbolsToInternalize;
            IEnumerable<INamedTypeSymbol> symbolsToPublicize = [];
            if (referenceMapResult != null)
            {
                symbolsToInternalize = Measure("PostProcessor.Internalize.UseShadowCandidates", () =>
                    GetSymbolsByName(definitions.DeclaredSymbols, referenceMapResult.InternalizeCandidates).ToArray());
                symbolsToPublicize = Measure("PostProcessor.Internalize.UseShadowPublicizeCandidates", () =>
                    GetSymbolsByName(definitions.DeclaredSymbols, referenceMapResult.PublicizeCandidates).ToArray());
            }
            else
            {
                // build the reference map
                var referenceMap =
                    await MeasureAsync(
                        "PostProcessor.Internalize.BuildPublicReferenceMapAsync",
                        () => new ReferenceMapBuilder(compilation, project).BuildPublicReferenceMapAsync(
                            definitions.DeclaredSymbols, definitions.DeclaredNodesCache));
                // get the root symbols
                var rootSymbols = await MeasureAsync("PostProcessor.Internalize.GetRootSymbolsAsync", () => GetRootSymbolsAsync(project, definitions));
                // traverse all the root and recursively add all the things we met
                var publicSymbols = Measure("PostProcessor.Internalize.VisitSymbolsFromRoot", () => VisitSymbolsFromRootAsync(rootSymbols, referenceMap).ToArray());

                symbolsToInternalize = definitions.DeclaredSymbols.Except(publicSymbols);
            }

            var nodesToInternalize = Measure("PostProcessor.Internalize.CollectNodes", () =>
            {
                var nodes = new Dictionary<BaseTypeDeclarationSyntax, DocumentId>();
                foreach (var symbol in symbolsToInternalize)
                {
                    foreach (var node in definitions.DeclaredNodesCache[symbol])
                    {
                        nodes[node] = project.GetDocumentId(node.SyntaxTree)!;
                    }
                }

                return nodes;
            });

            var nodesToPublicize = Measure("PostProcessor.Internalize.CollectPublicizeNodes", () =>
            {
                var nodes = new Dictionary<BaseTypeDeclarationSyntax, DocumentId>();
                foreach (var symbol in symbolsToPublicize)
                {
                    foreach (var node in definitions.DeclaredNodesCache[symbol])
                    {
                        nodes[node] = project.GetDocumentId(node.SyntaxTree)!;
                    }
                }

                return nodes;
            });

            project = Measure("PostProcessor.Internalize.ApplyAccessibilityChanges", () =>
                ApplyAccessibilityChanges(project, nodesToInternalize, nodesToPublicize));
            project = await MeasureAsync(
                "PostProcessor.Internalize.InternalizePublicNestedTypesInInternalTypesAsync",
                () => InternalizePublicNestedTypesInInternalTypesAsync(project));

            var modelNamesToRemove = nodesToInternalize.Keys.Select(item => item.Identifier.Text);
            if (referenceMapResult != null)
            {
                modelNamesToRemove = modelNamesToRemove.Concat(referenceMapResult.RemoveCandidates.Select(GetSimpleName));
            }
            project = await MeasureAsync(
                "PostProcessor.Internalize.RemoveMethodsFromModelFactoryAsync",
                () => RemoveMethodsFromModelFactoryAsync(project, definitions, modelNamesToRemove.ToHashSet()));

            return project;
        }

        private static async Task<Project> InternalizePublicNestedTypesInInternalTypesAsync(Project project)
        {
            foreach (var document in project.Documents.ToArray())
            {
                if (!GeneratedCodeWorkspace.IsGeneratedDocument(document))
                {
                    continue;
                }

                var root = await document.GetSyntaxRootAsync();
                if (root == null)
                {
                    continue;
                }

                var nestedPublicTypes = root.DescendantNodes()
                    .OfType<BaseTypeDeclarationSyntax>()
                    .Where(static declaration => declaration.Modifiers.Any(SyntaxKind.PublicKeyword) &&
                        declaration.Ancestors().OfType<BaseTypeDeclarationSyntax>().Any(static parent => parent.Modifiers.Any(SyntaxKind.InternalKeyword)))
                    .ToArray();
                if (nestedPublicTypes.Length == 0)
                {
                    continue;
                }

                var newRoot = root.ReplaceNodes(nestedPublicTypes, static (originalNode, _) =>
                    ChangeAccessibility(originalNode, SyntaxKind.InternalKeyword)).WithAdditionalAnnotations(Simplifier.Annotation);
                project = document.WithSyntaxRoot(newRoot).Project;
            }

            return project;
        }

        private static string GetSimpleName(string fullyQualifiedName)
        {
            var lastDot = fullyQualifiedName.LastIndexOf('.');
            return lastDot < 0 ? fullyQualifiedName : fullyQualifiedName.Substring(lastDot + 1);
        }

        private async Task<Project> RemoveMethodsFromModelFactoryAsync(Project project,
            TypeSymbols definitions,
            HashSet<string> namesToRemove)
        {
            var modelFactorySymbol = definitions.ModelFactorySymbol;
            if (modelFactorySymbol == null)
            {
                return project;
            }

            var nodesToRemove = new List<SyntaxNode>();

            foreach (var method in modelFactorySymbol.GetMembers().OfType<IMethodSymbol>())
            {
                if (namesToRemove.Contains(method.Name))
                {
                    foreach (var reference in method.DeclaringSyntaxReferences)
                    {
                        var node = await reference.GetSyntaxAsync();
                        nodesToRemove.Add(node);
                    }
                }
            }

            // find the GENERATED document of model factory (we may have the customized document of this for overloads)
            Document? modelFactoryGeneratedDocument = null;
            // the nodes corresponding to the model factory symbol has never been changed therefore the nodes inside the cache are still usable
            if (definitions.DeclaredNodesCache.TryGetValue(modelFactorySymbol, out var nodes))
            {
                foreach (var declarationNode in nodes)
                {
                    var document = project.GetDocument(declarationNode.SyntaxTree);
                    if (document != null && GeneratedCodeWorkspace.IsGeneratedDocument(document))
                    {
                        modelFactoryGeneratedDocument = document;
                        break;
                    }
                }
            }

            // maybe this is possible, for instance, we could be adding the customization all entries previously inside the generated model factory so that the generated model factory is empty and removed.
            if (modelFactoryGeneratedDocument == null)
            {
                return project;
            }

            var root = await modelFactoryGeneratedDocument.GetSyntaxRootAsync();
            Debug.Assert(root is not null);
            root = root.RemoveNodes(nodesToRemove, SyntaxRemoveOptions.KeepNoTrivia)!;
            modelFactoryGeneratedDocument = modelFactoryGeneratedDocument.WithSyntaxRoot(root);

            // see if this class still has any method, if it contains nothing, we should remove this document
            var methods = root.DescendantNodes().OfType<MethodDeclarationSyntax>();
            if (!methods.Any())
            {
                return project.RemoveDocument(modelFactoryGeneratedDocument.Id);
            }

            return modelFactoryGeneratedDocument.Project;
        }

        /// <summary>
        /// This method removes the no-referenced types from the <paramref name="project"/>. It will do this job in the following steps:
        /// 1. This method will read all the defined types in the given <paramref name="project"/>, and build a cache for those symbols
        /// 2. Build a reference map for those symbols (including non-public usage)
        /// 3. Finds all the root symbols, please override the <see cref="IsRootDocument(Document)"/> to control which document you would like to include
        /// 4. Visit all the symbols starting from the root symbols following the reference map to get all unvisited symbols
        /// 5. Remove the definition of the unvisited symbols in step 4
        /// </summary>
        /// <param name="project">The project to process</param>
        /// <returns>The processed <see cref="Project"/>. <see cref="Project"/> is immutable, therefore this should usually be a new instance </returns>
        public async Task<Project> RemoveAsync(Project project)
        {
            var compilation = await MeasureAsync<Compilation?>("PostProcessor.Remove.GetCompilationAsync", () => project.GetCompilationAsync());
            if (compilation == null)
            {
                return project;
            }

            // find all the declarations, including non-public declared
            var definitions = await MeasureAsync("PostProcessor.Remove.GetTypeSymbolsAsync", () => GetTypeSymbolsAsync(compilation, project, false));
            IEnumerable<INamedTypeSymbol> symbolsToRemove;
            HashSet<INamedTypeSymbol> referencedSet;
            if (ProviderReferenceMapAnalyzer.LatestResult is { } referenceMapResult)
            {
                symbolsToRemove = Measure("PostProcessor.Remove.UseShadowCandidates", () =>
                    GetSymbolsByName(definitions.DeclaredSymbols, referenceMapResult.RemoveCandidates).ToArray());
                referencedSet = Measure("PostProcessor.Remove.BuildShadowReferencedSet", () =>
                    new HashSet<INamedTypeSymbol>(definitions.DeclaredSymbols.Except(symbolsToRemove), SymbolEqualityComparer.Default));
            }
            else
            {
                // build reference map
                var referenceMap =
                    await MeasureAsync(
                        "PostProcessor.Remove.BuildAllReferenceMapAsync",
                        () => new ReferenceMapBuilder(compilation, project).BuildAllReferenceMapAsync(
                            definitions.DeclaredSymbols, definitions.DocumentsCache));
                // get root symbols
                var rootSymbols = await MeasureAsync("PostProcessor.Remove.GetRootSymbolsAsync", () => GetRootSymbolsAsync(project, definitions));
                // include model factory as a root symbol when doing the remove pass so that we are sure to include any internal
                // helpers that are required by the model factory.
                if (_modelFactorySymbol != null)
                {
                    rootSymbols.Add(_modelFactorySymbol);
                }
                // traverse the map to determine the declarations that we are about to remove, starting from root nodes
                var referencedSymbols = Measure("PostProcessor.Remove.VisitSymbolsFromRoot", () => VisitSymbolsFromRootAsync(rootSymbols, referenceMap).ToArray().AsEnumerable());

                referencedSymbols = Measure("PostProcessor.Remove.AddSampleSymbols", () => AddSampleSymbols(referencedSymbols, definitions.DeclaredSymbols));
                referencedSet = Measure("PostProcessor.Remove.BuildReferencedSet", () => new HashSet<INamedTypeSymbol>(referencedSymbols, SymbolEqualityComparer.Default));

                symbolsToRemove = definitions.DeclaredSymbols.Except(referencedSet);
            }

            var nodesToRemove = Measure("PostProcessor.Remove.CollectNodes", () =>
            {
                var nodes = new List<BaseTypeDeclarationSyntax>();
                foreach (var symbol in symbolsToRemove)
                {
                    if (referencedSet.Contains(GetBase(symbol)))
                    {
                        continue;
                    }
                    nodes.AddRange(definitions.DeclaredNodesCache[symbol]);
                }

                return nodes;
            });

            // remove them one by one
            var referencedTypeNames = referencedSet
                .Select(static symbol => symbol.GetFullyQualifiedName())
                .ToHashSet(StringComparer.Ordinal);
            project = await MeasureAsync(
                "PostProcessor.Remove.RemoveModelsAsync",
                () => RemoveModelsAsync(project, nodesToRemove, referencedTypeNames));

            return project;
        }

        private INamedTypeSymbol GetBase(INamedTypeSymbol symbol)
        {
            var baseType = symbol.BaseType;
            if (baseType == null || baseType.SpecialType == SpecialType.System_Object)
            {
                return symbol;
            }
            return GetBase(baseType);
        }

        private IEnumerable<INamedTypeSymbol> AddSampleSymbols(
            IEnumerable<INamedTypeSymbol> referencedSymbols,
            HashSet<INamedTypeSymbol> declaredSymbols)
        {
            List<INamedTypeSymbol> symbolsToAdd = new List<INamedTypeSymbol>();
            foreach (var symbol in declaredSymbols)
            {
                if (symbol.ContainingNamespace.Name == "Samples" && symbol.Name.StartsWith("Samples_") &&
                    !referencedSymbols.Any(s => s.Name == symbol.Name))
                {
                    symbolsToAdd.Add(symbol);
                }
            }

            return referencedSymbols.Concat(symbolsToAdd);
        }

        /// <summary>
        /// Do a BFS starting from the <paramref name="rootSymbols"/> by following the <paramref name="referenceMap"/>
        /// </summary>
        /// <param name="rootSymbols"></param>
        /// <param name="referenceMap"></param>
        /// <returns></returns>
        private static IEnumerable<INamedTypeSymbol> VisitSymbolsFromRootAsync(
            IEnumerable<INamedTypeSymbol> rootSymbols,
            ReferenceMap referenceMap)
        {
            var queue = new Queue<INamedTypeSymbol>(rootSymbols.Concat(referenceMap.GlobalReferencedSymbols));
            var visited = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default);
            while (queue.Count > 0)
            {
                var definition = queue.Dequeue();
                if (visited.Contains(definition))
                {
                    continue;
                }
                visited.Add(definition);
                // add this definition to the result
                yield return definition;
                // add every type referenced by this node to the queue
                foreach (var child in GetReferencedTypes(definition, referenceMap))
                {
                    queue.Enqueue(child);
                }
            }
        }

        private static IEnumerable<T> GetReferencedTypes<T>(T definition,
            IReadOnlyDictionary<T, IEnumerable<T>> referenceMap) where T : notnull
        {
            if (referenceMap.TryGetValue(definition, out var references))
            {
                return references;
            }

            return Enumerable.Empty<T>();
        }

        private static IEnumerable<INamedTypeSymbol> GetSymbolsByName(IEnumerable<INamedTypeSymbol> symbols, HashSet<string> names)
        {
            foreach (var symbol in symbols)
            {
                if (names.Contains(symbol.GetFullyQualifiedName()))
                {
                    yield return symbol;
                }
            }
        }

        private Project ApplyAccessibilityChanges(
            Project project,
            IReadOnlyDictionary<BaseTypeDeclarationSyntax, DocumentId> nodesToInternalize,
            IReadOnlyDictionary<BaseTypeDeclarationSyntax, DocumentId> nodesToPublicize)
        {
            var changesByDocument = new Dictionary<DocumentId, Dictionary<BaseTypeDeclarationSyntax, SyntaxKind>>();
            AddAccessibilityChanges(changesByDocument, nodesToInternalize, SyntaxKind.InternalKeyword);
            AddAccessibilityChanges(changesByDocument, nodesToPublicize, SyntaxKind.PublicKeyword);

            foreach (var (documentId, changes) in changesByDocument)
            {
                var document = project.GetDocument(documentId)!;
                var root = changes.Keys.First().SyntaxTree.GetRoot();
                var newRoot = root.ReplaceNodes(
                    changes.Keys,
                    (originalNode, _) => changes.TryGetValue(originalNode, out var targetAccessibility)
                        ? ChangeAccessibility(originalNode, targetAccessibility)
                        : originalNode)
                    .WithAdditionalAnnotations(Simplifier.Annotation);
                document = document.WithSyntaxRoot(newRoot);
                project = document.Project;
            }

            return project;
        }

        private static void AddAccessibilityChanges(
            Dictionary<DocumentId, Dictionary<BaseTypeDeclarationSyntax, SyntaxKind>> changesByDocument,
            IReadOnlyDictionary<BaseTypeDeclarationSyntax, DocumentId> nodes,
            SyntaxKind targetAccessibility)
        {
            foreach (var (node, documentId) in nodes)
            {
                if (!changesByDocument.TryGetValue(documentId, out var changes))
                {
                    changes = new Dictionary<BaseTypeDeclarationSyntax, SyntaxKind>();
                    changesByDocument[documentId] = changes;
                }

                changes[node] = targetAccessibility;
            }
        }

        private static BaseTypeDeclarationSyntax ChangeAccessibility(BaseTypeDeclarationSyntax declarationNode, SyntaxKind targetAccessibility)
        {
            return targetAccessibility == SyntaxKind.PublicKeyword
                ? ChangeModifier(declarationNode, SyntaxKind.InternalKeyword, SyntaxKind.PublicKeyword)
                : ChangeModifier(declarationNode, SyntaxKind.PublicKeyword, SyntaxKind.InternalKeyword);
        }

        private async Task<Project> RemoveModelsAsync(Project project,
            IEnumerable<BaseTypeDeclarationSyntax> unusedModels,
            HashSet<string> referencedTypeNames)
        {
            // accumulate the definitions from the same document together
            var documents = Measure("PostProcessor.Remove.RemoveModelsAsync.GroupByDocument", () =>
            {
                var groupedDocuments = new Dictionary<Document, HashSet<BaseTypeDeclarationSyntax>>();
                foreach (var model in unusedModels)
                {
                    var document = project.GetDocument(model.SyntaxTree);
                    Debug.Assert(document != null);
                    if (!groupedDocuments.ContainsKey(document))
                        groupedDocuments.Add(document, new HashSet<BaseTypeDeclarationSyntax>());

                    groupedDocuments[document].Add(model);
                }

                return groupedDocuments;
            });

            project = await MeasureAsync("PostProcessor.Remove.RemoveModelsAsync.RemoveModelsFromDocuments", async () =>
            {
                var updatedProject = project;
                foreach (var models in documents.Values)
                {
                    updatedProject = await RemoveModelsFromDocumentAsync(updatedProject, models);
                }

                return updatedProject;
            });

            // remove what are now invalid references due to the models being removed
            project = await MeasureAsync(
                "PostProcessor.Remove.RemoveModelsAsync.RemoveInvalidRefs",
                () => RemoveInvalidRefs(project, referencedTypeNames));

            return project;
        }

        private static BaseTypeDeclarationSyntax ChangeModifier(BaseTypeDeclarationSyntax memberDeclaration,
            SyntaxKind from,
            SyntaxKind to)
        {
            var originalTokenInList = memberDeclaration.Modifiers.FirstOrDefault(token => token.IsKind(from));

            // skip this if there is nothing to replace
            if (originalTokenInList == default)
            {
                return memberDeclaration;
            }

            var newToken =
                SyntaxFactory.Token(originalTokenInList.LeadingTrivia, to, originalTokenInList.TrailingTrivia);
            var newModifiers = memberDeclaration.Modifiers.Replace(originalTokenInList, newToken);
            return memberDeclaration.WithModifiers(newModifiers);
        }

        private async Task<Project> RemoveModelsFromDocumentAsync(Project project,
            IEnumerable<BaseTypeDeclarationSyntax> models)
        {
            var tree = models.First().SyntaxTree;
            var document = project.GetDocument(tree);
            if (document == null)
            {
                return project;
            }
            var root = await tree.GetRootAsync();
            root = root.RemoveNodes(models, SyntaxRemoveOptions.KeepNoTrivia);

            var emptyNamespaces = root!
                .DescendantNodes()
                .OfType<NamespaceDeclarationSyntax>()
                .Where(ns => !ns.Members.OfType<MemberDeclarationSyntax>().Any())
                .ToList();

            if (emptyNamespaces.Any())
            {
                root = root.RemoveNodes(emptyNamespaces, SyntaxRemoveOptions.KeepNoTrivia);
            }

            document = document.WithSyntaxRoot(root!);
            return document.Project;
        }

        private async Task<Project> RemoveInvalidRefs(Project project, HashSet<string> referencedTypeNames)
        {
            var solution = project.Solution;

            // Process each document for invalid usings
            solution = await MeasureAsync("PostProcessor.Remove.RemoveInvalidRefs.RemoveInvalidUsings", async () =>
            {
                var updatedSolution = solution;
                foreach (var documentId in project.DocumentIds)
                {
                    updatedSolution = await RemoveInvalidUsings(updatedSolution, documentId);
                }

                return updatedSolution;
            });

            // Process each document for invalid attributes (with fresh semantic models)
            solution = await MeasureAsync("PostProcessor.Remove.RemoveInvalidRefs.RemoveInvalidAttributes", async () =>
            {
                var updatedSolution = solution;
                foreach (var documentId in project.DocumentIds)
                {
                    updatedSolution = await RemoveInvalidAttributes(updatedSolution, documentId, referencedTypeNames);
                }

                return updatedSolution;
            });

            // Process each document for invalid XML documentation references (with fresh semantic models)
            solution = await MeasureAsync("PostProcessor.Remove.RemoveInvalidRefs.RemoveInvalidXmlDocReferences", async () =>
            {
                var updatedSolution = solution;
                foreach (var documentId in project.DocumentIds)
                {
                    updatedSolution = await RemoveInvalidXmlDocReferences(updatedSolution, documentId);
                }

                return updatedSolution;
            });

            return solution.GetProject(project.Id)!;
        }

        private async Task<Solution> RemoveInvalidUsings(Solution solution, DocumentId documentId)
        {
            var document = solution.GetDocument(documentId)!;
            var root = await document.GetSyntaxRootAsync();
            var model = await document.GetSemanticModelAsync();

            if (root is not CompilationUnitSyntax cu || model == null)
            {
                return solution;
            }

            var invalidUsings = cu.Usings
                .Where(u =>
                {
                    var info = model.GetSymbolInfo(u.Name!);
                    var sym = info.Symbol;
                    return sym is null || sym.Kind != SymbolKind.Namespace;
                })
                .ToList();

            if (invalidUsings.Count > 0)
            {
                cu = cu.RemoveNodes(invalidUsings, SyntaxRemoveOptions.KeepNoTrivia)!;
                solution = solution.WithDocumentSyntaxRoot(documentId, cu);
            }

            return solution;
        }

        private async Task<Solution> RemoveInvalidAttributes(Solution solution, DocumentId documentId, HashSet<string> referencedTypeNames)
        {
            var document = solution.GetDocument(documentId)!;
            var root = await document.GetSyntaxRootAsync();
            var model = await document.GetSemanticModelAsync();

            if (root is not CompilationUnitSyntax cu || model == null)
            {
                return solution;
            }

            var attributes = cu.DescendantNodes().OfType<AttributeListSyntax>();
            var firstAttribute = attributes.FirstOrDefault();

            var invalidAttributes = attributes
                .Where(attr => attr.Attributes.Any(attribute =>
                    attribute.ArgumentList?.Arguments.Any(arg =>
                        arg.Expression is TypeOfExpressionSyntax typeOfExpr &&
                        model.GetTypeInfo(typeOfExpr.Type).Type?.TypeKind == TypeKind.Error) == true))
                .ToHashSet();

            foreach (var attr in attributes)
            {
                if (IsInternalRecordBuildableAttribute(attr) ||
                    await ShouldRemoveUnreferencedInternalBuildableAttribute(solution, model, attr, referencedTypeNames))
                {
                    invalidAttributes.Add(attr);
                }
            }

            if (invalidAttributes.Count > 0)
            {
                cu = cu.RemoveNodes(invalidAttributes, SyntaxRemoveOptions.KeepNoTrivia)!;

                if (invalidAttributes.Contains(firstAttribute!))
                {
                    var leadingTrivia = firstAttribute!.GetLeadingTrivia();
                    // Find where XML docs end and indentation begins
                    var xmlDocTrivia = new List<SyntaxTrivia>();
                    var lastXmlIndex = -1;

                    for (int i = 0; i < leadingTrivia.Count; i++)
                    {
                        var trivia = leadingTrivia[i];
                        if (trivia.IsKind(SyntaxKind.SingleLineDocumentationCommentTrivia))
                        {
                            lastXmlIndex = i;
                        }
                    }

                    // Collect trivia up to and including the last XML doc line's newline
                    if (lastXmlIndex >= 0)
                    {
                        for (int i = 0; i <= lastXmlIndex; i++)
                        {
                            xmlDocTrivia.Add(leadingTrivia[i]);
                        }

                        // Include the newline after the last XML doc if present
                        if (lastXmlIndex + 1 < leadingTrivia.Count &&
                            leadingTrivia[lastXmlIndex + 1].IsKind(SyntaxKind.EndOfLineTrivia))
                        {
                            xmlDocTrivia.Add(leadingTrivia[lastXmlIndex + 1]);
                        }
                    }

                    // Find the updated type and add the XML docs to it
                    var updatedType = cu.DescendantNodes()
                        .OfType<TypeDeclarationSyntax>()
                        .FirstOrDefault();

                    if (updatedType != null && xmlDocTrivia.Any())
                    {
                        var existingTrivia = updatedType.GetLeadingTrivia();
                        cu = cu.ReplaceNode(updatedType,
                            updatedType.WithLeadingTrivia(xmlDocTrivia.Concat(existingTrivia)));
                    }
                }

                solution = solution.WithDocumentSyntaxRoot(documentId, cu);
            }

            return solution;
        }

        private static bool IsInternalRecordBuildableAttribute(AttributeListSyntax attributeList)
        {
            if (attributeList.Attributes.Count != 1 ||
                !IsModelReaderWriterBuildableAttribute(attributeList.Attributes[0]))
            {
                return false;
            }

            var typeName = attributeList.Attributes[0].ArgumentList?.Arguments
                .Select(static argument => argument.Expression)
                .OfType<TypeOfExpressionSyntax>()
                .Select(static typeOfExpression => typeOfExpression.Type.ToString().Split('.').Last())
                .FirstOrDefault();

            return typeName?.StartsWith("Update", StringComparison.Ordinal) == true && typeName.EndsWith("Record", StringComparison.Ordinal) ||
                typeName?.EndsWith("PatchUpdate", StringComparison.Ordinal) == true;
        }

        private static async Task<bool> ShouldRemoveUnreferencedInternalBuildableAttribute(
            Solution solution,
            SemanticModel model,
            AttributeListSyntax attributeList,
            HashSet<string> referencedTypeNames)
        {
            if (attributeList.Attributes.Count != 1)
            {
                return false;
            }

            var attribute = attributeList.Attributes[0];
            if (model.GetSymbolInfo(attribute).Symbol?.ContainingType.Name != "ModelReaderWriterBuildableAttribute" &&
                !IsModelReaderWriterBuildableAttribute(attribute))
            {
                return false;
            }

            var typeOfExpression = attribute.ArgumentList?.Arguments
                .Select(static argument => argument.Expression)
                .OfType<TypeOfExpressionSyntax>()
                .FirstOrDefault();
            if (typeOfExpression == null ||
                model.GetTypeInfo(typeOfExpression.Type).Type is not INamedTypeSymbol typeSymbol ||
                typeSymbol.DeclaredAccessibility != Accessibility.Internal)
            {
                return false;
            }

            if (typeSymbol.BaseType is { SpecialType: not SpecialType.System_Object })
            {
                return false;
            }

            if (typeSymbol.Name.EndsWith("PatchUpdate", StringComparison.Ordinal) ||
                typeSymbol.Name.StartsWith("Update", StringComparison.Ordinal) && typeSymbol.Name.EndsWith("Record", StringComparison.Ordinal))
            {
                return true;
            }

            if (referencedTypeNames.Contains(typeSymbol.GetFullyQualifiedName()))
            {
                return false;
            }

            foreach (var referencedSymbol in await SymbolFinder.FindReferencesAsync(typeSymbol, solution))
            {
                foreach (var location in referencedSymbol.Locations)
                {
                    if (!location.Location.IsInSource)
                    {
                        continue;
                    }

                    var document = location.Document;
                    var root = await document.GetSyntaxRootAsync();
                    if (root == null)
                    {
                        continue;
                    }

                    var node = root.FindNode(location.Location.SourceSpan);
                    if (node.AncestorsAndSelf().OfType<AttributeSyntax>().Any())
                    {
                        continue;
                    }

                    if (IsWithinTypeDeclaration(typeSymbol, node))
                    {
                        continue;
                    }

                    return false;
                }
            }

            return true;
        }

        private static bool IsModelReaderWriterBuildableAttribute(AttributeSyntax attribute)
        {
            var name = attribute.Name.ToString();
            return name.EndsWith("ModelReaderWriterBuildable", StringComparison.Ordinal) ||
                name.EndsWith("ModelReaderWriterBuildableAttribute", StringComparison.Ordinal) ||
                name.Contains(".ModelReaderWriterBuildableAttribute", StringComparison.Ordinal);
        }

        private static bool IsWithinTypeDeclaration(INamedTypeSymbol typeSymbol, SyntaxNode node)
        {
            foreach (var syntaxReference in typeSymbol.DeclaringSyntaxReferences)
            {
                if (syntaxReference.SyntaxTree == node.SyntaxTree && syntaxReference.Span.Contains(node.Span))
                {
                    return true;
                }
            }
            return false;
        }

        private static T Measure<T>(string stepName, Func<T> action)
        {
            var profile = Profile;
            if (profile == null)
            {
                return action();
            }

            var allocatedBytes = GC.GetTotalAllocatedBytes(precise: false);
            var stopwatch = Stopwatch.StartNew();
            try
            {
                return action();
            }
            finally
            {
                stopwatch.Stop();
                profile.Add(stepName, stopwatch.Elapsed, GC.GetTotalAllocatedBytes(precise: false) - allocatedBytes);
            }
        }

        private static async Task<T> MeasureAsync<T>(string stepName, Func<Task<T>> action)
        {
            var profile = Profile;
            if (profile == null)
            {
                return await action();
            }

            var allocatedBytes = GC.GetTotalAllocatedBytes(precise: false);
            var stopwatch = Stopwatch.StartNew();
            try
            {
                return await action();
            }
            finally
            {
                stopwatch.Stop();
                profile.Add(stepName, stopwatch.Elapsed, GC.GetTotalAllocatedBytes(precise: false) - allocatedBytes);
            }
        }

        private async Task<Solution> RemoveInvalidXmlDocReferences(Solution solution, DocumentId documentId)
        {
            var document = solution.GetDocument(documentId)!;
            var root = await document.GetSyntaxRootAsync();
            var model = await document.GetSemanticModelAsync();

            if (root == null || model == null)
            {
                return solution;
            }

            var invalidSeeElements = root.DescendantTrivia(descendIntoTrivia: true)
                .SelectMany(static trivia => trivia.GetStructure()?.DescendantNodes().OfType<XmlEmptyElementSyntax>() ?? [])
                .Where(element => string.Equals(element.Name.LocalName.ValueText, "see", StringComparison.Ordinal))
                .Where(element => element.Attributes.OfType<XmlCrefAttributeSyntax>().Any(attribute => model.GetSymbolInfo(attribute.Cref).Symbol == null))
                .ToArray();

            if (invalidSeeElements.Length == 0)
            {
                return solution;
            }

            var text = await document.GetTextAsync();
            var source = text.ToString();
            foreach (var element in invalidSeeElements)
            {
                var cref = element.Attributes.OfType<XmlCrefAttributeSyntax>().First().Cref.ToString();
                var colonIndex = cref.IndexOf(':');
                var replacement = colonIndex >= 0 ? cref.Substring(colonIndex + 1) : cref;
                source = source.Replace(element.ToFullString(), replacement, StringComparison.Ordinal);
            }

            return solution.WithDocumentText(documentId, SourceText.From(source, text.Encoding));
        }

        private async Task<HashSet<INamedTypeSymbol>> GetRootSymbolsAsync(Project project, TypeSymbols modelSymbols)
        {
            var result = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default);
            foreach (var symbol in modelSymbols.DeclaredSymbols)
            {
                foreach (var declarationNode in modelSymbols.DeclaredNodesCache[symbol])
                {
                    var document = project.GetDocument(declarationNode.SyntaxTree);
                    if (document == null)
                    {
                        continue;
                    }
                    if (await IsRootDocument(document))
                    {
                        result.Add(symbol);
                        break;
                        // if any of the declaring document of this symbol is considered as a root document, we add the symbol to the root list, skipping the processing of any other documents of this symbol
                    }
                }
            }

            return result;
        }

        protected virtual async Task<bool> IsRootDocument(Document document)
        {
            var root = await document.GetSyntaxRootAsync();
            // a document is a root document, when
            // 1. it is a custom document (not generated or shared)
            // 2. it is a client
            // 3. user exceptions
            return GeneratedCodeWorkspace.IsCustomDocument(document) || IsClientDocument(document) ||
                   ShouldKeepType(root, _typesToKeep);
        }

        private static bool ShouldKeepType(SyntaxNode? root, HashSet<string> typesToKeep)
        {
            if (root is null)
            {
                return false;
            }

            // use `BaseTypeDeclarationSyntax` to also include enums because `EnumDeclarationSyntax` extends `BaseTypeDeclarationSyntax`
            // `ClassDeclarationSyntax` and `StructDeclarationSyntax` both inherit `TypeDeclarationSyntax`
            var typeNodes = root.DescendantNodes().OfType<BaseTypeDeclarationSyntax>();
            // there is possibility that we have multiple types defined in the same document (for instance, custom code)
            return typeNodes.Any(t =>
            {
                // Get simple name
                var simpleName = t.Identifier.Text;
                if (typesToKeep.Contains(simpleName))
                {
                    return true;
                }

                // Get fully qualified name
                var fullName = GetFullyQualifiedName(t);
                return typesToKeep.Contains(fullName);
            });
        }

        private static string GetFullyQualifiedName(BaseTypeDeclarationSyntax typeDeclaration)
        {
            var namespaceDeclaration = typeDeclaration.Ancestors()
                .OfType<NamespaceDeclarationSyntax>()
                .FirstOrDefault();

            return namespaceDeclaration != null
                ? $"{namespaceDeclaration.Name}.{typeDeclaration.Identifier.Text}"
                : typeDeclaration.Identifier.Text;
        }

        private static bool IsClientDocument(Document document)
        {
            return document.Name.EndsWith("Client.cs", StringComparison.Ordinal);
        }

        private static void AddInList<TKey, TValue, TList>(Dictionary<TKey, TList> dictionary,
            TKey key,
            TValue value,
            Func<TList>? collectionConstructor = null) where TKey : notnull where TList : ICollection<TValue>, new()
        {
            if (dictionary.TryGetValue(key, out var list))
            {
                list.Add(value);
            }
            else
            {
                TList newList;
                if (collectionConstructor == null)
                {
                    newList = new TList();
                }
                else
                {
                    newList = collectionConstructor();
                }
                newList.Add(value);
                dictionary.Add(key, newList);
            }
        }
    }
}

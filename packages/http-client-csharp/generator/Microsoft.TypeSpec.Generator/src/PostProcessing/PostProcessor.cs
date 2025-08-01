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
using Microsoft.CodeAnalysis.Simplification;

namespace Microsoft.TypeSpec.Generator
{
    internal class PostProcessor
    {
        private readonly string? _modelFactoryFullName;
        private readonly IEnumerable<string>? _additionalNonRootTypeFullNames;
        private readonly HashSet<string> _typesToKeep;
        private INamedTypeSymbol? _modelFactorySymbol;

        public PostProcessor(
            HashSet<string> typesToKeep,
            string? modelFactoryFullName = null,
            IEnumerable<string>? additionalNonRootTypeFullNames = null)
        {
            _typesToKeep = typesToKeep;
            _modelFactoryFullName = modelFactoryFullName;
            _additionalNonRootTypeFullNames = additionalNonRootTypeFullNames;
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

            var additionalNonRootTypeSymbols = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default);
            if (_additionalNonRootTypeFullNames != null)
            {
                foreach (var typeFullName in _additionalNonRootTypeFullNames)
                {
                    var typeSymbol = compilation.GetTypeByMetadataName(typeFullName);
                    if (typeSymbol != null)
                    {
                        additionalNonRootTypeSymbols.Add(typeSymbol);
                    }
                }
            }

            foreach (var document in project.Documents)
            {
                if (ShouldIncludeDocument(document))
                {
                    var root = await document.GetSyntaxRootAsync();
                    if (root == null)
                        continue;

                    var semanticModel = compilation.GetSemanticModel(root.SyntaxTree);

                    foreach (var typeDeclaration in root.DescendantNodes().OfType<BaseTypeDeclarationSyntax>())
                    {
                        var symbol = semanticModel.GetDeclaredSymbol(typeDeclaration);
                        if (symbol == null)
                            continue;
                        if (CodeModelGenerator.Instance.TypesToKeepPublic.Contains(symbol.Name))
                            continue; //skip types that are explicitly marked to keep public

                        if (publicOnly && symbol.DeclaredAccessibility != Accessibility.Public &&
                            !document.Name.StartsWith("Internal/", StringComparison.Ordinal))
                            continue;

                        // we do not add the model factory and aspDotNetExtension symbol to the declared symbol list so that it will never be included in any process of internalization or removal
                        if (!SymbolEqualityComparer.Default.Equals(symbol, _modelFactorySymbol)
                            && !additionalNonRootTypeSymbols.Contains(symbol))
                        {
                            result.Add(symbol);
                        }

                        AddInList(declarationCache, symbol, typeDeclaration);
                        AddInList(documentCache, document, symbol,
                            () => new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default));
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
            var compilation = await project.GetCompilationAsync();
            if (compilation == null)
                return project;

            // first get all the declared symbols
            var definitions = await GetTypeSymbolsAsync(compilation, project, true);
            // build the reference map
            var referenceMap =
                await new ReferenceMapBuilder(compilation, project).BuildPublicReferenceMapAsync(
                    definitions.DeclaredSymbols, definitions.DeclaredNodesCache);
            // get the root symbols
            var rootSymbols = await GetRootSymbolsAsync(project, definitions);
            // traverse all the root and recursively add all the things we met
            var publicSymbols = VisitSymbolsFromRootAsync(rootSymbols, referenceMap);

            var symbolsToInternalize = definitions.DeclaredSymbols.Except(publicSymbols);

            var nodesToInternalize = new Dictionary<BaseTypeDeclarationSyntax, DocumentId>();
            foreach (var symbol in symbolsToInternalize)
            {
                foreach (var node in definitions.DeclaredNodesCache[symbol])
                {
                    nodesToInternalize[node] = project.GetDocumentId(node.SyntaxTree)!;
                }
            }

            foreach (var (model, documentId) in nodesToInternalize)
            {
                project = MarkInternal(project, model, documentId);
            }

            var modelNamesToRemove =
                nodesToInternalize.Keys.Select(item => item.Identifier.Text);
            project = await RemoveMethodsFromModelFactoryAsync(project, definitions, modelNamesToRemove.ToHashSet());

            return project;
        }

        private async Task<Project> RemoveMethodsFromModelFactoryAsync(Project project,
            TypeSymbols definitions,
            HashSet<string> namesToRemove)
        {
            var modelFactorySymbol = definitions.ModelFactorySymbol;
            if (modelFactorySymbol == null)
                return project;

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
                return project;

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
            var compilation = await project.GetCompilationAsync();
            if (compilation == null)
                return project;

            // find all the declarations, including non-public declared
            var definitions = await GetTypeSymbolsAsync(compilation, project, false);
            // build reference map
            var referenceMap =
                await new ReferenceMapBuilder(compilation, project).BuildAllReferenceMapAsync(
                    definitions.DeclaredSymbols, definitions.DocumentsCache);
            // get root symbols
            var rootSymbols = await GetRootSymbolsAsync(project, definitions);
            // include model factory as a root symbol when doing the remove pass so that we are sure to include any internal
            // helpers that are required by the model factory.
            if (_modelFactorySymbol != null)
                rootSymbols.Add(_modelFactorySymbol);
            // traverse the map to determine the declarations that we are about to remove, starting from root nodes
            var referencedSymbols = VisitSymbolsFromRootAsync(rootSymbols, referenceMap);

            referencedSymbols = AddSampleSymbols(referencedSymbols, definitions.DeclaredSymbols);
            var referencedSet = new HashSet<INamedTypeSymbol>(referencedSymbols, SymbolEqualityComparer.Default);

            var symbolsToRemove = definitions.DeclaredSymbols.Except(referencedSet);

            var nodesToRemove = new List<BaseTypeDeclarationSyntax>();
            foreach (var symbol in symbolsToRemove)
            {
                if (referencedSet.Contains(GetBase(symbol)))
                {
                    continue;
                }
                nodesToRemove.AddRange(definitions.DeclaredNodesCache[symbol]);
            }

            // remove them one by one
            project = await RemoveModelsAsync(project, nodesToRemove);

            return project;
        }

        private INamedTypeSymbol GetBase(INamedTypeSymbol symbol)
        {
            var baseType = symbol.BaseType;
            if (baseType == null || baseType.SpecialType == SpecialType.System_Object)
                return symbol;
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
                    continue;
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
                return references;

            return Enumerable.Empty<T>();
        }

        private Project MarkInternal(Project project, BaseTypeDeclarationSyntax declarationNode, DocumentId documentId)
        {
            var newNode = ChangeModifier(declarationNode, SyntaxKind.PublicKeyword, SyntaxKind.InternalKeyword);
            var tree = declarationNode.SyntaxTree;
            var document = project.GetDocument(documentId)!;
            var newRoot = tree.GetRoot().ReplaceNode(declarationNode, newNode)
                .WithAdditionalAnnotations(Simplifier.Annotation);
            document = document.WithSyntaxRoot(newRoot);
            return document.Project;
        }

        private async Task<Project> RemoveModelsAsync(Project project,
            IEnumerable<BaseTypeDeclarationSyntax> unusedModels)
        {
            // accumulate the definitions from the same document together
            var documents = new Dictionary<Document, HashSet<BaseTypeDeclarationSyntax>>();

            foreach (var model in unusedModels)
            {
                var document = project.GetDocument(model.SyntaxTree);
                Debug.Assert(document != null);
                if (!documents.ContainsKey(document))
                    documents.Add(document, new HashSet<BaseTypeDeclarationSyntax>());

                documents[document].Add(model);
            }

            foreach (var models in documents.Values)
            {
                project = await RemoveModelsFromDocumentAsync(project, models);
            }

            // remove what are now invalid references due to the models being removed
            project = await RemoveInvalidRefs(project);

            return project;
        }

        private static BaseTypeDeclarationSyntax ChangeModifier(BaseTypeDeclarationSyntax memberDeclaration,
            SyntaxKind from,
            SyntaxKind to)
        {
            var originalTokenInList = memberDeclaration.Modifiers.FirstOrDefault(token => token.IsKind(from));

            // skip this if there is nothing to replace
            if (originalTokenInList == default)
                return memberDeclaration;

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
                return project;
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

        private async Task<Project> RemoveInvalidRefs(Project project)
        {
            var solution = project.Solution;

            // Process each document for invalid usings
            foreach (var documentId in project.DocumentIds)
            {
                solution = await RemoveInvalidUsings(solution, documentId);
            }

            // Process each document for invalid attributes (with fresh semantic models)
            foreach (var documentId in project.DocumentIds)
            {
                solution = await RemoveInvalidAttributes(solution, documentId);
            }

            return solution.GetProject(project.Id)!;
        }

        private async Task<Solution> RemoveInvalidUsings(Solution solution, DocumentId documentId)
        {
            var document = solution.GetDocument(documentId)!;
            var root = await document.GetSyntaxRootAsync();
            var model = await document.GetSemanticModelAsync();

            if (root is not CompilationUnitSyntax cu || model == null)
                return solution;

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

        private async Task<Solution> RemoveInvalidAttributes(Solution solution, DocumentId documentId)
        {
            var document = solution.GetDocument(documentId)!;
            var root = await document.GetSyntaxRootAsync();
            var model = await document.GetSemanticModelAsync();

            if (root is not CompilationUnitSyntax cu || model == null)
                return solution;

            var attributes = cu.DescendantNodes().OfType<AttributeListSyntax>();
            var firstAttribute = attributes.FirstOrDefault();

            var invalidAttributes = attributes
                .Where(attr => attr.Attributes.Any(attribute =>
                    attribute.ArgumentList?.Arguments.Any(arg =>
                        arg.Expression is TypeOfExpressionSyntax typeOfExpr &&
                        model.GetTypeInfo(typeOfExpr.Type).Type?.TypeKind == TypeKind.Error) == true))
                .ToHashSet();

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

        private async Task<HashSet<INamedTypeSymbol>> GetRootSymbolsAsync(Project project, TypeSymbols modelSymbols)
        {
            var result = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default);
            foreach (var symbol in modelSymbols.DeclaredSymbols)
            {
                foreach (var declarationNode in modelSymbols.DeclaredNodesCache[symbol])
                {
                    var document = project.GetDocument(declarationNode.SyntaxTree);
                    if (document == null)
                        continue;
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
                return false;

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
                    newList = new TList();
                else
                    newList = collectionConstructor();
                newList.Add(value);
                dictionary.Add(key, newList);
            }
        }
    }
}

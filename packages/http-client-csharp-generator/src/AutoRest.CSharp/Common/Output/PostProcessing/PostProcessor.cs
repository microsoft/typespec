// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading.Tasks;
using AutoRest.CSharp.AutoRest.Plugins;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Simplification;

namespace AutoRest.CSharp.Common.Output.PostProcessing;

internal class PostProcessor
{
    private const string AspDotNetExtensionNamespace = "Microsoft.Extensions.Azure";
    private readonly string? _modelFactoryFullName;
    private readonly string? _aspExtensionClassName;
    private readonly ImmutableHashSet<string> _modelsToKeep;

    public PostProcessor(ImmutableHashSet<string> modelsToKeep, string? modelFactoryFullName = null, string? aspExtensionClassName = null)
    {
        _modelsToKeep = modelsToKeep;
        _modelFactoryFullName = modelFactoryFullName;
        _aspExtensionClassName = aspExtensionClassName;
    }

    protected record TypeSymbols(ImmutableHashSet<INamedTypeSymbol> DeclaredSymbols, INamedTypeSymbol? ModelFactorySymbol, IReadOnlyDictionary<INamedTypeSymbol, ImmutableHashSet<BaseTypeDeclarationSyntax>> DeclaredNodesCache, IReadOnlyDictionary<Document, ImmutableHashSet<INamedTypeSymbol>> DocumentsCache);

    /// <summary>
    /// This method reads the project, returns the types defined in it and build symbol caches to acceralate the calculation
    /// By default, the types defined in shared documents are not included. Please override <see cref="ShouldIncludeDocument(Document)"/> to tweak this behaviour
    /// </summary>
    /// <param name="compilation">The <see cref="Compilation"/> of the <paramref name="project"/> </param>
    /// <param name="project">The project to extract type symbols from</param>
    /// <param name="publicOnly">If <paramref name="publicOnly"/> is true, only public types will be included. If <paramref name="publicOnly"/> is false, all types will be included </param>
    /// <returns>A instance of <see cref="TypeSymbols"/> which includes the information of the declared symbols of the given accessibility, along with some useful cache that is useful in this class. </returns>
    protected async Task<TypeSymbols> GetTypeSymbolsAsync(Compilation compilation, Project project, bool publicOnly = true)
    {
        var result = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default);
        var declarationCache = new Dictionary<INamedTypeSymbol, HashSet<BaseTypeDeclarationSyntax>>(SymbolEqualityComparer.Default);
        var documentCache = new Dictionary<Document, HashSet<INamedTypeSymbol>>();

        INamedTypeSymbol? modelFactorySymbol = null;
        if (_modelFactoryFullName != null)
            modelFactorySymbol = compilation.GetTypeByMetadataName(_modelFactoryFullName);
        INamedTypeSymbol? aspDotNetExtensionSymbol = null;
        if (_aspExtensionClassName != null)
            aspDotNetExtensionSymbol = compilation.GetTypeByMetadataName(_aspExtensionClassName);

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
                    if (publicOnly && symbol.DeclaredAccessibility != Accessibility.Public && !document.Name.StartsWith("Internal", StringComparison.Ordinal))
                        continue;

                    // we do not add the model factory symbol to the declared symbol list so that it will never be included in any process of internalization or removal
                    if (!SymbolEqualityComparer.Default.Equals(symbol, modelFactorySymbol)
                        && !SymbolEqualityComparer.Default.Equals(symbol, aspDotNetExtensionSymbol))
                        result.Add(symbol);

                    declarationCache.AddInList(symbol, typeDeclaration);
                    documentCache.AddInList(document, symbol, () => new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default));
                }
            }
        }

        return new TypeSymbols(result.ToImmutableHashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default),
            modelFactorySymbol,
            declarationCache.ToDictionary(kv => kv.Key, kv => kv.Value.ToImmutableHashSet(), (IEqualityComparer<INamedTypeSymbol>)SymbolEqualityComparer.Default),
            documentCache.ToDictionary(kv => kv.Key, kv => kv.Value.ToImmutableHashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default)));
    }

    protected virtual bool ShouldIncludeDocument(Document document) => !GeneratedCodeWorkspace.IsSharedDocument(document) && !GeneratedCodeWorkspace.IsGeneratedTestDocument(document);

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

        // get the type names suppressed by the attribute
        var suppressedTypeNames = GeneratedCodeWorkspace.GetSuppressedTypeNames(compilation);
        // first get all the declared symbols
        var definitions = await GetTypeSymbolsAsync(compilation, project, true);
        // build the reference map
        var referenceMap = await new ReferenceMapBuilder(compilation, project, HasDiscriminator).BuildPublicReferenceMapAsync(definitions.DeclaredSymbols, definitions.DeclaredNodesCache);
        // get the root symbols
        var rootSymbols = GetRootSymbols(project, definitions);
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

        var modelNamesToRemove = nodesToInternalize.Keys.Select(item => item.Identifier.Text).Concat(suppressedTypeNames);
        project = await RemoveMethodsFromModelFactoryAsync(project, definitions, modelNamesToRemove.ToHashSet());

        return project;
    }

    private async Task<Project> RemoveMethodsFromModelFactoryAsync(Project project, TypeSymbols definitions, HashSet<string> namesToRemove)
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
        foreach (var declarationNode in definitions.DeclaredNodesCache[modelFactorySymbol])
        {
            var document = project.GetDocument(declarationNode.SyntaxTree);
            if (document != null && GeneratedCodeWorkspace.IsGeneratedDocument(document))
            {
                modelFactoryGeneratedDocument = document;
                break;
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
        var referenceMap = await new ReferenceMapBuilder(compilation, project, HasDiscriminator).BuildAllReferenceMapAsync(definitions.DeclaredSymbols, definitions.DocumentsCache);
        // get root symbols
        var rootSymbols = GetRootSymbols(project, definitions);
        // traverse the map to determine the declarations that we are about to remove, starting from root nodes
        var referencedSymbols = VisitSymbolsFromRootAsync(rootSymbols, referenceMap);

        referencedSymbols = AddSampleSymbols(referencedSymbols, definitions.DeclaredSymbols);

        var symbolsToRemove = definitions.DeclaredSymbols.Except(referencedSymbols);

        var nodesToRemove = new List<BaseTypeDeclarationSyntax>();
        foreach (var symbol in symbolsToRemove)
        {
            nodesToRemove.AddRange(definitions.DeclaredNodesCache[symbol]);
        }

        // remove them one by one
        project = await RemoveModelsAsync(project, nodesToRemove);

        return project;
    }

    private IEnumerable<INamedTypeSymbol> AddSampleSymbols(IEnumerable<INamedTypeSymbol> referencedSymbols, ImmutableHashSet<INamedTypeSymbol> declaredSymbols)
    {
        List<INamedTypeSymbol> symbolsToAdd = new List<INamedTypeSymbol>();
        foreach (var symbol in declaredSymbols)
        {
            if (symbol.ContainingNamespace.Name == "Samples" && symbol.Name.StartsWith("Samples_") && !referencedSymbols.Any(s => s.Name == symbol.Name))
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
    private static IEnumerable<INamedTypeSymbol> VisitSymbolsFromRootAsync(IEnumerable<INamedTypeSymbol> rootSymbols, ReferenceMap referenceMap)
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

    private static IEnumerable<T> GetReferencedTypes<T>(T definition, IReadOnlyDictionary<T, IEnumerable<T>> referenceMap) where T : notnull
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
        var newRoot = tree.GetRoot().ReplaceNode(declarationNode, newNode).WithAdditionalAnnotations(Simplifier.Annotation);
        document = document.WithSyntaxRoot(newRoot);
        return document.Project;
    }

    private async Task<Project> RemoveModelsAsync(Project project, IEnumerable<BaseTypeDeclarationSyntax> unusedModels)
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

        return project;
    }

    private static BaseTypeDeclarationSyntax ChangeModifier(BaseTypeDeclarationSyntax memberDeclaration, SyntaxKind from, SyntaxKind to)
    {
        var originalTokenInList = memberDeclaration.Modifiers.FirstOrDefault(token => token.IsKind(from));

        // skip this if there is nothing to replace
        if (originalTokenInList == default)
            return memberDeclaration;

        var newToken = SyntaxFactory.Token(originalTokenInList.LeadingTrivia, to, originalTokenInList.TrailingTrivia);
        var newModifiers = memberDeclaration.Modifiers.Replace(originalTokenInList, newToken);
        return memberDeclaration.WithModifiers(newModifiers);
    }

    private async Task<Project> RemoveModelsFromDocumentAsync(Project project, IEnumerable<BaseTypeDeclarationSyntax> models)
    {
        var tree = models.First().SyntaxTree;
        var document = project.GetDocument(tree);
        if (document == null)
            return project;
        var root = await tree.GetRootAsync();
        root = root.RemoveNodes(models, SyntaxRemoveOptions.KeepNoTrivia);
        document = document.WithSyntaxRoot(root!);
        return document.Project;
    }

    protected HashSet<INamedTypeSymbol> GetRootSymbols(Project project, TypeSymbols modelSymbols)
    {
        var result = new HashSet<INamedTypeSymbol>(SymbolEqualityComparer.Default);
        foreach (var symbol in modelSymbols.DeclaredSymbols)
        {
            foreach (var declarationNode in modelSymbols.DeclaredNodesCache[symbol])
            {
                var document = project.GetDocument(declarationNode.SyntaxTree);
                if (document == null)
                    continue;
                if (IsRootDocument(document))
                {
                    result.Add(symbol);
                    break;
                    // if any of the declaring document of this symbol is considered as a root document, we add the symbol to the root list, skipping the processing of any other documents of this symbol
                }
            }
        }

        return result;
    }

    protected virtual bool IsRootDocument(Document document)
    {
        var root = document.GetSyntaxRootAsync().GetAwaiter().GetResult();
        // a document is a root document, when
        // 1. it is a custom document (not generated or shared)
        // 2. it is a client
        // 3. user exceptions
        return GeneratedCodeWorkspace.IsCustomDocument(document) || IsClientDocument(document) || ShouldKeepModel(root, _modelsToKeep);
    }

    private static bool ShouldKeepModel(SyntaxNode? root, ImmutableHashSet<string> modelsToKeep)
    {
        if (root is null)
            return false;

        // use `BaseTypeDeclarationSyntax` to also include enums because `EnumDeclarationSyntax` extends `BaseTypeDeclarationSyntax`
        // `ClassDeclarationSyntax` and `StructDeclarationSyntax` both inherit `TypeDeclarationSyntax`
        var typeNodes = root.DescendantNodes().OfType<BaseTypeDeclarationSyntax>();
        // there is possibility that we have multiple types defined in the same document (for instance, custom code)
        return typeNodes.Any(t => modelsToKeep.Contains(t.Identifier.Text));
    }

    private static bool IsClientDocument(Document document)
    {
        return document.Name.EndsWith("Client.cs", StringComparison.Ordinal);
    }

    protected virtual bool HasDiscriminator(BaseTypeDeclarationSyntax node, [MaybeNullWhen(false)] out HashSet<string> identifiers)
    {
        identifiers = null;
        // only class models will have discriminators
        if (node is ClassDeclarationSyntax classDeclaration)
        {
            if (classDeclaration.HasLeadingTrivia)
            {
                var syntaxTriviaList = classDeclaration.GetLeadingTrivia();
                var filteredTriviaList = syntaxTriviaList.Where(syntaxTrivia => DiscriminatorDescFixedPart.All(syntaxTrivia.ToFullString().Contains));
                if (filteredTriviaList.Count() == 1)
                {
                    var descendantNodes = filteredTriviaList.First().GetStructure()?.DescendantNodes().ToList();
                    var filteredDescendantNodes = FilterTriviaWithDiscriminator(descendantNodes);
                    var identifierNodes = filteredDescendantNodes.SelectMany(node => node.DescendantNodes().OfType<XmlCrefAttributeSyntax>());
                    // this is getting plain the cref content out, therefore if we write `cref="global::Azure.ResourceManager.Models.Cat"`, we will have
                    // global::Azure.ResourceManager.Models.Cat. But in the place we consume this set, we only need the name, therefore here we just trim off the prefixes here
                    identifiers = identifierNodes.Select(identifier => GetCleanName(identifier.Cref)).ToHashSet();
                    return true;
                }
            }
            return false;
        }

        return false;
    }

    private static string GetCleanName(CrefSyntax cref)
    {
        var fullString = cref.ToFullString();
        return fullString.Split('.', StringSplitOptions.RemoveEmptyEntries).Last();
    }

    private static IEnumerable<SyntaxNode> FilterTriviaWithDiscriminator(List<SyntaxNode>? nodes)
    {
        if (nodes is null)
        {
            return Enumerable.Empty<SyntaxNode>();
        }

        // If the base class has discriminator, we will add a description at the end of the original description to add the known derived types
        // Here we use the added description to filter the syntax nodes coming from xml comment to get all the derived types exactly
        var targetIndex = nodes.FindLastIndex(node => node.ToFullString().Contains(DiscriminatorDescFixedPart.Last()));
        return nodes.Where((val, index) => index >= targetIndex);
    }

    private static readonly IReadOnlyList<string> DiscriminatorDescFixedPart = ObjectType.DiscriminatorDescFixedPart;
}

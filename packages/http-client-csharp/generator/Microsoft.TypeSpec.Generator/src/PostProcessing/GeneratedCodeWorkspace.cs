// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Build.Construction;
using Microsoft.CodeAnalysis;
using MSBuildProjectCollection = Microsoft.Build.Evaluation.ProjectCollection;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Formatting;
using Microsoft.CodeAnalysis.Simplification;
using Microsoft.CodeAnalysis.Text;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Utilities;
using NuGet.Configuration;

namespace Microsoft.TypeSpec.Generator
{
    internal class GeneratedCodeWorkspace
    {
        private const string SharedFolder = "Shared";
        private const string GeneratedFolder = "Generated";
        private const string GeneratedCodeProjectName = "GeneratedCode";
        private const string GeneratedTestFolder = "GeneratedTests";
        private const string NewLine = "\n";
        private const string ApiCompatPropertyName = "ApiCompatVersion";
        private const string TargetFrameworkPropertyName = "TargetFramework";
        private const string TargetFrameworksPropertyName = "TargetFrameworks";

        private static readonly Lazy<IReadOnlyList<MetadataReference>> _assemblyMetadataReferences = new(() => new List<MetadataReference>()
            { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) });
        private static readonly Lazy<WorkspaceMetadataReferenceResolver> _metadataReferenceResolver = new(() => new WorkspaceMetadataReferenceResolver());
        private static Task<Project>? _cachedProject;

        private static readonly string[] _generatedFolders = [GeneratedFolder];
        private static readonly string[] _sharedFolders = [SharedFolder];

        private Project _project;
        private Dictionary<string, string> PlainFiles { get; }

        private GeneratedCodeWorkspace(Project generatedCodeProject)
        {
            _project = generatedCodeProject;
            PlainFiles = new();
        }

        /// <summary>
        /// Creating AdHoc workspace and project takes a while, we'd like to preload this work
        /// to the generator startup time
        /// </summary>
        public static void Initialize()
        {
            _cachedProject = Task.Run(CreateGeneratedCodeProject);
        }

        internal async Task<CSharpCompilation> GetCompilationAsync()
        {
            var compilation = await _project.GetCompilationAsync();
            Debug.Assert(compilation is CSharpCompilation);

            return (CSharpCompilation)compilation;
        }

        public void AddPlainFiles(string name, string content)
        {
            PlainFiles.Add(name, content);
        }

        public async Task AddGeneratedFile(CodeFile codefile)
        {
            var document = _project.AddDocument(codefile.Name, codefile.Content, _generatedFolders);
            await UpdateProject(document);
        }

        public async Task AddInMemoryFile(TypeProvider type)
        {
            var document = _project.AddDocument(type.Name, GetTree(type).GetRoot(), _generatedFolders);
            await UpdateProject(document);
        }

        private async Task UpdateProject(Document document)
        {
            var root = await document.GetSyntaxRootAsync();
            Debug.Assert(root != null);

            root = root.WithAdditionalAnnotations(Simplifier.Annotation);
            document = document.WithSyntaxRoot(root);
            _project = document.Project;
        }

        internal static SyntaxTree GetTree(TypeProvider provider)
        {
            var writer = new TypeProviderWriter(provider);
            var file = writer.Write();
            return CSharpSyntaxTree.ParseText(file.Content, path: Path.Join(provider.RelativeFilePath, provider.Name + ".cs"));
        }

        public async IAsyncEnumerable<(string Name, string Text)> GetGeneratedFilesAsync()
        {
            List<Task<Document>> documents = new List<Task<Document>>();
            var memberRemover = new MemberRemoverRewriter();
            foreach (Document document in _project.Documents)
            {
                if (!IsGeneratedDocument(document))
                {
                    continue;
                }

                documents.Add(ProcessDocument(document, memberRemover));
            }
            var docs = await Task.WhenAll(documents);

            LoggingHelpers.LogElapsedTime("Roslyn post processing complete");

            foreach (var doc in docs)
            {
                var text = await doc.GetTextAsync();
                yield return (doc.Name, text.ToString());
            }

            foreach (var (file, content) in PlainFiles)
            {
                yield return (file, content);
            }
        }

        private async Task<Document> ProcessDocument(Document document, MemberRemoverRewriter memberRemover)
        {
            var root = await document.GetSyntaxRootAsync();
            var semanticModel = await document.GetSemanticModelAsync();

            if (semanticModel == null || root == null)
            {
                return document;
            }

            root = memberRemover.Visit(root);

            foreach (var rewriter in CodeModelGenerator.Instance.Rewriters)
            {
                rewriter.SemanticModel = semanticModel;
                root = rewriter.Visit(root);
            }
            document = document.WithSyntaxRoot(root);

            document = await ReduceQualifiedNamesAsync(document);
            document = await ReduceParenthesizedAssignmentsAsync(document);
            document = await ReduceDocumentationGlobalAliasesAsync(document);

            // Reformat if any custom rewriters have been applied
            if (CodeModelGenerator.Instance.Rewriters.Count > 0)
            {
                document = await Formatter.FormatAsync(document);
            }
            return document;
        }

        private static async Task<Document> ReduceQualifiedNamesAsync(Document document)
        {
            var root = await document.GetSyntaxRootAsync();
            var semanticModel = await document.GetSemanticModelAsync();
            if (root == null || semanticModel == null)
            {
                return document;
            }

            var globalAliases = new Dictionary<AliasQualifiedNameSyntax, NameSyntax>();
            foreach (var aliasName in root.DescendantNodes().OfType<AliasQualifiedNameSyntax>())
            {
                if (aliasName.Alias.Identifier.ValueText != "global" ||
                    aliasName.Ancestors().Any(static ancestor =>
                        ancestor is AttributeSyntax ||
                        ancestor is MemberAccessExpressionSyntax) ||
                    IsInUnsupportedQualifiedNameContext(aliasName))
                {
                    continue;
                }

                var originalSymbol = GetSymbol(semanticModel, aliasName);
                if (originalSymbol == null)
                {
                    continue;
                }

                var replacement = aliasName.Name.WithTriviaFrom(aliasName);
                if (SpeculativelyBindsToSameSymbol(semanticModel, aliasName, replacement, originalSymbol))
                {
                    globalAliases.Add(aliasName, replacement);
                }
            }

            if (globalAliases.Count > 0)
            {
                root = root.ReplaceNodes(
                    globalAliases.Keys,
                    (original, rewritten) => globalAliases[original].WithTriviaFrom(rewritten));
                document = document.WithSyntaxRoot(root);
                semanticModel = await document.GetSemanticModelAsync();
                root = await document.GetSyntaxRootAsync();
                if (root == null || semanticModel == null)
                {
                    return document;
                }
            }

            var safeNameReplacements = new Dictionary<NameSyntax, NameSyntax>();
            foreach (var name in root.DescendantNodes().OfType<NameSyntax>())
            {
                if (name is not QualifiedNameSyntax and not AliasQualifiedNameSyntax ||
                    name.Parent is QualifiedNameSyntax ||
                    IsInUnsupportedQualifiedNameContext(name))
                {
                    continue;
                }

                var originalSymbol = GetSymbol(semanticModel, name);
                if (originalSymbol == null)
                {
                    continue;
                }

                if (TryGetNameReplacement(semanticModel, name, originalSymbol, out var replacement))
                {
                    safeNameReplacements.Add(name, replacement);
                }
            }

            foreach (var attribute in root.DescendantNodes().OfType<AttributeSyntax>())
            {
                if (TryGetAttributeNameReplacement(semanticModel, attribute, out var replacement))
                {
                    safeNameReplacements[attribute.Name] = replacement;
                }
            }

            var safeMemberAccessReplacements = new Dictionary<MemberAccessExpressionSyntax, ExpressionSyntax>();
            foreach (var memberAccess in root.DescendantNodes().OfType<MemberAccessExpressionSyntax>())
            {
                if (IsInUnsupportedQualifiedNameContext(memberAccess))
                {
                    continue;
                }

                if (TryGetMemberAccessReplacement(semanticModel, memberAccess, out var replacement))
                {
                    safeMemberAccessReplacements.Add(memberAccess, replacement);
                }
            }

            if (safeNameReplacements.Count == 0 && safeMemberAccessReplacements.Count == 0)
            {
                return document;
            }

            var rewrittenRoot = root.ReplaceNodes(
                safeNameReplacements.Keys.Concat<SyntaxNode>(safeMemberAccessReplacements.Keys),
                (original, rewritten) => original switch
                {
                    NameSyntax name => safeNameReplacements[name].WithTriviaFrom(rewritten),
                    MemberAccessExpressionSyntax memberAccess => safeMemberAccessReplacements[memberAccess].WithTriviaFrom(rewritten),
                    _ => rewritten
                });
            return document.WithSyntaxRoot(rewrittenRoot);
        }

        private static ISymbol? GetSymbol(SemanticModel semanticModel, NameSyntax name) =>
            semanticModel.GetSymbolInfo(name).Symbol ??
            semanticModel.GetTypeInfo(name).Type;

        private static async Task<Document> ReduceParenthesizedAssignmentsAsync(Document document)
        {
            var root = await document.GetSyntaxRootAsync();
            if (root == null)
            {
                return document;
            }

            var assignments = root.DescendantNodes()
                .OfType<ParenthesizedExpressionSyntax>()
                .Where(static node =>
                    node.Expression is AssignmentExpressionSyntax &&
                    node.Parent is ExpressionStatementSyntax)
                .ToList();
            if (assignments.Count == 0)
            {
                return document;
            }

            var rewrittenRoot = root.ReplaceNodes(
                assignments,
                static (_, rewritten) => rewritten.Expression.WithTriviaFrom(rewritten));
            return document.WithSyntaxRoot(rewrittenRoot);
        }

        private static async Task<Document> ReduceDocumentationGlobalAliasesAsync(Document document)
        {
            var root = await document.GetSyntaxRootAsync();
            if (root == null)
            {
                return document;
            }

            var documentationTrivia = root.DescendantTrivia(descendIntoTrivia: true)
                .Where(static trivia =>
                    trivia.HasStructure &&
                    trivia.IsKind(SyntaxKind.SingleLineDocumentationCommentTrivia) &&
                    trivia.ToFullString().Contains("global::", StringComparison.Ordinal))
                .ToList();
            if (documentationTrivia.Count == 0)
            {
                return document;
            }

            var rewrittenRoot = root.ReplaceTrivia(
                documentationTrivia,
                static (_, rewritten) =>
                {
                    var reduced = rewritten.ToFullString().Replace("global::", string.Empty, StringComparison.Ordinal);
                    var parsedTrivia = SyntaxFactory.ParseLeadingTrivia(reduced);
                    return parsedTrivia.Count == 1 ? parsedTrivia[0] : rewritten;
                });
            return document.WithSyntaxRoot(rewrittenRoot);
        }

        private static bool TryGetNameReplacement(
            SemanticModel semanticModel,
            NameSyntax originalName,
            ISymbol originalSymbol,
            out NameSyntax replacement)
        {
            replacement = originalName;
            if (!TryGetNameParts(originalName, out var parts))
            {
                return false;
            }

            for (int i = parts.Count - 1; i >= 0; i--)
            {
                var candidate = BuildName(parts, i).WithTriviaFrom(originalName);
                if (SpeculativelyBindsToSameSymbol(semanticModel, originalName, candidate, originalSymbol))
                {
                    replacement = candidate;
                    return true;
                }
            }

            return false;
        }

        private static bool SpeculativelyBindsToSameSymbol(
            SemanticModel semanticModel,
            NameSyntax originalName,
            NameSyntax replacement,
            ISymbol originalSymbol)
        {
            var speculativeSymbol = semanticModel.GetSpeculativeSymbolInfo(
                originalName.SpanStart,
                replacement,
                SpeculativeBindingOption.BindAsTypeOrNamespace).Symbol;
            if (speculativeSymbol != null &&
                SymbolEqualityComparer.Default.Equals(originalSymbol, speculativeSymbol))
            {
                return true;
            }

            if (originalName.Parent is MemberAccessExpressionSyntax memberAccess &&
                memberAccess.Expression == originalName)
            {
                speculativeSymbol = semanticModel.GetSpeculativeSymbolInfo(
                    originalName.SpanStart,
                    replacement,
                    SpeculativeBindingOption.BindAsExpression).Symbol;
                return speculativeSymbol != null &&
                    SymbolEqualityComparer.Default.Equals(originalSymbol, speculativeSymbol);
            }

            return false;
        }

        private static bool TryGetNameParts(NameSyntax name, out IReadOnlyList<SimpleNameSyntax> parts)
        {
            var builder = new List<SimpleNameSyntax>();
            if (AddNameParts(name, builder))
            {
                parts = builder;
                return true;
            }

            parts = [];
            return false;
        }

        private static bool AddNameParts(NameSyntax name, List<SimpleNameSyntax> parts)
        {
            switch (name)
            {
                case SimpleNameSyntax simpleName:
                    parts.Add(simpleName);
                    return true;
                case QualifiedNameSyntax qualifiedName:
                    if (!AddNameParts(qualifiedName.Left, parts))
                    {
                        return false;
                    }

                    parts.Add(qualifiedName.Right);
                    return true;
                case AliasQualifiedNameSyntax { Alias.Identifier.ValueText: "global" } aliasQualifiedName:
                    parts.Add(aliasQualifiedName.Name);
                    return true;
                default:
                    return false;
            }
        }

        private static NameSyntax BuildName(IReadOnlyList<SimpleNameSyntax> parts, int startIndex)
        {
            NameSyntax name = parts[startIndex];
            for (int i = startIndex + 1; i < parts.Count; i++)
            {
                name = SyntaxFactory.QualifiedName(name, parts[i]);
            }

            return name;
        }

        private static SimpleNameSyntax GetRightmostName(NameSyntax name) => name switch
        {
            QualifiedNameSyntax qualifiedName => qualifiedName.Right,
            AliasQualifiedNameSyntax aliasQualifiedName => aliasQualifiedName.Name,
            SimpleNameSyntax simpleName => simpleName,
            _ => throw new InvalidOperationException($"Unexpected name syntax: {name.Kind()}")
        };

        private static bool TryGetAttributeNameReplacement(
            SemanticModel semanticModel,
            AttributeSyntax attribute,
            out NameSyntax replacement)
        {
            replacement = attribute.Name;
            if (attribute.Name is not QualifiedNameSyntax and not AliasQualifiedNameSyntax)
            {
                return false;
            }

            var originalSymbol = semanticModel.GetSymbolInfo(attribute).Symbol;
            if (originalSymbol is not IMethodSymbol { ContainingType: { } originalAttributeType })
            {
                return false;
            }

            var rightmostName = GetRightmostName(attribute.Name);
            var speculativeSymbol = semanticModel.GetSpeculativeSymbolInfo(
                attribute.Name.SpanStart,
                rightmostName,
                SpeculativeBindingOption.BindAsTypeOrNamespace).Symbol;
            if (!SymbolEqualityComparer.Default.Equals(originalAttributeType, speculativeSymbol))
            {
                return false;
            }

            replacement = TrimAttributeSuffix(rightmostName).WithTriviaFrom(attribute.Name);
            return true;
        }

        private static SimpleNameSyntax TrimAttributeSuffix(SimpleNameSyntax name)
        {
            const string AttributeSuffix = "Attribute";
            var identifier = name.Identifier;
            var text = identifier.ValueText;
            if (!text.EndsWith(AttributeSuffix, StringComparison.Ordinal) || text.Length == AttributeSuffix.Length)
            {
                return name;
            }

            return SyntaxFactory.IdentifierName(
                SyntaxFactory.Identifier(
                    identifier.LeadingTrivia,
                    text.Substring(0, text.Length - AttributeSuffix.Length),
                    identifier.TrailingTrivia));
        }

        private static bool TryGetMemberAccessReplacement(
            SemanticModel semanticModel,
            MemberAccessExpressionSyntax memberAccess,
            out ExpressionSyntax replacement)
        {
            replacement = memberAccess;
            var originalSymbol = semanticModel.GetSymbolInfo(memberAccess).Symbol;
            if (originalSymbol == null ||
                !TryGetMemberAccessParts(memberAccess, out var parts) ||
                parts.Count < 2 ||
                parts[0].Identifier.ValueText != "System")
            {
                return false;
            }

            for (int i = parts.Count - 1; i > 0; i--)
            {
                var candidate = BuildMemberAccess(parts, i).WithTriviaFrom(memberAccess);
                var speculativeSymbol = semanticModel.GetSpeculativeSymbolInfo(
                    memberAccess.SpanStart,
                    candidate,
                    SpeculativeBindingOption.BindAsExpression).Symbol;
                if (speculativeSymbol != null &&
                    SymbolEqualityComparer.Default.Equals(originalSymbol, speculativeSymbol))
                {
                    replacement = candidate;
                    return true;
                }
            }

            return false;
        }

        private static bool TryGetMemberAccessParts(ExpressionSyntax expression, out IReadOnlyList<SimpleNameSyntax> parts)
        {
            var builder = new List<SimpleNameSyntax>();
            if (AddMemberAccessParts(expression, builder))
            {
                parts = builder;
                return true;
            }

            parts = [];
            return false;
        }

        private static bool AddMemberAccessParts(SyntaxNode expression, List<SimpleNameSyntax> parts)
        {
            switch (expression)
            {
                case SimpleNameSyntax name:
                    parts.Add(name);
                    return true;
                case MemberAccessExpressionSyntax memberAccess:
                    if (!AddMemberAccessParts(memberAccess.Expression, parts))
                    {
                        return false;
                    }

                    parts.Add(memberAccess.Name);
                    return true;
                case QualifiedNameSyntax qualifiedName:
                    if (!AddMemberAccessParts(qualifiedName.Left, parts))
                    {
                        return false;
                    }

                    parts.Add(qualifiedName.Right);
                    return true;
                case AliasQualifiedNameSyntax { Alias.Identifier.ValueText: "global" } aliasQualifiedName:
                    parts.Add(aliasQualifiedName.Name);
                    return true;
                default:
                    return false;
            }
        }

        private static ExpressionSyntax BuildMemberAccess(IReadOnlyList<SimpleNameSyntax> parts, int startIndex)
        {
            ExpressionSyntax expression = parts[startIndex];
            for (int i = startIndex + 1; i < parts.Count; i++)
            {
                expression = SyntaxFactory.MemberAccessExpression(
                    SyntaxKind.SimpleMemberAccessExpression,
                    expression,
                    parts[i]);
            }

            return expression;
        }

        private static bool IsInUnsupportedQualifiedNameContext(NameSyntax name) =>
            name.Ancestors().Any(static ancestor =>
                ancestor is UsingDirectiveSyntax ||
                ancestor is CrefSyntax);

        private static bool IsInUnsupportedQualifiedNameContext(ExpressionSyntax expression) =>
            expression.Ancestors().Any(static ancestor =>
                ancestor is CrefSyntax);

        private static bool ContainsSimplifierAnnotations(SyntaxNode root) =>
            root.HasAnnotation(Simplifier.Annotation) ||
            root.DescendantNodesAndTokens(descendIntoTrivia: true).Any(static nodeOrToken =>
                nodeOrToken.HasAnnotation(Simplifier.Annotation));

        private static IReadOnlyList<TextSpan> GetSimplifierSpans(SyntaxNode root)
        {
            List<TextSpan> spans = new();
            foreach (var member in root.DescendantNodes().OfType<MemberDeclarationSyntax>())
            {
                if (ContainsReducibleSyntax(member))
                {
                    spans.Add(member.FullSpan);
                }
            }

            spans.AddRange(root
                .DescendantNodesAndTokens(descendIntoTrivia: true)
                .Where(static nodeOrToken => nodeOrToken.HasAnnotation(Simplifier.Annotation))
                .Select(static nodeOrToken => nodeOrToken.FullSpan));

            return spans;
        }

        private static bool ContainsReducibleSyntax(SyntaxNode root) =>
            root.DescendantNodes(
                descendIntoChildren: node => node == root || node is not MemberDeclarationSyntax,
                descendIntoTrivia: true).Any(static node =>
                node is ThisExpressionSyntax ||
                node is ParenthesizedExpressionSyntax ||
                node is CrefSyntax ||
                node is QualifiedNameSyntax ||
                node is MemberAccessExpressionSyntax ||
                node is AssignmentExpressionSyntax { RawKind: (int)SyntaxKind.SimpleAssignmentExpression } ||
                node is AliasQualifiedNameSyntax { Alias.Identifier.ValueText: "global" });

        public static bool IsGeneratedDocument(Document document) => document.Folders.Contains(GeneratedFolder);
        public static bool IsCustomDocument(Document document) => !IsGeneratedDocument(document);
        public static bool IsGeneratedTestDocument(Document document) => document.Folders.Contains(GeneratedTestFolder);

        /// <summary>
        /// Create a new AdHoc workspace using the Roslyn SDK and add a project with all the necessary compilation options.
        /// </summary>
        /// <returns>The created project in the solution.</returns>
        private static Project CreateGeneratedCodeProject()
        {
            var workspace = new AdhocWorkspace();
            var newOptionSet = workspace.Options.WithChangedOption(FormattingOptions.NewLine, LanguageNames.CSharp, NewLine);
            workspace.TryApplyChanges(workspace.CurrentSolution.WithOptions(newOptionSet));
            Project generatedCodeProject = workspace.AddProject(GeneratedCodeProjectName, LanguageNames.CSharp);

            generatedCodeProject = generatedCodeProject
                .AddMetadataReferences(_assemblyMetadataReferences.Value.Concat(CodeModelGenerator.Instance.AdditionalMetadataReferences))
                .WithCompilationOptions(new CSharpCompilationOptions(
                    OutputKind.DynamicallyLinkedLibrary, metadataReferenceResolver: _metadataReferenceResolver.Value, nullableContextOptions: NullableContextOptions.Disable));
            return generatedCodeProject;
        }

        internal static async Task<GeneratedCodeWorkspace> Create(bool isCustomCodeProject)
        {
            // prepare the generated code project
            var projectTask = Interlocked.Exchange(ref _cachedProject, null);
            var project = projectTask != null ? await projectTask : CreateGeneratedCodeProject();

            var outputDirectory = CodeModelGenerator.Instance.Configuration.OutputDirectory;
            var projectDirectory = CodeModelGenerator.Instance.Configuration.ProjectDirectory;
            var generatedDirectory = CodeModelGenerator.Instance.Configuration.ProjectGeneratedDirectory;

            // add all documents except the documents from the generated directory
            if (Path.IsPathRooted(projectDirectory) && Path.IsPathRooted(outputDirectory))
            {
                projectDirectory = Path.GetFullPath(projectDirectory);
                outputDirectory = Path.GetFullPath(outputDirectory);

                Directory.CreateDirectory(projectDirectory);
                Directory.CreateDirectory(outputDirectory);

                project = AddDirectory(project, projectDirectory, skipPredicate: sourceFile => sourceFile.StartsWith(generatedDirectory));
            }

            foreach (var sharedSourceFolder in CodeModelGenerator.Instance.SharedSourceDirectories)
            {
                project = AddDirectory(project, sharedSourceFolder, folders: _sharedFolders);
            }

            project = project.WithParseOptions(new CSharpParseOptions(
                preprocessorSymbols: ["EXPERIMENTAL"],
                documentationMode: isCustomCodeProject ? DocumentationMode.None : DocumentationMode.Parse));

            return new GeneratedCodeWorkspace(project);
        }

        private static async Task<Compilation?> CreateLastContractFromDll(string xmlDocumentationpath, string dllPath)
        {
            var workspace = new AdhocWorkspace();
            Project project = workspace.AddProject("LastContract", LanguageNames.CSharp);
            XmlDocumentationProvider? documentationProvider = File.Exists(xmlDocumentationpath)
               ? XmlDocumentationProvider.CreateFromFile(xmlDocumentationpath)
               : null;
            List<MetadataReference> metadataReferences =
            [
                .. _assemblyMetadataReferences.Value.Concat(CodeModelGenerator.Instance.AdditionalMetadataReferences),
                MetadataReference.CreateFromFile(dllPath, documentation: documentationProvider)
            ];
            project = project
                .AddMetadataReferences(metadataReferences)
                .WithCompilationOptions(new CSharpCompilationOptions(
                    OutputKind.DynamicallyLinkedLibrary, metadataReferenceResolver: _metadataReferenceResolver.Value, nullableContextOptions: NullableContextOptions.Disable));
            return await project.GetCompilationAsync();
        }

        /// <summary>
        /// Add the files in the directory to a project per a given predicate with the folders specified.
        /// </summary>
        /// <param name="project"></param>
        /// <param name="directory"></param>
        /// <param name="skipPredicate"></param>
        /// <param name="folders"></param>
        /// <returns>The <see cref="Project"/> instance with the added directory and files.</returns>
        internal static Project AddDirectory(Project project, string directory, Func<string, bool>? skipPredicate = null, IEnumerable<string>? folders = null)
        {
            foreach (string sourceFile in Directory.GetFiles(directory, "*.cs", SearchOption.AllDirectories))
            {
                if (skipPredicate != null && skipPredicate(sourceFile))
                    continue;

                project = project.AddDocument(sourceFile, File.ReadAllText(sourceFile), folders ?? Array.Empty<string>(), sourceFile).Project;
            }

            return project;
        }

        /// <summary>
        /// This method invokes the postProcessor to do some post processing work
        /// Depending on the configuration, it will either remove + internalize, just internalize or do nothing
        /// </summary>
        public async Task PostProcessAsync()
        {
            var modelFactory = CodeModelGenerator.Instance.OutputLibrary.ModelFactory.Value;
            var nonRootTypes = CodeModelGenerator.Instance.NonRootTypes;
            var postProcessor = new PostProcessor(
                [.. CodeModelGenerator.Instance.TypeFactory.UnionVariantTypesToKeep, .. CodeModelGenerator.Instance.AdditionalRootTypes],
                modelFactoryFullName: modelFactory.Type.FullyQualifiedName,
                additionalNonRootTypeNames: nonRootTypes);

            switch (Configuration.UnreferencedTypesHandling)
            {
                case Configuration.UnreferencedTypesHandlingOption.KeepAll:
                    break;
                case Configuration.UnreferencedTypesHandlingOption.Internalize:
                    _project = await postProcessor.InternalizeAsync(_project);
                    break;
                case Configuration.UnreferencedTypesHandlingOption.RemoveOrInternalize:
                    _project = await postProcessor.InternalizeAsync(_project);
                    _project = await postProcessor.RemoveAsync(_project);
                    break;
            }
        }

        /// <summary>
        /// Resolves PackageReference items from the project's .csproj file and adds their assemblies
        /// as metadata references so that custom code referencing external NuGet types compiles correctly.
        /// </summary>
        internal static async Task AddPackageReferencesFromProject()
        {
            var packageName = CodeModelGenerator.Instance.Configuration.PackageName;
            string projectFilePath = Path.GetFullPath(
                Path.Combine(CodeModelGenerator.Instance.Configuration.ProjectDirectory, $"{packageName}.csproj"));

            if (!File.Exists(projectFilePath))
            {
                return;
            }

            var projectRoot = ProjectRootElement.Open(projectFilePath, new MSBuildProjectCollection());

            var nugetSettings = Settings.LoadDefaultSettings(projectFilePath);
            var globalPackagesFolder = SettingsUtility.GetGlobalPackagesFolder(nugetSettings);

            // Build a set of assembly names already registered so we can skip them
            var existingRefs = new HashSet<string>(
                CodeModelGenerator.Instance.AdditionalMetadataReferences
                    .Where(r => r.Display is not null)
                    .Select(r => Path.GetFileNameWithoutExtension(r.Display!))
                    .Where(n => !string.IsNullOrEmpty(n)),
                StringComparer.OrdinalIgnoreCase);

            foreach (var item in projectRoot.Items.Where(i => i.ItemType == "PackageReference"))
            {
                var refPackageName = item.Include;

                if (string.IsNullOrEmpty(refPackageName))
                {
                    continue;
                }

                // Skip packages already added as metadata references (e.g., by a plugin)
                if (existingRefs.Contains(refPackageName))
                {
                    continue;
                }

                // Search the NuGet global packages folder for any cached version of this package.
                string? resolvedAssemblyPath = NugetPackageResolver.FindPackageAssembly(globalPackagesFolder, refPackageName);

                // If not found in cache, download the latest version from NuGet feeds
                if (resolvedAssemblyPath == null)
                {
                    try
                    {
                        var latestVersion = await NugetPackageResolver.ResolveLatestPackageVersion(refPackageName, nugetSettings);
                        if (latestVersion != null)
                        {
                            var downloader = new NugetPackageDownloader(refPackageName, latestVersion, null, nugetSettings);
                            var downloadedPath = await downloader.DownloadAndInstallPackage();
                            var downloadedAssembly = Path.Combine(downloadedPath, $"{refPackageName}.dll");
                            if (File.Exists(downloadedAssembly))
                            {
                                resolvedAssemblyPath = downloadedAssembly;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        CodeModelGenerator.Instance.Emitter.Debug(
                            $"Could not download package {refPackageName}: {ex.Message}");
                    }
                }

                if (resolvedAssemblyPath != null)
                {
                    CodeModelGenerator.Instance.AddMetadataReference(
                        MetadataReference.CreateFromFile(resolvedAssemblyPath));
                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"Added metadata reference: {refPackageName} from {resolvedAssemblyPath}");
                }
            }
        }

        internal static async Task<Compilation?> LoadBaselineContract()
        {
            var packageName = CodeModelGenerator.Instance.TypeFactory.PrimaryNamespace;
            string projectFilePath = Path.GetFullPath(Path.Combine(CodeModelGenerator.Instance.Configuration.ProjectDirectory, $"{packageName}.csproj"));

            if (!File.Exists(projectFilePath))
                return null;

            var projectRoot = ProjectRootElement.Open(projectFilePath);
            var baselineVersion = projectRoot.Properties.SingleOrDefault(p => p.Name == ApiCompatPropertyName)?.Value;
            if (baselineVersion == null)
                return null;

            var targetFrameworksValue = projectRoot.Properties
                .FirstOrDefault(p => p.Name == TargetFrameworkPropertyName || p.Name == TargetFrameworksPropertyName)?.Value;
            HashSet<string>? parsedTargetFrameworks = ParseNetTargetFrameworks(targetFrameworksValue);

            var nugetSettings = Settings.LoadDefaultSettings(projectFilePath);
            var nugetGlobalPackageFolder = SettingsUtility.GetGlobalPackagesFolder(nugetSettings);

            // Try to find or download the assembly
            try
            {
                string nugetFolderPathToAssembly = string.Empty;
                string assemblyFileFullPath = string.Empty;
                bool foundInstalledAssembly = false;

                foreach (var preferredTargetFramework in NugetPackageDownloader.PreferredDotNetFrameworkVersions)
                {
                    if (parsedTargetFrameworks != null && !parsedTargetFrameworks.Contains(preferredTargetFramework))
                        continue;

                    nugetFolderPathToAssembly = Path.Combine(
                        nugetGlobalPackageFolder,
                        packageName.ToLowerInvariant(),
                        baselineVersion,
                        "lib",
                        preferredTargetFramework);
                    assemblyFileFullPath = Path.Combine(nugetFolderPathToAssembly, $"{packageName}.dll");

                    if (File.Exists(assemblyFileFullPath))
                    {
                        foundInstalledAssembly = true;
                        break;
                    }
                }

                // If assembly doesn't exist locally, download it & install it
                if (!foundInstalledAssembly)
                {
                    NugetPackageDownloader downloader = new(packageName, baselineVersion, parsedTargetFrameworks, nugetSettings);
                    nugetFolderPathToAssembly = await downloader.DownloadAndInstallPackage();
                    assemblyFileFullPath = Path.Combine(nugetFolderPathToAssembly, $"{packageName}.dll");
                }

                string xmlDocPath = Path.Combine(nugetFolderPathToAssembly, $"{packageName}.xml");
                return await CreateLastContractFromDll(xmlDocPath, assemblyFileFullPath);
            }
            catch (Exception ex)
            {
                CodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                    DiagnosticCodes.BaselineContractMissing,
                    $"Cannot find Baseline contract assembly ({packageName}@{baselineVersion}) from Nuget Global Package Folder. " +
                    $"Please make sure the baseline nuget package has been installed properly. Error: {ex.Message}");
                return null;
            }
        }

        private static HashSet<string>? ParseNetTargetFrameworks(string? targetFrameworksValue)
        {
            if (string.IsNullOrEmpty(targetFrameworksValue))
            {
                return null;
            }

            var parsedFrameworks = targetFrameworksValue.Split(';')
                .Where(framework => framework.StartsWith("net"))
                .ToHashSet();

            return parsedFrameworks.Count > 0 ? parsedFrameworks : null;
        }
    }
}

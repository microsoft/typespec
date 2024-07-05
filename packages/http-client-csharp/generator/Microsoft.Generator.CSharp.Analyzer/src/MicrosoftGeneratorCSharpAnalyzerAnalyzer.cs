// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace Microsoft.Generator.CSharp.Analyzer
{
    [DiagnosticAnalyzer(LanguageNames.CSharp)]
    public class MicrosoftGeneratorCSharpAnalyzerAnalyzer : DiagnosticAnalyzer
    {
        public const string DiagnosticId = "MGC0001";

        //// You can change these strings in the Resources.resx file. If you do not want your analyzer to be localize-able, you can use regular strings for Title and MessageFormat.
        //// See https://github.com/dotnet/roslyn/blob/main/docs/analyzers/Localizing%20Analyzers.md for more on localization
        private const string Title = "Use fluent API of expressions instead";
        private const string MessageFormat = "Use fluent API of expressions instead of using the constructor of type '{0}'.";
        //private static readonly LocalizableString Description = new LocalizableResourceString(nameof(Resources.AnalyzerDescription), Resources.ResourceManager, typeof(Resources));
        private const string Category = "Expressions";

        private static readonly DiagnosticDescriptor Rule = new DiagnosticDescriptor(DiagnosticId, Title, MessageFormat, Category, DiagnosticSeverity.Warning, isEnabledByDefault: true);

        public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics { get { return ImmutableArray.Create(Rule); } }

        public override void Initialize(AnalysisContext context)
        {
            context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
            context.EnableConcurrentExecution();

            // TODO: Consider registering other actions that act on syntax instead of or in addition to symbols
            // See https://github.com/dotnet/roslyn/blob/main/docs/analyzers/Analyzer%20Actions%20Semantics.md for more information
            //context.RegisterSymbolAction(AnalyzeSymbol, SymbolKind.NamedType);
            context.RegisterSyntaxNodeAction(AnalyzeNode, SyntaxKind.ObjectCreationExpression);
        }

        private static void AnalyzeNode(SyntaxNodeAnalysisContext context)
        {
            var objectCreationExpr = (ObjectCreationExpressionSyntax)context.Node;

            // Check if the type of the object being created is 'Foo'
            var typeSymbol = context.SemanticModel.GetTypeInfo(objectCreationExpr).Type;
            var fullname = typeSymbol.ToDisplayString(SymbolDisplayFormat.MinimallyQualifiedFormat);
            if (!reportedTypes.Contains(typeSymbol.Name))
                return;

            // If it is, report a diagnostic
            var diagnostic = Diagnostic.Create(Rule, objectCreationExpr.GetLocation(), typeSymbol.Name);
            context.ReportDiagnostic(diagnostic);
        }

        private static readonly HashSet<string> reportedTypes = [
            "InvokeMethodExpression"
            ];
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace Microsoft.TypeSpec.Generator
{
    // Original-compilation facts for the bounded whole-cref import-diagnostic
    // certificate. Symbol equality alone does not preserve unused-import state.
    internal static class StructuralCrefImportRules
    {
        internal static bool SupportsCompilation(Compilation compilation)
        {
            if (compilation is not CSharpCompilation csharp || csharp.ScriptCompilationInfo != null ||
                !csharp.Options.Usings.IsDefaultOrEmpty ||
                csharp.Options.GeneralDiagnosticOption != ReportDiagnostic.Default || csharp.Options.SpecificDiagnosticOptions.Count != 0)
                return false;
            foreach (var tree in compilation.SyntaxTrees)
            {
                if (tree.Options is not CSharpParseOptions { Kind: SourceCodeKind.Regular } options ||
                    options.Features.Keys.Any(static key => key.IndexOf("interceptor", StringComparison.OrdinalIgnoreCase) >= 0) ||
                    tree.GetRoot() is not CompilationUnitSyntax root) return false;
                // Global imports can change diagnostics in OTHER documents. Aliases
                // and static imports need an independent usage certificate. Inspect
                // only import-bearing namespace containers, not method bodies.
                if (UnsupportedImports(root.Usings, root.Externs.Count)) return false;
                var pending = new Stack<BaseNamespaceDeclarationSyntax>(root.Members.OfType<BaseNamespaceDeclarationSyntax>());
                while (pending.TryPop(out var ns))
                {
                    if (UnsupportedImports(ns.Usings, ns.Externs.Count)) return false;
                    foreach (var nested in ns.Members.OfType<BaseNamespaceDeclarationSyntax>()) pending.Push(nested);
                }
            }
            return true;
        }

        private static bool UnsupportedImports(SyntaxList<UsingDirectiveSyntax> imports, int externs) => externs != 0 ||
            imports.Any(static directive => directive.Alias != null || directive.StaticKeyword.IsKind(SyntaxKind.StaticKeyword) ||
                directive.GlobalKeyword.IsKind(SyntaxKind.GlobalKeyword));

        internal static Compilation OriginalDiagnosticCompilation(Compilation compilation)
        {
            // AdhocWorkspace installs a provider even with no configured filters.
            // Never infer unused-import safety from a potentially filtered bag.
            // This immutable ORIGINAL-source view is shared once per reducer; no
            // candidate tree is compiled, and no per-edit project clone is made.
            var csharp = (CSharpCompilation)compilation;
            return csharp.Options.SyntaxTreeOptionsProvider is not { } provider ? compilation :
                csharp.WithOptions(csharp.Options.WithSyntaxTreeOptionsProvider(new UnfilteredDiagnosticOptions(provider)));
        }

        private sealed class UnfilteredDiagnosticOptions(SyntaxTreeOptionsProvider original) : SyntaxTreeOptionsProvider
        {
            public override GeneratedKind IsGenerated(SyntaxTree tree, CancellationToken cancellationToken) => original.IsGenerated(tree, cancellationToken);
            public override bool TryGetDiagnosticValue(SyntaxTree tree, string diagnosticId, CancellationToken cancellationToken, out ReportDiagnostic severity)
            {
                severity = ReportDiagnostic.Default;
                return false;
            }
            public override bool TryGetGlobalDiagnosticValue(string diagnosticId, CancellationToken cancellationToken, out ReportDiagnostic severity)
            {
                severity = ReportDiagnostic.Default;
                return false;
            }
        }

        internal static bool CanEraseTypeWithoutImportUse(TypeSyntax type, SemanticModel model)
        {
            if (type is PredefinedTypeSyntax || model.GetTypeInfo(type).Type is ITypeParameterSymbol) return true;
            if (type is ArrayTypeSyntax array) return CanEraseTypeWithoutImportUse(array.ElementType, model);
            if (type is NullableTypeSyntax nullable) return CanEraseTypeWithoutImportUse(nullable.ElementType, model);
            if (type is TupleTypeSyntax tuple) return tuple.Elements.All(element => CanEraseTypeWithoutImportUse(element.Type, model));
            if (type is not NameSyntax name) return false;
            NameSyntax root = name;
            while (root is QualifiedNameSyntax qualified) root = qualified.Left;
            if (root is not AliasQualifiedNameSyntax alias || alias.Alias.Identifier.Text != "global") return false;
            // A rooted outer name is not enough: an unqualified generic argument
            // can still consume an import, e.g. global::List<DateTimeOffset>.
            return name.DescendantNodesAndSelf().OfType<GenericNameSyntax>().All(generic =>
                generic.TypeArgumentList.Arguments.All(argument => CanEraseTypeWithoutImportUse(argument, model)));
        }

        internal static bool SupportsOriginalTreeSourcePolicy(SyntaxTree tree)
        {
            if (tree.Options.DocumentationMode == DocumentationMode.None) return false;
            var root = tree.GetRoot();
            return !root.ContainsDirectives || !root.DescendantTrivia(descendIntoTrivia: true).Any(static trivia =>
                trivia.IsKind(SyntaxKind.PragmaWarningDirectiveTrivia) || trivia.IsKind(SyntaxKind.LineSpanDirectiveTrivia));
        }

        internal static bool HasSafeOriginalTreeDiagnostics(SemanticModel model)
        {
            if (!SupportsOriginalTreeSourcePolicy(model.SyntaxTree)) return false;
            // Deliberately request the COMPLETE original tree. A cref-sized span
            // does not force Roslyn's unused-import accounting. Empty filtered or
            // unsupported diagnostics are never treated as proof of usage.
            // Retain on ANY original diagnostic, including hidden CS8019, rather
            // than guessing which import one occurrence might consume.
            return model.GetDiagnostics().Length == 0;
        }
    }
}

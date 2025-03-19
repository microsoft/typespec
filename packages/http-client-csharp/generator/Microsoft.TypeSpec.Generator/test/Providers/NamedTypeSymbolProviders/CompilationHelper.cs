using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.NamedTypeSymbolProviders
{
    public static class CompilationHelper
    {
        public static Compilation LoadCompilation(IEnumerable<TypeProvider> providers, IEnumerable<Type>? metadataReferenceTypes = default)
        {
            MockHelpers.LoadMockGenerator();
            List<SyntaxTree> files = new List<SyntaxTree>();
            foreach (var provider in providers)
            {
                files.Add(GeneratedCodeWorkspace.GetTree(provider));
            }

            return CSharpCompilation.Create(
                assemblyName: "TestAssembly",
                syntaxTrees: [.. files],
                references: [.. metadataReferenceTypes?.Select(t => MetadataReference.CreateFromFile(t.Assembly.Location)) ?? [], MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
        }

        internal static INamedTypeSymbol? GetSymbol(INamespaceSymbol namespaceSymbol, string name)
        {
            foreach (var childNamespaceSymbol in namespaceSymbol.GetNamespaceMembers())
            {
                return GetSymbol(childNamespaceSymbol, name);
            }

            foreach (INamedTypeSymbol symbol in namespaceSymbol.GetTypeMembers())
            {
                if (symbol.MetadataName == name)
                {
                    return symbol;
                }
            }

            return null;
        }
    }
}

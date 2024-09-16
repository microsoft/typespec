using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Tests.Providers.NamedTypeSymbolProviders
{
    public static class CompilationHelper
    {
        public static Compilation LoadCompilation(IEnumerable<TypeProvider> providers, IEnumerable<Type>? metadataReferenceTypes = default)
        {
            MockHelpers.LoadMockPlugin();
            List<SyntaxTree> files = new List<SyntaxTree>();
            foreach (var provider in providers)
            {
                files.Add(GetTree(provider));
            }

            return CSharpCompilation.Create(
                assemblyName: "TestAssembly",
                syntaxTrees: [.. files],
                references: [.. metadataReferenceTypes?.Select(t => MetadataReference.CreateFromFile(t.Assembly.Location)) ?? [], MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
        }

        private static SyntaxTree GetTree(TypeProvider provider)
        {
            var writer = new TypeProviderWriter(provider);
            var file = writer.Write();
            return CSharpSyntaxTree.ParseText(file.Content, path: Path.Join(provider.RelativeFilePath, provider.Name + ".cs"));
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

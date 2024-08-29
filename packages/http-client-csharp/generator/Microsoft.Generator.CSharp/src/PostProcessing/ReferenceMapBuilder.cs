// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.FindSymbols;

namespace Microsoft.Generator.CSharp
{
    internal class ReferenceMapBuilder
    {
        private readonly Compilation _compilation;
        private readonly Project _project;

        public ReferenceMapBuilder(Compilation compilation, Project project)
        {
            _compilation = compilation;
            _project = project;
        }

        public async Task<ReferenceMap> BuildPublicReferenceMapAsync(IEnumerable<INamedTypeSymbol> definitions, IReadOnlyDictionary<INamedTypeSymbol, HashSet<BaseTypeDeclarationSyntax>> nodeCache)
        {
            var referenceMap = new ReferenceMap();
            foreach (var definition in definitions)
            {
                await ProcessPublicSymbolAsync(definition, referenceMap, nodeCache);
            }

            return referenceMap;
        }

        public async Task<ReferenceMap> BuildAllReferenceMapAsync(IEnumerable<INamedTypeSymbol> definitions, IReadOnlyDictionary<Document, HashSet<INamedTypeSymbol>> documentCache)
        {
            var referenceMap = new ReferenceMap();
            foreach (var definition in definitions)
            {
                await ProcessSymbolAsync(definition, referenceMap, documentCache);
            }

            return referenceMap;
        }

        private async Task ProcessPublicSymbolAsync(INamedTypeSymbol symbol, ReferenceMap referenceMap, IReadOnlyDictionary<INamedTypeSymbol, HashSet<BaseTypeDeclarationSyntax>> cache)
        {
            // only add to reference when myself is public
            if (symbol.DeclaredAccessibility != Accessibility.Public)
                return;

            // process myself, adding base and generic arguments
            AddTypeSymbol(symbol, symbol, referenceMap);

            // add my sibling classes
            foreach (var declaration in cache[symbol])
            {
                // first find all the derived types from this type
                foreach (var derivedTypeSymbol in await SymbolFinder.FindDerivedClassesAsync(symbol, _project.Solution))
                {
                    AddTypeSymbol(symbol, derivedTypeSymbol, referenceMap);
                }
            }

            // go over all the members
            foreach (var member in symbol.GetMembers())
            {
                // only go through the public members
                if (member.DeclaredAccessibility != Accessibility.Public)
                    continue;

                switch (member)
                {
                    case IMethodSymbol methodSymbol:
                        ProcessMethodSymbol(symbol, methodSymbol, referenceMap);
                        break;
                    case IPropertySymbol propertySymbol:
                        ProcessPropertySymbol(symbol, propertySymbol, referenceMap);
                        break;
                    case IFieldSymbol fieldSymbol:
                        ProcessFieldSymbol(symbol, fieldSymbol, referenceMap);
                        break;
                    case IEventSymbol eventSymbol:
                        ProcessEventSymbol(symbol, eventSymbol, referenceMap);
                        break;
                    case INamedTypeSymbol innerTypeSymbol:
                        break; // do nothing for the inner types
                    default:
                        throw new InvalidOperationException($"This case has not been covered {member.GetType()}");
                }
            }
        }

        private async Task ProcessSymbolAsync(INamedTypeSymbol symbol, ReferenceMap referenceMap, IReadOnlyDictionary<Document, HashSet<INamedTypeSymbol>> documentCache)
        {
            foreach (var reference in await SymbolFinder.FindReferencesAsync(symbol, _project.Solution))
            {
                await AddReferenceToReferenceMapAsync(symbol, reference, referenceMap, documentCache);
            }

            // static class can have direct references, like ClassName.Method, but the extension methods might not have direct reference to the class itself
            // therefore here we find the references of all its members and add them to the reference map
            await ProcessExtensionSymbol(symbol, referenceMap, documentCache);
        }

        private async Task ProcessExtensionSymbol(INamedTypeSymbol extensionClassSymbol, ReferenceMap referenceMap, IReadOnlyDictionary<Document, HashSet<INamedTypeSymbol>> documentCache)
        {
            if (!extensionClassSymbol.IsStatic)
                return;

            foreach (var member in extensionClassSymbol.GetMembers())
            {
                if (member is not IMethodSymbol methodSymbol)
                    continue;

                if (!methodSymbol.IsExtensionMethod)
                    continue;

                foreach (var reference in await SymbolFinder.FindReferencesAsync(member, _project.Solution))
                {
                    await AddReferenceToReferenceMapAsync(extensionClassSymbol, reference, referenceMap, documentCache);
                }

                // this is to hook the extension class like this:
                // internal static class FooExtensions
                // {
                //     public static string ToSerialString(this Foo foo) => foo.ToString();
                //     public static Foo ToFoo(this string foo) => // omit body
                // }

                // if this is an extension method, we add it to the reference map of the type it is extending to pretend that this class is a part of that type
                // handle the first method above
                if (methodSymbol.Parameters.FirstOrDefault()?.Type is INamedTypeSymbol typeSymbol)
                    referenceMap.AddInList(typeSymbol, extensionClassSymbol);

                // we also add the return type into the reference map of the extension class to cover both cases
                // handle the second method above
                if (methodSymbol.ReturnType is INamedTypeSymbol returnTypeSymbol)
                    referenceMap.AddInList(returnTypeSymbol, extensionClassSymbol);
            }
        }

        private async Task AddReferenceToReferenceMapAsync(INamedTypeSymbol symbol, ReferencedSymbol reference, ReferenceMap referenceMap, IReadOnlyDictionary<Document, HashSet<INamedTypeSymbol>> documentCache)
        {
            foreach (var location in reference.Locations)
            {
                var document = location.Document;

                // skip this reference if it comes from a document that does not define any symbol
                if (!documentCache.TryGetValue(document, out var candidateReferenceSymbols))
                    continue;

                if (candidateReferenceSymbols.Count == 1)
                {
                    referenceMap.AddInList(candidateReferenceSymbols.Single(), symbol);
                }
                else
                {
                    // fallback to calculate the symbol when the document contains multiple type symbols
                    // this should never happen in the generated code
                    // customized code might have this issue
                    var root = await document.GetSyntaxRootAsync();
                    if (root == null)
                        continue;
                    // get the node of this reference
                    var node = root.FindNode(location.Location.SourceSpan);
                    var owner = GetOwnerTypeOfReference(node);
                    if (owner == null)
                    {
                        referenceMap.AddGlobal(symbol);
                    }
                    else
                    {
                        var semanticModel = _compilation.GetSemanticModel(owner.SyntaxTree);
                        var ownerSymbol = semanticModel.GetDeclaredSymbol(owner);

                        if (ownerSymbol == null)
                            continue;
                        // add it to the map
                        referenceMap.AddInList(ownerSymbol, symbol);
                    }
                }
            }
        }

        /// <summary>
        /// This method recursively adds all related types in <paramref name="valueSymbol"/> to the reference map as the value of key <paramref name="keySymbol"/>
        /// </summary>
        /// <param name="keySymbol"></param>
        /// <param name="valueSymbol"></param>
        /// <param name="referenceMap"></param>
        private void AddTypeSymbol(ITypeSymbol keySymbol, ITypeSymbol? valueSymbol, ReferenceMap referenceMap)
        {
            if (keySymbol is not INamedTypeSymbol keyTypeSymbol)
                return;
            if (valueSymbol is not INamedTypeSymbol valueTypeSymbol)
                return;
            // add the class and all its partial classes to the map
            // this will make all the partial classes are referencing each other in the reference map
            // when we make the travesal over the reference map, we will not only remove one of the partial class, instead we will either keep all the partial classes (if at least one of them has references), or remove all of them (if none of them has references)
            if (!referenceMap.AddInList(keyTypeSymbol, valueTypeSymbol))
            {
                return; // we short cut if the valueTypeSymbol has already existed in the list to avoid infinite loops
            }
            // add the base type
            AddTypeSymbol(keyTypeSymbol, valueTypeSymbol.BaseType, referenceMap);
            // add the interfaces if there is any
            foreach (var interfaceSymbol in valueTypeSymbol.Interfaces)
            {
                AddTypeSymbol(keyTypeSymbol, interfaceSymbol, referenceMap);
            }
            // add the generic type arguments
            foreach (var typeArgument in valueTypeSymbol.TypeArguments)
            {
                AddTypeSymbol(keyTypeSymbol, typeArgument, referenceMap);
            }
        }

        private void ProcessMethodSymbol(INamedTypeSymbol keySymbol, IMethodSymbol methodSymbol, ReferenceMap referenceMap)
        {
            // add the return type
            AddTypeSymbol(keySymbol, methodSymbol.ReturnType, referenceMap);
            // add the parameters
            foreach (var parameter in methodSymbol.Parameters)
            {
                AddTypeSymbol(keySymbol, parameter.Type, referenceMap);
            }
        }

        private void ProcessPropertySymbol(INamedTypeSymbol keySymbol, IPropertySymbol propertySymbol, ReferenceMap referenceMap)
        {
            AddTypeSymbol(keySymbol, propertySymbol.Type, referenceMap);

            // find the node that defines myself
            var xml = propertySymbol.GetDocumentationCommentXml();
            if (string.IsNullOrEmpty(xml))
            {
                return;
            }

            var xDocument = XDocument.Parse(xml);
            var cRefs = xDocument.Descendants().Attributes("cref").Select(a => a.Value).Where(a => a[0] == 'T' && a[1] == ':').Select(a => a.Substring(2));

            foreach (var cref in cRefs)
            {
                var symbol = _compilation.GetTypeByMetadataName(cref);
                AddTypeSymbol(keySymbol, symbol, referenceMap);
            }
        }

        private void ProcessFieldSymbol(INamedTypeSymbol keySymbol, IFieldSymbol fieldSymbol, ReferenceMap referenceMap) => AddTypeSymbol(keySymbol, fieldSymbol.Type, referenceMap);

        private void ProcessEventSymbol(INamedTypeSymbol keySymbol, IEventSymbol eventSymbol, ReferenceMap referenceMap) => AddTypeSymbol(keySymbol, eventSymbol.Type, referenceMap);

        /// <summary>
        /// Returns the node that defines <paramref name="node"/> inside the document, which should be <see cref="ClassDeclarationSyntax"/>, <see cref="StructDeclarationSyntax"/> or <see cref="EnumDeclarationSyntax"/>
        /// The <paramref name="node"/> here should come from the result of <see cref="SymbolFinder"/>, therefore a result is guaranteed
        /// </summary>
        /// <param name="node"></param>
        /// <returns></returns>
        private static BaseTypeDeclarationSyntax? GetOwnerTypeOfReference(SyntaxNode node)
        {
            SyntaxNode? current = node;
            while (current != null)
            {
                if (current is BaseTypeDeclarationSyntax declarationNode)
                    return declarationNode;

                current = current.Parent;
            }

            // this means owner of the reference is outside a type definition. For instance, we could have an assembly attribute that is referencing a class using `nameof`
            return null;
        }
    }
}

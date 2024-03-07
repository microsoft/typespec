// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using System.Collections.Immutable;
using System.IO;
using System.Linq;
using AutoRest.CSharp.AutoRest.Plugins;
using AutoRest.CSharp.Common.Output.PostProcessing;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace AutoRest.CSharp.Mgmt.AutoRest.PostProcess
{
    internal sealed class MgmtPostProcessor : PostProcessor
    {
        public MgmtPostProcessor(ImmutableHashSet<string> modelsToKeep, string? modelFactoryFullName) : base(modelsToKeep, modelFactoryFullName) { }

        protected override bool IsRootDocument(Document document)
        {
            var root = document.GetSyntaxRootAsync().GetAwaiter().GetResult();
            // a document is root when
            // 1. the file is under `Generated` or `Generated/Extensions` which is handled by `IsMgmtRootDocument`
            // 2. the declaration has a ReferenceType or similar attribute on it which is handled by `IsReferenceType`
            // 3. the file is custom code (not generated and not shared) which is handled by `IsCustomDocument`
            return IsMgmtRootDocument(document) || IsReferenceType(root) || base.IsRootDocument(document);
        }

        private static bool IsMgmtRootDocument(Document document) => GeneratedCodeWorkspace.IsGeneratedDocument(document) && Path.GetDirectoryName(document.Name) is "Extensions" or "";

        private static HashSet<string> _referenceAttributes = new HashSet<string> { "ReferenceType", "PropertyReferenceType", "TypeReferenceType" };

        private static bool IsReferenceType(SyntaxNode? root)
        {
            if (root is null)
                return false;

            var childNodes = root.DescendantNodes();
            var typeNode = childNodes.OfType<TypeDeclarationSyntax>().FirstOrDefault();
            if (typeNode is null)
            {
                return false;
            }

            var attributeLists = GetAttributeLists(typeNode);
            if (attributeLists is null || attributeLists.Value.Count == 0)
                return false;

            foreach (var attributeList in attributeLists.Value)
            {
                if (_referenceAttributes.Contains(attributeList.Attributes[0].Name.ToString()))
                    return true;
            }

            return false;
        }

        private static SyntaxList<AttributeListSyntax>? GetAttributeLists(SyntaxNode node)
        {
            if (node is StructDeclarationSyntax structDeclaration)
                return structDeclaration.AttributeLists;

            if (node is ClassDeclarationSyntax classDeclaration)
                return classDeclaration.AttributeLists;

            return null;
        }
    }
}

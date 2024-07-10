// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Providers
{
    public class NamedTypeSymbolProvider : TypeProvider
    {
        private INamedTypeSymbol _namedTypeSymbol;

        public NamedTypeSymbolProvider(INamedTypeSymbol namedTypeSymbol)
        {
            _namedTypeSymbol = namedTypeSymbol;
        }

        public override string RelativeFilePath => throw new InvalidOperationException("This type should not be writting in generation");

        public override string Name => _namedTypeSymbol.Name;

        protected override string GetNamespace() => _namedTypeSymbol.ContainingNamespace.Name;

        protected override PropertyProvider[] BuildProperties()
        {
            List<PropertyProvider> properties = new List<PropertyProvider>();
            foreach (var propertySymbol in _namedTypeSymbol.GetMembers().OfType<IPropertySymbol>())
            {
                var propertyProvider = new PropertyProvider(
                    $"{GetPropertySummary(propertySymbol)}",
                    GetMethodSignatureModifiers(propertySymbol.DeclaredAccessibility),
                    GetCSharpType(propertySymbol.Type),
                    propertySymbol.Name,
                    new AutoPropertyBody(propertySymbol.SetMethod is not null));
                properties.Add(propertyProvider);
            }
            return [.. properties];
        }

        private static string? GetPropertySummary(IPropertySymbol propertySymbol)
        {
            var xmlDocumentation = propertySymbol.GetDocumentationCommentXml();
            if (!string.IsNullOrEmpty(xmlDocumentation))
            {
                var xDocument = XDocument.Parse(xmlDocumentation);
                var summaryElement = xDocument.Descendants("summary").FirstOrDefault();
                return summaryElement?.Value.Trim();
            }
            return null;
        }

        private static MethodSignatureModifiers GetMethodSignatureModifiers(Accessibility accessibility) => accessibility switch
        {
            Accessibility.Private => MethodSignatureModifiers.Private,
            Accessibility.Protected => MethodSignatureModifiers.Protected,
            Accessibility.Internal => MethodSignatureModifiers.Internal,
            Accessibility.Public => MethodSignatureModifiers.Public,
            _ => MethodSignatureModifiers.None
        };

        private static CSharpType GetCSharpType(ITypeSymbol typeSymbol)
        {
            var fullyQualifiedName = GetFullyQualifiedName(typeSymbol);
            var pieces = fullyQualifiedName.Split('.');

            //if fully qualified name is in the namespace of the library being emitted find it from the outputlibrary
            if (fullyQualifiedName.StartsWith(CodeModelPlugin.Instance.Configuration.RootNamespace, StringComparison.Ordinal))
            {
                return new CSharpType(
                    typeSymbol.Name,
                    string.Join('.', pieces.Take(pieces.Length - 1)),
                    typeSymbol.IsValueType,
                    typeSymbol.TypeKind == TypeKind.Enum,
                    typeSymbol.NullableAnnotation == NullableAnnotation.Annotated,
                    typeSymbol.ContainingType is not null ? GetCSharpType(typeSymbol.ContainingType) : null,
                    typeSymbol is INamedTypeSymbol namedTypeSymbol ? namedTypeSymbol.TypeArguments.Select(GetCSharpType).ToArray() : null,
                    typeSymbol.DeclaredAccessibility == Accessibility.Public,
                    typeSymbol.BaseType is not null ? GetCSharpType(typeSymbol.BaseType) : null);
            }

            var type = System.Type.GetType(fullyQualifiedName);
            if (type is null)
            {
                throw new InvalidOperationException($"Unable to convert ITypeSymbol: {fullyQualifiedName} to a CSharpType");
            }
            return type;
        }

        private static string GetFullyQualifiedName(ITypeSymbol typeSymbol)
        {
            // Handle special cases for built-in types
            switch (typeSymbol.SpecialType)
            {
                case SpecialType.System_Object:
                    return "System.Object";
                case SpecialType.System_Void:
                    return "System.Void";
                case SpecialType.System_Boolean:
                    return "System.Boolean";
                case SpecialType.System_Char:
                    return "System.Char";
                case SpecialType.System_SByte:
                    return "System.SByte";
                case SpecialType.System_Byte:
                    return "System.Byte";
                case SpecialType.System_Int16:
                    return "System.Int16";
                case SpecialType.System_UInt16:
                    return "System.UInt16";
                case SpecialType.System_Int32:
                    return "System.Int32";
                case SpecialType.System_UInt32:
                    return "System.UInt32";
                case SpecialType.System_Int64:
                    return "System.Int64";
                case SpecialType.System_UInt64:
                    return "System.UInt64";
                case SpecialType.System_Decimal:
                    return "System.Decimal";
                case SpecialType.System_Single:
                    return "System.Single";
                case SpecialType.System_Double:
                    return "System.Double";
                case SpecialType.System_String:
                    return "System.String";
                case SpecialType.System_DateTime:
                    return "System.DateTime";
            }

            // Handle array types
            if (typeSymbol is IArrayTypeSymbol arrayTypeSymbol)
            {
                var elementType = GetFullyQualifiedName(arrayTypeSymbol.ElementType);
                return elementType + "[]";
            }

            // Handle generic types
            if (typeSymbol is INamedTypeSymbol namedTypeSymbol && namedTypeSymbol.IsGenericType)
            {
                var genericArguments = string.Join(",", namedTypeSymbol.TypeArguments.Select(GetFullyQualifiedName));
                var typeName = namedTypeSymbol.ConstructedFrom.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat);
                return $"{typeName}[{genericArguments}]";
            }

            // Default to fully qualified name
            var fqns = typeSymbol.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat);
            return fqns.StartsWith("global::") ? fqns.Substring("global::".Length) : fqns;
        }
    }
}

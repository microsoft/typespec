// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp
{
    internal static class TypeSymbolExtensions
    {
        private const string GlobalPrefix = "global::";
        private const string NullableTypeName = "System.Nullable";

        public static bool IsSameType(this INamedTypeSymbol symbol, CSharpType type)
        {
            if (type.IsValueType && type.IsNullable)
            {
                if (symbol.ConstructedFrom.SpecialType != SpecialType.System_Nullable_T)
                    return false;
                return IsSameType((INamedTypeSymbol)symbol.TypeArguments.Single(), type.WithNullable(false));
            }

            if (symbol.ContainingNamespace.ToString() != type.Namespace || symbol.Name != type.Name || symbol.TypeArguments.Length != type.Arguments.Count)
            {
                return false;
            }

            for (int i = 0; i < type.Arguments.Count; ++i)
            {
                if (!IsSameType((INamedTypeSymbol)symbol.TypeArguments[i], type.Arguments[i]))
                {
                    return false;
                }
            }
            return true;
        }

        public static CSharpType GetCSharpType(this ITypeSymbol typeSymbol)
        {
            var fullyQualifiedName = GetFullyQualifiedName(typeSymbol);
            var namedTypeSymbol = typeSymbol as INamedTypeSymbol;

            Type? type = LoadFrameworkType(fullyQualifiedName);

            if (type is null)
            {
                return ConstructCSharpTypeFromSymbol(typeSymbol, fullyQualifiedName, namedTypeSymbol);
            }

            CSharpType result = new CSharpType(type);
            if (namedTypeSymbol is not null && namedTypeSymbol.IsGenericType && !result.IsNullable)
            {
                return result.MakeGenericType([.. namedTypeSymbol.TypeArguments.Select(GetCSharpType)]);
            }

            return result;
        }

        public static string GetFullyQualifiedName(this ITypeSymbol typeSymbol)
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
                return GetFullyQualifiedName(arrayTypeSymbol.ElementType) + "[]";
            }

            // Handle generic types
            if (typeSymbol is INamedTypeSymbol namedTypeSymbol && namedTypeSymbol.IsGenericType)
            {
                // Handle nullable types
                if (typeSymbol.NullableAnnotation == NullableAnnotation.Annotated && !IsCollectionType(namedTypeSymbol))
                {
                    var argTypeSymbol = namedTypeSymbol.TypeArguments.FirstOrDefault();

                    if (argTypeSymbol != null)
                    {
                        // If the argument type is an error type, then fall back to using the ToString of the arg type symbol. This means that the
                        // arg may not be fully qualified, but it is better than not having any type information at all.
                        if (argTypeSymbol.TypeKind == TypeKind.Error)
                        {
                            return $"{NullableTypeName}`1[{argTypeSymbol}]";
                        }

                        string[] typeArguments = [.. namedTypeSymbol.TypeArguments.Select(arg => "[" + GetFullyQualifiedName(arg) + "]")];
                        return $"{NullableTypeName}`{namedTypeSymbol.TypeArguments.Length}[{string.Join(", ", typeArguments)}]";
                    }
                }
                else if (namedTypeSymbol.TypeArguments.Length > 0 && !IsCollectionType(namedTypeSymbol))
                {
                    return GetNonNullableGenericTypeName(namedTypeSymbol);
                }

                var typeNameSpan = namedTypeSymbol.ConstructedFrom.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat).AsSpan();
                var start = typeNameSpan.IndexOf(':') + 2;
                var end = typeNameSpan.IndexOf('<');
                typeNameSpan = typeNameSpan.Slice(start, end - start);
                return $"{typeNameSpan}`{namedTypeSymbol.TypeArguments.Length}";
            }

            // Default to fully qualified name
            return GetFullyQualifiedNameFromDisplayString(typeSymbol);
        }

        public static string GetFullyQualifiedNameFromDisplayString(this ISymbol typeSymbol)
        {
            var fullyQualifiedName = typeSymbol.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat);
            return fullyQualifiedName.StartsWith(GlobalPrefix, StringComparison.Ordinal) ? fullyQualifiedName.Substring(GlobalPrefix.Length) : fullyQualifiedName;
        }

        private static Type? LoadFrameworkType(string fullyQualifiedName)
        {
            return fullyQualifiedName switch
            {
                // Special case for types that would not be defined in corlib, but should still be considered framework types.
                "System.BinaryData" => typeof(BinaryData),
                "System.Uri" => typeof(Uri),
                _ => Type.GetType(fullyQualifiedName)
            };
        }

        private static CSharpType ConstructCSharpTypeFromSymbol(
            ITypeSymbol typeSymbol,
            string fullyQualifiedName,
            INamedTypeSymbol? namedTypeSymbol)
        {
            var typeArg = namedTypeSymbol?.TypeArguments.FirstOrDefault();
            bool isValueType = typeSymbol.IsValueType;
            bool isNullable = fullyQualifiedName.StartsWith(NullableTypeName);
            bool isEnum = typeSymbol.TypeKind == TypeKind.Enum || (isNullable && typeArg?.TypeKind == TypeKind.Enum);
            bool isNullableUnknownType = isNullable && typeArg?.TypeKind == TypeKind.Error;
            string name = isNullableUnknownType ? fullyQualifiedName : typeSymbol.Name;
            string[] pieces = fullyQualifiedName.Split('.');
            List<CSharpType> arguments = [];
            INamedTypeSymbol? namedTypeArg = typeArg as INamedTypeSymbol;
            INamedTypeSymbol? enumUnderlyingType = !isNullable ? namedTypeSymbol?.EnumUnderlyingType : namedTypeArg?.EnumUnderlyingType;

            // For nullable types, we need to get the type arguments from the underlying type.
            if (namedTypeSymbol?.IsGenericType == true &&
                (!isNullable || (namedTypeArg?.IsGenericType == true)))
            {
                arguments.AddRange(namedTypeSymbol.TypeArguments.Select(GetCSharpType));
            }

            // handle nullables
            if (isNullable && typeArg != null)
            {
                // System.Nullable`1[T] -> T
                name = typeArg.Name;
                pieces = GetFullyQualifiedName(typeArg).Split('.');
            }

            return new CSharpType(
                name,
                string.Join('.', pieces.Take(pieces.Length - 1)),
                isValueType,
                isNullable,
                typeSymbol.ContainingType is not null ? GetCSharpType(typeSymbol.ContainingType) : null,
                arguments,
                typeSymbol.DeclaredAccessibility == Accessibility.Public,
                isValueType && !isEnum,
                baseType: typeSymbol.BaseType is not null && typeSymbol.BaseType.TypeKind != TypeKind.Error && !isNullableUnknownType
                    ? GetCSharpType(typeSymbol.BaseType)
                    : null,
                underlyingEnumType: enumUnderlyingType != null
                    ? GetCSharpType(enumUnderlyingType).FrameworkType
                    : null);
        }

        private static bool IsCollectionType(INamedTypeSymbol typeSymbol)
        {
            // Check if the type implements IEnumerable<T>, ICollection<T>, or IEnumerable
            return typeSymbol.AllInterfaces.Any(i =>
                i.OriginalDefinition.SpecialType == SpecialType.System_Collections_Generic_IEnumerable_T ||
                i.OriginalDefinition.SpecialType == SpecialType.System_Collections_Generic_ICollection_T ||
                i.OriginalDefinition.SpecialType == SpecialType.System_Collections_IEnumerable);
        }

        private static string GetNonNullableGenericTypeName(INamedTypeSymbol namedTypeSymbol)
        {
            string[] typeArguments = [.. namedTypeSymbol.TypeArguments.Select(GetFullyQualifiedName)];
            var fullName = namedTypeSymbol.ConstructedFrom.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat);

            // Remove the type arguments from the fully qualified name
            var typeArgumentStartIndex = fullName.IndexOf('<');
            var genericTypeName = typeArgumentStartIndex >= 0 ? fullName.Substring(0, typeArgumentStartIndex) : fullName;

            // Remove global:: prefix
            if (genericTypeName.StartsWith(GlobalPrefix, StringComparison.Ordinal))
            {
                genericTypeName = genericTypeName.Substring(GlobalPrefix.Length);
            }

            return $"{genericTypeName}`{namedTypeSymbol.TypeArguments.Length}[{string.Join(", ", typeArguments)}]";
        }
    }
}

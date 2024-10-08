// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using System.Xml.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    public sealed class NamedTypeSymbolProvider : TypeProvider
    {
        private const string GlobalPrefix = "global::";
        private INamedTypeSymbol _namedTypeSymbol;

        public NamedTypeSymbolProvider(INamedTypeSymbol namedTypeSymbol)
        {
            _namedTypeSymbol = namedTypeSymbol;
        }

        private protected sealed override NamedTypeSymbolProvider? GetCustomCodeView() => null;

        protected override string BuildRelativeFilePath() => throw new InvalidOperationException("This type should not be writing in generation");

        protected override string BuildName() => _namedTypeSymbol.Name;

        protected override string GetNamespace() => GetFullyQualifiedNameFromDisplayString(_namedTypeSymbol.ContainingNamespace);

        public IEnumerable<AttributeData> GetAttributes() => _namedTypeSymbol.GetAttributes();

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            var declaredModifiers = GetAccessModifiers(_namedTypeSymbol.DeclaredAccessibility);
            if (_namedTypeSymbol.IsReadOnly)
            {
                declaredModifiers |= TypeSignatureModifiers.ReadOnly;
            }
            if (_namedTypeSymbol.IsStatic)
            {
                declaredModifiers |= TypeSignatureModifiers.Static;
            }
            switch (_namedTypeSymbol.TypeKind)
            {
                case TypeKind.Class:
                    declaredModifiers |= TypeSignatureModifiers.Class;
                    if (_namedTypeSymbol.IsSealed)
                    {
                        declaredModifiers |= TypeSignatureModifiers.Sealed;
                    }
                    break;
                case TypeKind.Enum:
                    declaredModifiers |= TypeSignatureModifiers.Enum;
                    break;
                case TypeKind.Struct:
                    declaredModifiers |= TypeSignatureModifiers.Struct;
                    break;
                case TypeKind.Interface:
                    declaredModifiers |= TypeSignatureModifiers.Interface;
                    break;
            }
            return declaredModifiers;

            static TypeSignatureModifiers GetAccessModifiers(Accessibility accessibility) => accessibility switch
            {
                Accessibility.Private => TypeSignatureModifiers.Private,
                Accessibility.Protected => TypeSignatureModifiers.Protected,
                Accessibility.Internal => TypeSignatureModifiers.Internal,
                Accessibility.Public => TypeSignatureModifiers.Public,
                Accessibility.ProtectedOrInternal => TypeSignatureModifiers.Protected | TypeSignatureModifiers.Internal,
                _ => TypeSignatureModifiers.None
            };
        }

        protected override FieldProvider[] BuildFields()
        {
            List<FieldProvider> fields = new List<FieldProvider>();
            foreach (var fieldSymbol in _namedTypeSymbol.GetMembers().OfType<IFieldSymbol>())
            {
                if (!fieldSymbol.Name.EndsWith("k__BackingField"))
                {
                    var modifiers = GetFieldsAccessModifier(fieldSymbol.DeclaredAccessibility);
                    if (fieldSymbol.IsStatic)
                    {
                        modifiers |= FieldModifiers.Static;
                    }

                    var fieldProvider = new FieldProvider(
                        modifiers,
                        GetCSharpType(fieldSymbol.Type),
                        fieldSymbol.Name,
                        this,
                        GetSymbolXmlDoc(fieldSymbol, "summary"))
                    {
                        Attributes = fieldSymbol.GetAttributes()
                    };

                    fields.Add(fieldProvider);
                }
            }
            return [.. fields];
        }

        protected override PropertyProvider[] BuildProperties()
        {
            List<PropertyProvider> properties = new List<PropertyProvider>();
            foreach (var propertySymbol in _namedTypeSymbol.GetMembers().OfType<IPropertySymbol>())
            {
                var propertyProvider = new PropertyProvider(
                    GetSymbolXmlDoc(propertySymbol, "summary"),
                    GetAccessModifier(propertySymbol.DeclaredAccessibility),
                    GetCSharpType(propertySymbol.Type),
                    propertySymbol.Name,
                    new AutoPropertyBody(propertySymbol.SetMethod is not null),
                    this)
                {
                    Attributes = propertySymbol.GetAttributes()
                };
                properties.Add(propertyProvider);
            }
            return [.. properties];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            List<ConstructorProvider> constructors = new List<ConstructorProvider>();
            foreach (var constructorSymbol in _namedTypeSymbol.Constructors)
            {
                if (constructorSymbol.IsImplicitlyDeclared)
                    continue;

                var signature = new ConstructorSignature(
                    Type,
                    GetSymbolXmlDoc(constructorSymbol, "summary"),
                    GetAccessModifier(constructorSymbol.DeclaredAccessibility),
                    [.. constructorSymbol.Parameters.Select(p => ConvertToParameterProvider(constructorSymbol, p))]);
                constructors.Add(new ConstructorProvider(signature, MethodBodyStatement.Empty, this));
            }
            return [.. constructors];
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();
            foreach (var methodSymbol in _namedTypeSymbol.GetMembers().OfType<IMethodSymbol>())
            {
                // skip property accessors
                if (methodSymbol.AssociatedSymbol is IPropertySymbol)
                    continue;

                // skip constructors
                if (methodSymbol.MethodKind == MethodKind.Constructor)
                    continue;

                var modifiers = GetAccessModifier(methodSymbol.DeclaredAccessibility);
                AddAdditionalModifiers(methodSymbol, ref modifiers);
                var signature = new MethodSignature(
                    methodSymbol.Name,
                    GetSymbolXmlDoc(methodSymbol, "summary"),
                    modifiers,
                    GetNullableCSharpType(methodSymbol.ReturnType),
                    GetSymbolXmlDoc(methodSymbol, "returns"),
                    [.. methodSymbol.Parameters.Select(p => ConvertToParameterProvider(methodSymbol, p))]);

                methods.Add(new MethodProvider(signature, MethodBodyStatement.Empty, this));
            }
            return [.. methods];
        }

        protected override bool GetIsEnum() => _namedTypeSymbol.TypeKind == TypeKind.Enum;

        protected override CSharpType BuildEnumUnderlyingType() => GetIsEnum() ? new CSharpType(typeof(int)) : throw new InvalidOperationException("This type is not an enum");

        private ParameterProvider ConvertToParameterProvider(IMethodSymbol methodSymbol, IParameterSymbol parameterSymbol)
        {
            return new ParameterProvider(
                parameterSymbol.Name,
                FormattableStringHelpers.FromString(GetParameterXmlDocumentation(methodSymbol, parameterSymbol)) ?? FormattableStringHelpers.Empty,
                GetCSharpType(parameterSymbol.Type));
        }

        private void AddAdditionalModifiers(IMethodSymbol methodSymbol, ref MethodSignatureModifiers modifiers)
        {
            if (methodSymbol.IsVirtual)
            {
                modifiers |= MethodSignatureModifiers.Virtual;
            }
            if (methodSymbol.IsOverride)
            {
                modifiers |= MethodSignatureModifiers.Override;
            }
        }

        private static FormattableString? GetSymbolXmlDoc(ISymbol propertySymbol, string tag)
        {
            var xmlDocumentation = propertySymbol.GetDocumentationCommentXml();
            if (!string.IsNullOrEmpty(xmlDocumentation))
            {
                XDocument xDocument = ParseXml(propertySymbol, xmlDocumentation);
                var summaryElement = xDocument.Descendants(tag).FirstOrDefault();
                return FormattableStringHelpers.FromString(summaryElement?.Value.Trim());
            }
            return null;
        }

        private static XDocument ParseXml(ISymbol docsSymbol, string xmlDocumentation)
        {
            XDocument xDocument;
            try
            {
                xDocument = XDocument.Parse(xmlDocumentation);
            }
            catch (XmlException ex)
            {
                var files = new List<string>();
                foreach (var reference in docsSymbol.DeclaringSyntaxReferences)
                {
                    files.Add(reference.SyntaxTree.FilePath);
                }

                throw new InvalidOperationException($"Failed to parse XML documentation for {docsSymbol.Name}. " +
                                                    $"The malformed XML documentation is located in one or more of the following files: {string.Join(',', files)}", ex);
            }

            return xDocument;
        }

        private static string? GetParameterXmlDocumentation(IMethodSymbol methodSymbol, IParameterSymbol parameterSymbol)
        {
            var xmlDocumentation = methodSymbol.GetDocumentationCommentXml();

            if (string.IsNullOrWhiteSpace(xmlDocumentation))
            {
                return null;
            }

            var xmlDoc = ParseXml(methodSymbol, xmlDocumentation);
            var paramElement = xmlDoc.Descendants("param")
                                     .FirstOrDefault(e => e.Attribute("name")?.Value == parameterSymbol.Name);

            return paramElement?.Value.Trim();
        }

        private static MethodSignatureModifiers GetAccessModifier(Accessibility accessibility) => accessibility switch
        {
            Accessibility.Private => MethodSignatureModifiers.Private,
            Accessibility.Protected => MethodSignatureModifiers.Protected,
            Accessibility.Internal => MethodSignatureModifiers.Internal,
            Accessibility.Public => MethodSignatureModifiers.Public,
            _ => MethodSignatureModifiers.None
        };

        private static FieldModifiers GetFieldsAccessModifier(Accessibility accessibility) => accessibility switch
        {
            Accessibility.Private => FieldModifiers.Private,
            Accessibility.Protected => FieldModifiers.Protected,
            Accessibility.Internal => FieldModifiers.Internal,
            Accessibility.Public => FieldModifiers.Public,
            _ => FieldModifiers.Public
        };

        private CSharpType? GetNullableCSharpType(ITypeSymbol typeSymbol)
        {
            var fullyQualifiedName = GetFullyQualifiedName(typeSymbol);
            if (fullyQualifiedName == "System.Void")
            {
                return null;
            }
            return GetCSharpType(typeSymbol);
        }

        private CSharpType GetCSharpType(ITypeSymbol typeSymbol)
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

        private static Type? LoadFrameworkType(string fullyQualifiedName)
        {
            return fullyQualifiedName switch
            {
                // Special case for types that would not be defined in corlib, but should still be considered framework types.
                "System.BinaryData" => typeof(BinaryData),
                _ => System.Type.GetType(fullyQualifiedName)
            };
        }

        private CSharpType ConstructCSharpTypeFromSymbol(
            ITypeSymbol typeSymbol,
            string fullyQualifiedName,
            INamedTypeSymbol? namedTypeSymbol)
        {
            var typeArg = namedTypeSymbol?.TypeArguments.FirstOrDefault();
            bool isValueType = typeSymbol.IsValueType;
            bool isEnum = typeSymbol.TypeKind == TypeKind.Enum;
            bool isNullable = typeSymbol.NullableAnnotation == NullableAnnotation.Annotated;
            bool isNullableUnknownType = isNullable && typeArg?.TypeKind == TypeKind.Error;
            string name = isNullableUnknownType ? fullyQualifiedName : typeSymbol.Name;
            string[] pieces = fullyQualifiedName.Split('.');

            // handle nullables
            if (isNullable)
            {
                // System.Nullable`1[T] -> T
                name = typeArg != null ? GetFullyQualifiedName(typeArg) : fullyQualifiedName;
                pieces = name.Split('.');
            }

            return new CSharpType(
                name,
                string.Join('.', pieces.Take(pieces.Length - 1)),
                isValueType,
                isNullable,
                typeSymbol.ContainingType is not null ? GetCSharpType(typeSymbol.ContainingType) : null,
                namedTypeSymbol is not null && !isNullableUnknownType ? [.. namedTypeSymbol.TypeArguments.Select(GetCSharpType)] : [],
                typeSymbol.DeclaredAccessibility == Accessibility.Public,
                isValueType && !isEnum,
                baseType: typeSymbol.BaseType is not null && typeSymbol.BaseType.TypeKind != TypeKind.Error && !isNullableUnknownType
                    ? GetCSharpType(typeSymbol.BaseType)
                    : null,
                underlyingEnumType: namedTypeSymbol is not null && namedTypeSymbol.EnumUnderlyingType is not null
                    ? GetCSharpType(namedTypeSymbol.EnumUnderlyingType).FrameworkType
                    : null);
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
                return GetFullyQualifiedName(arrayTypeSymbol.ElementType) + "[]";
            }

            // Handle generic types
            if (typeSymbol is INamedTypeSymbol namedTypeSymbol && namedTypeSymbol.IsGenericType)
            {
                // Handle nullable types
                if (typeSymbol.NullableAnnotation == NullableAnnotation.Annotated && !IsCollectionType(namedTypeSymbol))
                {
                    const string nullableTypeName = "System.Nullable";
                    var argTypeSymbol = namedTypeSymbol.TypeArguments.FirstOrDefault();

                    if (argTypeSymbol != null)
                    {
                        if (argTypeSymbol.TypeKind == TypeKind.Error)
                        {
                            return GetFullyQualifiedName(argTypeSymbol);
                        }

                        string[] typeArguments = [.. namedTypeSymbol.TypeArguments.Select(arg => "[" + GetFullyQualifiedName(arg) + "]")];
                        return $"{nullableTypeName}`{namedTypeSymbol.TypeArguments.Length}[{string.Join(", ", typeArguments)}]";
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

        private static bool IsCollectionType(INamedTypeSymbol typeSymbol)
        {
            // Check if the type implements IEnumerable<T>, ICollection<T>, or IEnumerable
            return typeSymbol.AllInterfaces.Any(i =>
                i.OriginalDefinition.SpecialType == SpecialType.System_Collections_Generic_IEnumerable_T ||
                i.OriginalDefinition.SpecialType == SpecialType.System_Collections_Generic_ICollection_T ||
                i.OriginalDefinition.SpecialType == SpecialType.System_Collections_IEnumerable);
        }

        private static string GetFullyQualifiedNameFromDisplayString(ISymbol typeSymbol)
        {
            var fullyQualifiedName = typeSymbol.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat);
            return fullyQualifiedName.StartsWith(GlobalPrefix, StringComparison.Ordinal) ? fullyQualifiedName.Substring(GlobalPrefix.Length) : fullyQualifiedName;
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using System.Xml.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.SourceInput;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    public sealed class NamedTypeSymbolProvider : TypeProvider
    {
        private INamedTypeSymbol _namedTypeSymbol;

        public NamedTypeSymbolProvider(INamedTypeSymbol namedTypeSymbol)
        {
            _namedTypeSymbol = namedTypeSymbol;
        }

        private protected sealed override NamedTypeSymbolProvider? GetCustomCodeView() => null;

        protected override string BuildRelativeFilePath() => throw new InvalidOperationException("This type should not be writing in generation");

        protected override string BuildName() => _namedTypeSymbol.Name;

        protected override string GetNamespace() => _namedTypeSymbol.ContainingNamespace.GetFullyQualifiedNameFromDisplayString();

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
                        fieldSymbol.Type.GetCSharpType(),
                        fieldSymbol.Name,
                        this,
                        GetSymbolXmlDoc(fieldSymbol, "summary"))
                    {
                        OriginalName = GetOriginalName(fieldSymbol)
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
                    propertySymbol.Type.GetCSharpType(),
                    propertySymbol.Name,
                    new AutoPropertyBody(propertySymbol.SetMethod is not null),
                    this)
                {
                    OriginalName = GetOriginalName(propertySymbol)
                };
                properties.Add(propertyProvider);
            }
            return [.. properties];
        }

        private static string? GetOriginalName(ISymbol symbol)
        {
            var codeGenAttribute = symbol.GetAttributes().SingleOrDefault(
                a => a.AttributeClass?.Name == CodeGenAttributes.CodeGenMemberAttributeName);
            string? originalName = null;
            if (codeGenAttribute != null)
            {
                CodeGenAttributes.TryGetCodeGenMemberAttributeValue(codeGenAttribute, out originalName);
            }

            return originalName;
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
                parameterSymbol.Type.GetCSharpType());
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
            var fullyQualifiedName = typeSymbol.GetFullyQualifiedName();
            if (fullyQualifiedName == "System.Void")
            {
                return null;
            }
            return typeSymbol.GetCSharpType();
        }
    }
}

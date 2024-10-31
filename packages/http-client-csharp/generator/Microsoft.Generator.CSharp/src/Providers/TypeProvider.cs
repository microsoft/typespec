// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.SourceInput;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    public abstract class TypeProvider
    {
        private Lazy<NamedTypeSymbolProvider?> _customCodeView;
        private Lazy<CanonicalTypeProvider> _canonicalView;
        private readonly InputType? _inputType;

        protected TypeProvider(InputType? inputType = default)
        {
            _customCodeView = new(GetCustomCodeView);
            _canonicalView = new(GetCanonicalView);
            _inputType = inputType;
        }

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected TypeProvider() : this(null)
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        private protected virtual NamedTypeSymbolProvider? GetCustomCodeView()
            => CodeModelPlugin.Instance.SourceInputModel.FindForType(GetNamespace(), BuildName());

        public NamedTypeSymbolProvider? CustomCodeView => _customCodeView.Value;

        private IReadOnlyList<PropertyProvider> GetAllCustomProperties()
        {
            var allCustomProperties = CustomCodeView?.Properties != null
                ? new List<PropertyProvider>(CustomCodeView.Properties)
                : [];
            var baseTypeCustomCodeView = BaseTypeProvider?.CustomCodeView;

            // add all custom properties from base types
            while (baseTypeCustomCodeView != null)
            {
                allCustomProperties.AddRange(baseTypeCustomCodeView.Properties);
                baseTypeCustomCodeView = baseTypeCustomCodeView.BaseTypeProvider?.CustomCodeView;
            }

            return allCustomProperties;
        }

        private IReadOnlyList<FieldProvider> GetAllCustomFields()
        {
            var allCustomFields = CustomCodeView?.Fields != null
                ? new List<FieldProvider>(CustomCodeView.Fields)
                : [];
            var baseTypeCustomCodeView = BaseTypeProvider?.CustomCodeView;

            // add all custom fields from base types
            while (baseTypeCustomCodeView != null)
            {
                allCustomFields.AddRange(baseTypeCustomCodeView.Fields);
                baseTypeCustomCodeView = baseTypeCustomCodeView.BaseTypeProvider?.CustomCodeView;
            }

            return allCustomFields;
        }

        private protected virtual CanonicalTypeProvider GetCanonicalView() => new CanonicalTypeProvider(this, _inputType);
        public TypeProvider CanonicalView => _canonicalView.Value;

        protected string? _deprecated;

        /// <summary>
        /// Gets the relative file path where the generated file will be stored.
        /// This path is relative to the project's root directory.
        /// </summary>
        internal string RelativeFilePath => _relativeFilePath ??= BuildRelativeFilePath();

        private string? _relativeFilePath;

        public string Name => _name ??= CustomCodeView?.Name ?? BuildName();

        private string? _name;

        public string Namespace => _namespace ??= GetNamespace();
        private string? _namespace;

        protected virtual FormattableString Description { get; } = FormattableStringHelpers.Empty;

        private XmlDocProvider? _xmlDocs;

        public XmlDocProvider XmlDocs
        {
            get => _xmlDocs ??= BuildXmlDocs();
            private set => _xmlDocs = value;
        }

        public string? Deprecated
        {
            get => _deprecated;
            private set => _deprecated = value;
        }

        private CSharpType? _type;
        public CSharpType Type => _type ??= new(
            this,
            CustomCodeView?.GetNamespace() ?? GetNamespace(),
            GetTypeArguments(),
            GetBaseType());

        protected virtual bool GetIsEnum() => false;
        public bool IsEnum => GetIsEnum();

        protected virtual string GetNamespace() => CodeModelPlugin.Instance.Configuration.RootNamespace;

        private TypeSignatureModifiers? _declarationModifiers;

        public TypeSignatureModifiers DeclarationModifiers
        {
            get => _declarationModifiers ??= GetDeclarationModifiersInternal();
            private set => _declarationModifiers = value;
        }

        protected virtual TypeSignatureModifiers GetDeclarationModifiers() => TypeSignatureModifiers.None;

        private TypeSignatureModifiers GetDeclarationModifiersInternal()
        {
            var modifiers = GetDeclarationModifiers();
            var customModifiers = CustomCodeView?.DeclarationModifiers ?? TypeSignatureModifiers.None;
            if (customModifiers != TypeSignatureModifiers.None)
            {
                modifiers |= customModifiers;
            }
            // we default to public when no accessibility modifier is provided
            if (!modifiers.HasFlag(TypeSignatureModifiers.Internal) && !modifiers.HasFlag(TypeSignatureModifiers.Public) && !modifiers.HasFlag(TypeSignatureModifiers.Private))
            {
                modifiers |= TypeSignatureModifiers.Public;
            }

            // we should have exactly have one class, struct, enum or interface
            var mask = modifiers & (TypeSignatureModifiers.Class | TypeSignatureModifiers.Struct | TypeSignatureModifiers.Enum | TypeSignatureModifiers.Interface);
            // check if we have none
            if (mask == 0)
            {
                modifiers |= TypeSignatureModifiers.Class;
            }
            // check if we have multiple
            // mask & (mask - 1) gives us 0 if mask is a power of 2, it means we have exactly one flag of above when the mask is a power of 2
            if ((mask & (mask - 1)) != 0)
            {
                throw new InvalidOperationException($"Invalid modifier {modifiers} on TypeProvider {Name}");
            }

            // we always add partial when possible
            if (!modifiers.HasFlag(TypeSignatureModifiers.Enum) && DeclaringTypeProvider is null)
            {
                modifiers |= TypeSignatureModifiers.Partial;
            }

            return modifiers;
        }

        internal virtual TypeProvider? BaseTypeProvider => null;

        protected virtual CSharpType? GetBaseType() => null;

        public virtual WhereExpression? WhereClause { get; protected init; }

        public virtual TypeProvider? DeclaringTypeProvider { get; protected init; }

        private IReadOnlyList<CSharpType>? _implements;

        public IReadOnlyList<CSharpType> Implements => _implements ??= BuildImplements();

        private IReadOnlyList<PropertyProvider>? _properties;

        public IReadOnlyList<PropertyProvider> Properties => _properties ??= FilterCustomizedProperties(BuildProperties());

        private IReadOnlyList<MethodProvider>? _methods;
        public IReadOnlyList<MethodProvider> Methods => _methods ??= BuildMethodsInternal();

        private IReadOnlyList<ConstructorProvider>? _constructors;

        public IReadOnlyList<ConstructorProvider> Constructors => _constructors ??= BuildConstructorsInternal();

        private IReadOnlyList<FieldProvider>? _fields;
        public IReadOnlyList<FieldProvider> Fields => _fields ??= FilterCustomizedFields(BuildFields());

        private IReadOnlyList<TypeProvider>? _nestedTypes;
        public IReadOnlyList<TypeProvider> NestedTypes => _nestedTypes ??= BuildNestedTypes();

        private IReadOnlyList<TypeProvider>? _serializationProviders;

        public virtual IReadOnlyList<TypeProvider> SerializationProviders => _serializationProviders ??= BuildSerializationProviders();

        private IReadOnlyList<AttributeStatement>? _attributes;
        public IReadOnlyList<AttributeStatement> Attributes => _attributes ??= BuildAttributes();

        protected virtual CSharpType[] GetTypeArguments() => [];

        private protected virtual PropertyProvider[] FilterCustomizedProperties(PropertyProvider[] specProperties)
        {
            var properties = new List<PropertyProvider>();
            var customProperties = new HashSet<string>();

            foreach (var customProperty in GetAllCustomProperties())
            {
                customProperties.Add(customProperty.Name);
                if (customProperty.OriginalName != null)
                {
                    customProperties.Add(customProperty.OriginalName);
                }
            }

            foreach (var customField in GetAllCustomFields())
            {
                customProperties.Add(customField.Name);
                if (customField.OriginalName != null)
                {
                    customProperties.Add(customField.OriginalName);
                }
            }

            foreach (var property in specProperties)
            {
                if (ShouldGenerate(property, customProperties))
                {
                    properties.Add(property);
                }
            }

            return [..properties];
        }

        private protected virtual FieldProvider[] FilterCustomizedFields(FieldProvider[] specFields)
        {
            var fields = new List<FieldProvider>();
            var customFields = new HashSet<string>();

            foreach (var customField in GetAllCustomFields())
            {
                customFields.Add(customField.Name);
                if (customField.OriginalName != null)
                {
                    customFields.Add(customField.OriginalName);
                }
            }

            foreach (var field in specFields)
            {
                if (ShouldGenerate(field, customFields))
                {
                    fields.Add(field);
                }
            }

            return [.. fields];
        }

        private MethodProvider[] BuildMethodsInternal()
        {
            var methods = new List<MethodProvider>();
            foreach (var method in BuildMethods())
            {
                if (ShouldGenerate(method))
                {
                    methods.Add(method);
                }
            }

            return [..methods];
        }

        private ConstructorProvider[] BuildConstructorsInternal()
        {
            var constructors = new List<ConstructorProvider>();
            foreach (var constructor in BuildConstructors())
            {
                if (ShouldGenerate(constructor))
                {
                    constructors.Add(constructor);
                }
            }

            return constructors.ToArray();
        }

        protected virtual PropertyProvider[] BuildProperties() => [];

        protected virtual FieldProvider[] BuildFields() => [];

        protected virtual CSharpType[] BuildImplements() => [];

        protected virtual MethodProvider[] BuildMethods() => [];

        protected virtual ConstructorProvider[] BuildConstructors() => [];

        protected virtual TypeProvider[] BuildNestedTypes() => [];

        protected virtual TypeProvider[] BuildSerializationProviders() => [];

        protected virtual CSharpType BuildEnumUnderlyingType() => throw new InvalidOperationException("Not an EnumProvider type");

        protected virtual IReadOnlyList<AttributeStatement> BuildAttributes() => [];

        private CSharpType? _enumUnderlyingType;

        public CSharpType EnumUnderlyingType => _enumUnderlyingType ??= BuildEnumUnderlyingType(); // Each member in the EnumProvider has to have this type

        protected virtual XmlDocProvider BuildXmlDocs()
        {
            var docs = new XmlDocProvider();
            docs.Summary = new XmlDocSummaryStatement([Description]);
            return docs;
        }

        protected abstract string BuildRelativeFilePath();
        protected abstract string BuildName();

        public void Update(
            IEnumerable<MethodProvider>? methods = null,
            IEnumerable<ConstructorProvider>? constructors = null,
            IEnumerable<PropertyProvider>? properties = null,
            IEnumerable<FieldProvider>? fields = null,
            IEnumerable<TypeProvider>? serializations = null,
            IEnumerable<TypeProvider>? nestedTypes = null,
            XmlDocProvider? xmlDocs = null)
        {
            if (methods != null)
            {
                _methods = (methods as IReadOnlyList<MethodProvider>) ?? methods.ToList();
            }
            if (properties != null)
            {
                _properties = (properties as IReadOnlyList<PropertyProvider>) ?? properties.ToList();
            }
            if (fields != null)
            {
                _fields = (fields as IReadOnlyList<FieldProvider>) ?? fields.ToList();
            }
            if (constructors != null)
            {
                _constructors = (constructors as IReadOnlyList<ConstructorProvider>) ?? constructors.ToList();
            }
            if (serializations != null)
            {
                _serializationProviders = (serializations as IReadOnlyList<TypeProvider>) ?? serializations.ToList();
            }
            if (nestedTypes != null)
            {
                _nestedTypes = (nestedTypes as IReadOnlyList<TypeProvider>) ?? nestedTypes.ToList();
            }
            if (xmlDocs != null)
            {
                XmlDocs = xmlDocs;
            }
        }
        public IReadOnlyList<EnumTypeMember> EnumValues => _enumValues ??= BuildEnumValues();

        protected virtual IReadOnlyList<EnumTypeMember> BuildEnumValues() => throw new InvalidOperationException("Not an EnumProvider type");

        internal void EnsureBuilt()
        {
            _ = Methods;
            _ = Constructors;
            _ = Properties;
            _ = Fields;
            _ = Implements;
            if (IsEnum)
            {
                _ = EnumValues;
                _ = EnumUnderlyingType;
            }
            foreach (var type in SerializationProviders)
            {
                type.EnsureBuilt();
            }
            foreach (var type in NestedTypes)
            {
                type.EnsureBuilt();
            }
        }

        private IReadOnlyList<EnumTypeMember>? _enumValues;

        private bool ShouldGenerate(ConstructorProvider constructor)
        {
            foreach (var attribute in GetMemberSuppressionAttributes())
            {
                if (IsMatch(constructor.EnclosingType, constructor.Signature, attribute))
                {
                    return false;
                }
            }

            var customConstructors = constructor.EnclosingType.CustomCodeView?.Constructors ?? [];
            foreach (var customConstructor in customConstructors)
            {
                if (IsMatch(customConstructor.Signature, constructor.Signature))
                {
                    return false;
                }
            }

            return true;
        }

        private bool ShouldGenerate(MethodProvider method)
        {
            foreach (var attribute in GetMemberSuppressionAttributes())
            {
                if (IsMatch(method.EnclosingType, method.Signature, attribute))
                {
                    return false;
                }
            }

            var customMethods = method.EnclosingType.CustomCodeView?.Methods ?? [];
            foreach (var customMethod in customMethods)
            {
                if (IsMatch(customMethod.Signature, method.Signature))
                {
                    return false;
                }
            }

            return true;
        }

        private bool ShouldGenerate(PropertyProvider property, HashSet<string> customProperties)
        {
            foreach (var attribute in GetMemberSuppressionAttributes())
            {
                if (IsMatch(property, attribute))
                {
                    return false;
                }
            }

            return !customProperties.Contains(property.Name);
        }

        private bool ShouldGenerate(FieldProvider field, HashSet<string> customFields)
        {
            foreach (var attribute in GetMemberSuppressionAttributes())
            {
                if (IsMatch(field, attribute))
                {
                    return false;
                }
            }

            return !customFields.Contains(field.Name);
        }

        private static bool IsMatch(PropertyProvider propertyProvider, AttributeData attribute)
        {
            ValidateArguments(propertyProvider.EnclosingType, attribute);
            var name = attribute.ConstructorArguments[0].Value as string;
            return name == propertyProvider.Name;
        }

        private static bool IsMatch(FieldProvider fieldProvider, AttributeData attribute)
        {
            ValidateArguments(fieldProvider.EnclosingType, attribute);
            var name = attribute.ConstructorArguments[0].Value as string;
            return name == fieldProvider.Name;
        }

        private static bool IsMatch(TypeProvider enclosingType, MethodSignatureBase signature, AttributeData attribute)
        {
            ValidateArguments(enclosingType, attribute);
            var name = attribute.ConstructorArguments[0].Value as string;
            if (name != signature.Name)
            {
                return false;
            }

            ISymbol?[]? parameterTypes;
            if (attribute.ConstructorArguments.Length == 1)
            {
                parameterTypes = [];
            }
            else if (attribute.ConstructorArguments[1].Kind != TypedConstantKind.Array)
            {
                parameterTypes = attribute.ConstructorArguments[1..].Select(a => (ISymbol?) a.Value).ToArray();
            }
            else
            {
                parameterTypes = attribute.ConstructorArguments[1].Values.Select(v => (ISymbol?)v.Value).ToArray();
            }
            if (parameterTypes.Length != signature.Parameters.Count)
            {
                return false;
            }

            for (int i = 0; i < parameterTypes.Length; i++)
            {
                var parameterType = ((ITypeSymbol)parameterTypes[i]!).GetCSharpType();
                // we ignore nullability for reference types as these are generated the same regardless of nullability
                // TODO - switch to using CSharpType.Equals once https://github.com/microsoft/typespec/issues/4624 is fixed.
                if (GetTypeOrMethodName(parameterType.Name) != signature.Parameters[i].Type.Name ||
                    (parameterType.IsValueType && parameterType.IsNullable != signature.Parameters[i].Type.IsNullable))
                {
                    return false;
                }
            }

            return true;
        }

        private static bool IsMatch(MethodSignatureBase customMethod, MethodSignatureBase method)
        {
            if (customMethod.Parameters.Count != method.Parameters.Count || GetTypeOrMethodName(customMethod.Name) != method.Name)
            {
                return false;
            }

            for (int i = 0; i < customMethod.Parameters.Count; i++)
            {
                if (GetTypeOrMethodName(customMethod.Parameters[i].Type.Name) != method.Parameters[i].Type.Name)
                {
                    return false;
                }
            }

            return true;
        }

        private static string GetTypeOrMethodName(string fullyQualifiedName)
        {
            var parts = fullyQualifiedName.Split('.');
            return parts[^1];
        }

        private static void ValidateArguments(TypeProvider type, AttributeData attributeData)
        {
            var arguments = attributeData.ConstructorArguments;
            if (arguments.Length == 0)
            {
                throw new InvalidOperationException($"CodeGenSuppress attribute on {type.Name} must specify a method, constructor, field, or property name as its first argument.");
            }

            if (arguments[0].Kind != TypedConstantKind.Primitive || arguments[0].Value is not string)
            {
                var attribute = GetText(attributeData.ApplicationSyntaxReference);
                throw new InvalidOperationException($"{attribute} attribute on {type.Name} must specify a method, constructor, field, or property name as its first argument.");
            }

            if (arguments.Length == 2 && arguments[1].Kind == TypedConstantKind.Array)
            {
                ValidateTypeArguments(type, attributeData, arguments[1].Values);
            }
            else
            {
                ValidateTypeArguments(type, attributeData, arguments.Skip(1));
            }
        }

        private static void ValidateTypeArguments(TypeProvider type, AttributeData attributeData, IEnumerable<TypedConstant> arguments)
        {
            foreach (var argument in arguments)
            {
                if (argument.Kind == TypedConstantKind.Type)
                {
                    if (argument.Value is IErrorTypeSymbol errorType)
                    {
                        var attribute = GetText(attributeData.ApplicationSyntaxReference);
                        var fileLinePosition = GetFileLinePosition(attributeData.ApplicationSyntaxReference);
                        var filePath = fileLinePosition.Path;
                        var line = fileLinePosition.StartLinePosition.Line + 1;
                        throw new InvalidOperationException($"The undefined type '{errorType.Name}' is referenced in the '{attribute}' attribute ({filePath}, line: {line}). Please define this type or remove it from the attribute.");
                    }
                }
                else
                {
                    var attribute = GetText(attributeData.ApplicationSyntaxReference);
                    throw new InvalidOperationException($"Argument '{argument.ToCSharpString()}' in attribute '{attribute}' applied to '{type.Name}' must be a type.");
                }
            }
        }

        private static string GetText(SyntaxReference? syntaxReference)
            => syntaxReference?.SyntaxTree.GetText().ToString(syntaxReference.Span) ?? string.Empty;

        private static FileLinePositionSpan GetFileLinePosition(SyntaxReference? syntaxReference)
            => syntaxReference?.SyntaxTree.GetLocation(syntaxReference.Span).GetLineSpan() ?? default;

        private IEnumerable<AttributeData> GetMemberSuppressionAttributes()
            => CustomCodeView?.GetAttributes()?.Where(a => a.AttributeClass?.Name == CodeGenAttributes.CodeGenSuppressAttributeName) ?? [];
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.SourceInput;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    public abstract class TypeProvider
    {
        private Lazy<NamedTypeSymbolProvider?> _customCodeView;

        protected TypeProvider()
        {
            _customCodeView = new(GetCustomCodeView);
        }

        private protected virtual NamedTypeSymbolProvider? GetCustomCodeView()
            => CodeModelPlugin.Instance.SourceInputModel.FindForType(GetNamespace(), BuildName());

        public NamedTypeSymbolProvider? CustomCodeView => _customCodeView.Value;

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

        protected TypeSignatureModifiers GetCustomCodeModifiers() => CustomCodeView?.DeclarationModifiers ?? TypeSignatureModifiers.None;

        private TypeSignatureModifiers GetDeclarationModifiersInternal()
        {
            var modifiers = GetDeclarationModifiers();
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

        protected virtual CSharpType? GetBaseType() => null;

        public virtual WhereExpression? WhereClause { get; protected init; }

        public virtual TypeProvider? DeclaringTypeProvider { get; protected init; }

        private IReadOnlyList<CSharpType>? _implements;

        public IReadOnlyList<CSharpType> Implements => _implements ??= BuildImplements();

        private IReadOnlyList<PropertyProvider>? _properties;
        public IReadOnlyList<PropertyProvider> Properties => _properties ??= BuildPropertiesInternal();

        private IReadOnlyList<MethodProvider>? _methods;
        public IReadOnlyList<MethodProvider> Methods => _methods ??= BuildMethodsInternal();

        private IReadOnlyList<ConstructorProvider>? _constructors;

        public IReadOnlyList<ConstructorProvider> Constructors => _constructors ??= BuildConstructorsInternal();

        private IReadOnlyList<FieldProvider>? _fields;
        public IReadOnlyList<FieldProvider> Fields => _fields ??= BuildFields();

        private IReadOnlyList<TypeProvider>? _nestedTypes;
        public IReadOnlyList<TypeProvider> NestedTypes => _nestedTypes ??= BuildNestedTypes();

        private IReadOnlyList<TypeProvider>? _serializationProviders;

        public virtual IReadOnlyList<TypeProvider> SerializationProviders => _serializationProviders ??= BuildSerializationProviders();

        private IReadOnlyList<AttributeStatement>? _attributes;
        public IReadOnlyList<AttributeStatement> Attributes => _attributes ??= BuildAttributes();

        protected virtual CSharpType[] GetTypeArguments() => [];

        private PropertyProvider[] BuildPropertiesInternal()
        {
            var properties = new List<PropertyProvider>();
            var customProperties = new Dictionary<string, PropertyProvider>();
            var renamedProperties = new Dictionary<string, PropertyProvider>();
            foreach (var customProperty in CustomCodeView?.Properties ?? [])
            {
                customProperties.Add(customProperty.Name, customProperty);
                foreach (var attribute in customProperty.Attributes ?? [])
                {
                    if (CodeGenAttributes.TryGetCodeGenMemberAttributeValue(attribute, out var originalName))
                    {
                        renamedProperties.Add(originalName, customProperty);
                    }
                }
            }
            foreach (var property in BuildProperties())
            {
                if (ShouldGenerate(property, customProperties, renamedProperties))
                {
                    properties.Add(property);
                }
            }

            return properties.ToArray();
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

            return methods.ToArray();
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

        private bool ShouldGenerate(PropertyProvider property, IDictionary<string, PropertyProvider> customProperties, IDictionary<string, PropertyProvider> renamedProperties)
        {
            foreach (var attribute in GetMemberSuppressionAttributes())
            {
                if (IsMatch(property, attribute))
                {
                    return false;
                }
            }

            string? serializedName = null;
            if (property.WireInfo != null)
            {
                bool containsRenamedProperty = renamedProperties.TryGetValue(property.Name, out PropertyProvider? renamedProp);
                foreach (var attribute in GetCodeGenSerializationAttributes())
                {
                    if (CodeGenAttributes.TryGetCodeGenSerializationAttributeValue(
                        attribute,
                        out var propertyName,
                        out string? serializationName,
                        out _,
                        out _,
                        out _) && serializationName != null)
                    {
                        if (propertyName == property.Name
                            || (containsRenamedProperty && renamedProp != null && propertyName == renamedProp.Name))
                        {
                            serializedName = serializationName;
                            break;
                        }
                    }
                }

                // replace original property serialization name.
                if (serializedName != null)
                {
                    property.WireInfo.SerializedName = serializedName;
                }
            }

            if (renamedProperties.TryGetValue(property.Name, out PropertyProvider? customProp) ||
                customProperties.TryGetValue(property.Name, out customProp))
            {
                // Store the wire info on the custom property so that we can use it for serialization.
                // The custom property that has the CodeGenMemberAttribute stored in renamedProperties should take precedence.
                customProp.WireInfo = property.WireInfo;
                customProp.BaseProperty = property.BaseProperty;
                return false;
            }

            return true;
        }

        private static bool IsMatch(PropertyProvider propertyProvider, AttributeData attribute)
        {
            ValidateArguments(propertyProvider.EnclosingType, attribute);
            var name = attribute.ConstructorArguments[0].Value as string;
            return name == propertyProvider.Name;
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
                parameterTypes = [(ISymbol?) attribute.ConstructorArguments[1].Value];
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
                if (parameterTypes[i]?.Name != signature.Parameters[i].Type.Name)
                {
                    return false;
                }
            }

            return true;
        }

        private static bool IsMatch(MethodSignatureBase customMethod, MethodSignatureBase method)
        {
            if (customMethod.Parameters.Count != method.Parameters.Count || !customMethod.Name.EndsWith(method.Name))
            {
                return false;
            }

            for (int i = 0; i < customMethod.Parameters.Count; i++)
            {
                if (!customMethod.Parameters[i].Type.Name.EndsWith(method.Parameters[i].Type.Name))
                {
                    return false;
                }
            }

            return true;
        }

        private static void ValidateArguments(TypeProvider type, AttributeData attributeData)
        {
            var arguments = attributeData.ConstructorArguments;
            if (arguments.Length == 0)
            {
                throw new InvalidOperationException($"CodeGenSuppress attribute on {type.Name} must specify a method, constructor, or property name as its first argument.");
            }

            if (arguments[0].Kind != TypedConstantKind.Primitive || arguments[0].Value is not string)
            {
                var attribute = GetText(attributeData.ApplicationSyntaxReference);
                throw new InvalidOperationException($"{attribute} attribute on {type.Name} must specify a method, constructor, or property name as its first argument.");
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
        private IEnumerable<AttributeData> GetCodeGenSerializationAttributes()
            => CustomCodeView?.GetAttributes()?.Where(a => a.AttributeClass?.Name == CodeGenAttributes.CodeGenSerializationAttributeName) ?? [];
    }
}

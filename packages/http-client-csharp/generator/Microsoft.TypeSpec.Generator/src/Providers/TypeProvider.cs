// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public abstract class TypeProvider
    {
        private Lazy<TypeProvider?> _customCodeView;
        private Lazy<TypeProvider?> _lastContractView;
        private Lazy<CanonicalTypeProvider> _canonicalView;
        private readonly InputType? _inputType;

        protected TypeProvider(InputType? inputType = default)
        {
            _customCodeView = new(() => BuildCustomCodeView());
            _canonicalView = new(BuildCanonicalView);
            _lastContractView = new(BuildLastContractView);
            _inputType = inputType;
        }

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected TypeProvider() : this(null)
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        private protected virtual TypeProvider? BuildCustomCodeView(string? generatedTypeName = null)
            => CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCustomization(
                BuildNamespace(),
                generatedTypeName ?? BuildName(),
                // Use the Type.Name so that any customizations to the declaring type are applied for the lookup.
                DeclaringTypeProvider?.Type.Name);

        private protected virtual TypeProvider? BuildLastContractView()
            => CodeModelGenerator.Instance.SourceInputModel.FindForTypeInLastContract(BuildNamespace(), BuildName(), DeclaringTypeProvider?.BuildName());

        public TypeProvider? CustomCodeView => _customCodeView.Value;
        public TypeProvider? LastContractView => _lastContractView.Value;

        private IReadOnlyList<PropertyProvider> BuildAllCustomProperties()
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

        private IReadOnlyList<FieldProvider> BuildAllCustomFields()
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

        private protected virtual CanonicalTypeProvider BuildCanonicalView() => new CanonicalTypeProvider(this, _inputType);
        public TypeProvider CanonicalView => _canonicalView.Value;

        protected string? _deprecated;

        /// <summary>
        /// Gets the relative file path where the generated file will be stored.
        /// This path is relative to the project's root directory.
        /// </summary>
        // Intentionally do not cache this value as the name might be changed in a visitor so we want to always
        // recalculate it.
        public string RelativeFilePath => _relativeFilePath ?? BuildRelativeFilePath();

        private string? _relativeFilePath;

        public string Name => Type.Name;

        public FormattableString Description => _description ??= BuildDescription();
        private FormattableString? _description;

        protected virtual FormattableString BuildDescription() => FormattableStringHelpers.Empty;

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
        private CSharpType[]? _arguments;
        public CSharpType Type => _type ??=
            new(
                CustomCodeView?.Name ?? BuildName(),
                CustomCodeView?.Type.Namespace ?? BuildNamespace(),
                this is EnumProvider ||
                DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct) ||
                DeclarationModifiers.HasFlag(TypeSignatureModifiers.Enum),
                false,
                DeclaringTypeProvider?.Type,
                _arguments ??= GetTypeArguments(),
                DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public) && _arguments.All(t => t.IsPublic),
                DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct),
                GetBaseType(),
                IsEnum ? EnumUnderlyingType.FrameworkType : null);

        protected virtual bool GetIsEnum() => false;
        public bool IsEnum => GetIsEnum();

        protected virtual string BuildNamespace() => CodeModelGenerator.Instance.TypeFactory.PrimaryNamespace;

        private TypeSignatureModifiers? _declarationModifiers;

        public TypeSignatureModifiers DeclarationModifiers => _declarationModifiers ??= BuildDeclarationModifiersInternal();

        protected virtual TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.None;

        private TypeSignatureModifiers BuildDeclarationModifiersInternal()
        {
            var modifiers = BuildDeclarationModifiers();
            var customModifiers = CustomCodeView?.DeclarationModifiers ?? TypeSignatureModifiers.None;
            if (customModifiers != TypeSignatureModifiers.None)
            {
                // if the custom modifiers contain accessibility modifiers, we override the default ones
                if (customModifiers.HasFlag(TypeSignatureModifiers.Internal) ||
                    customModifiers.HasFlag(TypeSignatureModifiers.Public) ||
                    customModifiers.HasFlag(TypeSignatureModifiers.Private))
                {
                    modifiers &= ~(TypeSignatureModifiers.Internal | TypeSignatureModifiers.Public | TypeSignatureModifiers.Private);
                }
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
        public IReadOnlyList<TypeProvider> NestedTypes => _nestedTypes ??= BuildNestedTypesInternal();

        private IReadOnlyList<TypeProvider>? _serializationProviders;

        public IReadOnlyList<TypeProvider> SerializationProviders => _serializationProviders ??= BuildSerializationProviders();

        private IReadOnlyList<AttributeStatement>? _attributes;
        public IReadOnlyList<AttributeStatement> Attributes => _attributes ??= BuildAttributes();

        protected virtual CSharpType[] GetTypeArguments() => [];

        private protected virtual PropertyProvider[] FilterCustomizedProperties(PropertyProvider[] specProperties)
        {
            var properties = new List<PropertyProvider>();
            var customProperties = new HashSet<string>();

            foreach (var customProperty in BuildAllCustomProperties())
            {
                customProperties.Add(customProperty.Name);
                if (customProperty.OriginalName != null)
                {
                    customProperties.Add(customProperty.OriginalName);
                }
            }

            foreach (var customField in BuildAllCustomFields())
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

            foreach (var customField in BuildAllCustomFields())
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

        private TypeProvider[] BuildNestedTypesInternal()
        {
            var nestedTypes = new List<TypeProvider>();
            foreach (var nestedType in BuildNestedTypes())
            {
                if (ShouldGenerate(nestedType))
                {
                    nestedTypes.Add(nestedType);
                }
            }

            return [.. nestedTypes];
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
            var docs = new XmlDocProvider(new XmlDocSummaryStatement([Description]));

            return docs;
        }

        protected abstract string BuildRelativeFilePath();
        protected abstract string BuildName();

        /// <summary>
        /// Resets the type provider to its initial state, clearing all cached properties and fields.
        /// This allows for the type provider to rebuild its state on subsequent calls to its properties.
        /// </summary>
        public void Reset()
        {
            _methods = null;
            _properties = null;
            _fields = null;
            _constructors = null;
            _serializationProviders = null;
            _nestedTypes = null;
            _xmlDocs = null;
            _declarationModifiers = null;
            _relativeFilePath = null;
            _customCodeView = new(() => BuildCustomCodeView());
            _canonicalView = new(BuildCanonicalView);
            _lastContractView = new(BuildLastContractView);
            _enumValues = null;
            _enumUnderlyingType = null;
            _attributes = null;
            _deprecated = null;
            _description = null;
            _type = null;
            _arguments = null;
        }

        /// <summary>
        /// Updates the type provider with new values for its properties, methods, constructors, etc.
        /// </summary>
        /// <param name="methods">The new methods.</param>
        /// <param name="constructors">The new constructors.</param>
        /// <param name="properties">The new properties.</param>
        /// <param name="fields">The new fields.</param>
        /// <param name="serializations">The new serializations.</param>
        /// <param name="nestedTypes">The new nested types.</param>
        /// <param name="xmlDocs">The new XML docs.</param>
        /// <param name="modifiers">The new modifiers.</param>
        /// <param name="name">The new name.</param>
        /// <param name="namespace">The new namespace.</param>
        /// <param name="relativeFilePath">The new relative file path.</param>
        /// <param name="reset">Whether to reset the type provider before applying the other changes in the update. This is useful
        /// if you are changing the name as other properties would need to be reset and recomputed based on the new name.</param>
        public void Update(
            IEnumerable<MethodProvider>? methods = null,
            IEnumerable<ConstructorProvider>? constructors = null,
            IEnumerable<PropertyProvider>? properties = null,
            IEnumerable<FieldProvider>? fields = null,
            IEnumerable<TypeProvider>? serializations = null,
            IEnumerable<TypeProvider>? nestedTypes = null,
            IEnumerable<AttributeStatement>? attributes = default,
            XmlDocProvider? xmlDocs = null,
            TypeSignatureModifiers? modifiers = null,
            string? name = null,
            string? @namespace = null,
            string? relativeFilePath = null,
            bool reset = false)
        {
            if (reset)
            {
                Reset();
            }
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
            if (modifiers != null)
            {
                _declarationModifiers = modifiers;
            }
            if (relativeFilePath != null)
            {
                _relativeFilePath = relativeFilePath;
            }
            if (attributes != null)
            {
                _attributes = (attributes as IReadOnlyList<AttributeStatement>) ?? [.. attributes];
            }

            if (name != null)
            {
                // Reset the custom code view to reflect the new name
                _customCodeView = new(BuildCustomCodeView(name));
                // Give precedence to the custom code view name if it exists
                Type.Update(_customCodeView.Value?.Name ?? name);
            }

            if (@namespace != null)
            {
                Type.Update(@namespace: @namespace);
            }

            // Rebuild the canonical view
            _canonicalView = new(BuildCanonicalView);
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

        private bool ShouldGenerate(TypeProvider nestedType)
        {
            if (nestedType is FixedEnumProvider { CustomCodeView: { IsEnum: true, Type: { IsValueType: true, IsStruct: false } } })
            {
                return false;
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
            if (name != GetFullMethodName(signature))
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
                if (!IsNameMatch(parameterType, signature.Parameters[i].Type) ||
                    (parameterType.IsValueType && parameterType.IsNullable != signature.Parameters[i].Type.IsNullable))
                {
                    return false;
                }
            }

            return true;
        }

        private static bool IsMatch(MethodSignatureBase customMethod, MethodSignatureBase method)
        {
            if (customMethod.Parameters.Count != method.Parameters.Count || GetFullMethodName(customMethod) != GetFullMethodName(method))
            {
                return false;
            }

            for (int i = 0; i < customMethod.Parameters.Count; i++)
            {
                // The namespace may not be available for generated types as they are not yet generated
                // so Roslyn will not have the namespace information.
                if (!IsNameMatch(customMethod.Parameters[i].Type, method.Parameters[i].Type))
                {
                    return false;
                }
            }

            return true;
        }

        private static bool IsNameMatch(CSharpType typeFromCustomization, CSharpType generatedType)
        {
            // The namespace may not be available for generated types referenced from customization as they
            // are not yet generated so Roslyn will not have the namespace information.
            if (string.IsNullOrEmpty(typeFromCustomization.Namespace))
            {
                return typeFromCustomization.Name == generatedType.Name;
            }

            return typeFromCustomization.FullyQualifiedName == generatedType.FullyQualifiedName;
        }

        private static string GetFullMethodName(MethodSignatureBase method)
        {
            if (method is MethodSignature methodSignature)
            {
                return methodSignature.FullMethodName;
            }

            return method.Name;
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
                        CodeModelGenerator.Instance.Emitter.Info(
                            $"The undefined type '{errorType.Name}' is referenced in the '{attribute}' attribute ({filePath}, line: {line}). If this is not a generated type, " +
                            $"please define this type or remove it from the attribute.");
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
            => CustomCodeView?.Attributes.Where(a => a.Data?.AttributeClass?.Name == CodeGenAttributes.CodeGenSuppressAttributeName).
                Select(a => a.Data!).ToList() ?? [];
    }
}

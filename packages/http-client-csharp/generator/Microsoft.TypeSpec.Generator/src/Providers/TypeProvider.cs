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
    /// <summary>
    /// Provides a base class for describing and generating C# types from TypeSpec input models.
    /// </summary>
    public abstract class TypeProvider
    {
        private Lazy<TypeProvider?> _customCodeView;
        private Lazy<TypeProvider?> _lastContractView;
        private Lazy<CanonicalTypeProvider> _canonicalView;
        private readonly InputType? _inputType;

        /// <summary>
        /// Initializes a new instance of the <see cref="TypeProvider"/> class with the specified input type.
        /// </summary>
        /// <param name="inputType">The input type to use for this provider.</param>
        protected TypeProvider(InputType? inputType = default)
        {
            _customCodeView = new(() => BuildCustomCodeView());
            _canonicalView = new(BuildCanonicalView);
            _lastContractView = new(BuildLastContractView);
            _inputType = inputType;
        }

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        /// <summary>
        /// Initializes a new instance of the <see cref="TypeProvider"/> class for mocking.
        /// </summary>
        protected TypeProvider() : this(null)
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        /// <summary>
        /// Builds the custom code view for this type provider, optionally using a generated type name.
        /// </summary>
        /// <param name="generatedTypeName">The generated type name to use, or null to use the default.</param>
        /// <returns>The custom code view type provider, or null if not found.</returns>
        private protected virtual TypeProvider? BuildCustomCodeView(string? generatedTypeName = null)
            => CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCustomization(
                BuildNamespace(),
                generatedTypeName ?? BuildName(),
                // Use the Type.Name so that any customizations to the declaring type are applied for the lookup.
                DeclaringTypeProvider?.Type.Name);

        /// <summary>
        /// Builds the last contract view for this type provider.
        /// </summary>
        /// <returns>The last contract view type provider, or null if not found.</returns>
        private protected virtual TypeProvider? BuildLastContractView()
            => CodeModelGenerator.Instance.SourceInputModel.FindForTypeInLastContract(BuildNamespace(), BuildName(), DeclaringTypeProvider?.BuildName());

        /// <summary>
        /// Builds the canonical view for this type provider.
        /// </summary>
        /// <returns>The canonical type provider.</returns>
        private protected virtual CanonicalTypeProvider BuildCanonicalView() => new CanonicalTypeProvider(this, _inputType);

        /// <summary>
        /// Gets the base type provider for this type, if any.
        /// </summary>
        internal virtual TypeProvider? BaseTypeProvider => null;

        /// <summary>
        /// Gets the declaring type provider for this type, if any.
        /// </summary>
        public virtual TypeProvider? DeclaringTypeProvider { get; protected init; }

        /// <summary>
        /// Gets the <see cref="WhereExpression"/> clause for this type, if any.
        /// </summary>
        public virtual WhereExpression? WhereClause { get; protected init; }

        /// <summary>
        /// Gets the list of attributes for this type.
        /// </summary>
        public IReadOnlyList<AttributeStatement> Attributes => _attributes ??= BuildAttributes();

        /// <summary>
        /// Gets the name of the type.
        /// </summary>
        public string Name => Type.Name;

        /// <summary>
        /// Gets the description of the type.
        /// </summary>
        public FormattableString Description => _description ??= BuildDescription();

        /// <summary>
        /// Gets the XML documentation provider for this type.
        /// </summary>
        public XmlDocProvider XmlDocs
        {
            get => _xmlDocs ??= BuildXmlDocs();
            private set => _xmlDocs = value;
        }

        /// <summary>
        /// Gets the deprecation message for this type, if any.
        /// </summary>
        public string? Deprecated
        {
            get => _deprecated;
            private set => _deprecated = value;
        }

        /// <summary>
        /// Gets the CSharpType for this type provider.
        /// </summary>
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

        /// <summary>
        /// Gets a value indicating whether this type is an enum.
        /// </summary>
        public bool IsEnum => GetIsEnum();

        /// <summary>
        /// Gets the declaration modifiers for this type.
        /// </summary>
        public TypeSignatureModifiers DeclarationModifiers => _declarationModifiers ??= BuildDeclarationModifiersInternal();

        /// <summary>
        /// Gets the list of interfaces implemented by this type.
        /// </summary>
        public IReadOnlyList<CSharpType> Implements => _implements ??= BuildImplements();

        /// <summary>
        /// Gets the list of properties for this type.
        /// </summary>
        public IReadOnlyList<PropertyProvider> Properties => _properties ??= FilterCustomizedProperties(BuildProperties());

        /// <summary>
        /// Gets the list of methods for this type.
        /// </summary>
        public IReadOnlyList<MethodProvider> Methods => _methods ??= BuildMethodsInternal();

        /// <summary>
        /// Gets the list of constructors for this type.
        /// </summary>
        public IReadOnlyList<ConstructorProvider> Constructors => _constructors ??= BuildConstructorsInternal();

        /// <summary>
        /// Gets the list of fields for this type.
        /// </summary>
        public IReadOnlyList<FieldProvider> Fields => _fields ??= FilterCustomizedFields(BuildFields());

        /// <summary>
        /// Gets the list of nested types for this type.
        /// </summary>
        public IReadOnlyList<TypeProvider> NestedTypes => _nestedTypes ??= BuildNestedTypesInternal();

        /// <summary>
        /// Gets the list of serialization providers for this type.
        /// </summary>
        public IReadOnlyList<TypeProvider> SerializationProviders => _serializationProviders ??= BuildSerializationProviders();

        /// <summary>
        /// Gets the enum underlying type for this type, if it is an enum.
        /// </summary>
        public CSharpType EnumUnderlyingType => _enumUnderlyingType ??= BuildEnumUnderlyingType();

        /// <summary>
        /// Gets the list of enum values for this type, if it is an enum.
        /// </summary>
        public IReadOnlyList<EnumTypeMember> EnumValues => _enumValues ??= BuildEnumValues();

        /// <summary>
        /// Gets the relative file path where the generated file will be stored.
        /// This path is relative to the project's root directory.
        /// </summary>
        // Intentionally do not cache this value as the name might be changed in a visitor so we want to always
        // recalculate it.
        public string RelativeFilePath => _relativeFilePath ?? BuildRelativeFilePath();

        private string? _relativeFilePath;

        private protected virtual CanonicalTypeProvider BuildCanonicalView() => new CanonicalTypeProvider(this, _inputType);

        protected string? _deprecated;

        private CSharpType? _type;
        private CSharpType[]? _arguments;
        protected virtual bool GetIsEnum() => false;

        private TypeSignatureModifiers? _declarationModifiers;

        private IReadOnlyList<CSharpType>? _implements;

        private IReadOnlyList<PropertyProvider>? _properties;

        private IReadOnlyList<MethodProvider>? _methods;
        private IReadOnlyList<ConstructorProvider>? _constructors;

        private IReadOnlyList<FieldProvider>? _fields;
        private IReadOnlyList<TypeProvider>? _nestedTypes;
        private IReadOnlyList<TypeProvider>? _serializationProviders;

        private IReadOnlyList<AttributeStatement>? _attributes;
        public IReadOnlyList<AttributeStatement> Attributes => _attributes ??= BuildAttributes();

        private IReadOnlyList<EnumTypeMember>? _enumValues;

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

        /// <summary>
        /// Gets the canonical view for this type provider.
        /// </summary>
        public TypeProvider CanonicalView => _canonicalView.Value;

        /// <summary>
        /// Builds the description for this type provider.
        /// </summary>
        /// <returns>The description as a <see cref="FormattableString"/>.</returns>
        protected virtual FormattableString BuildDescription() => FormattableStringHelpers.Empty;

        /// <summary>
        /// Builds the XML documentation provider for this type.
        /// </summary>
        /// <returns>The XML documentation provider.</returns>
        protected virtual XmlDocProvider BuildXmlDocs()
        {
            var docs = new XmlDocProvider(new XmlDocSummaryStatement([Description]));
            return docs;
        }

        /// <summary>
        /// Builds the relative file path for this type provider.
        /// </summary>
        /// <returns>The relative file path.</returns>
        protected abstract string BuildRelativeFilePath();

        /// <summary>
        /// Builds the name for this type provider.
        /// </summary>
        /// <returns>The name.</returns>
        protected abstract string BuildName();

        /// <summary>
        /// Builds the namespace for this type provider.
        /// </summary>
        /// <returns>The namespace.</returns>
        protected virtual string BuildNamespace() => CodeModelGenerator.Instance.TypeFactory.PrimaryNamespace;

        /// <summary>
        /// Builds the declaration modifiers for this type provider.
        /// </summary>
        /// <returns>The declaration modifiers.</returns>
        protected virtual TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.None;

        /// <summary>
        /// Gets the list of properties for this type.
        /// </summary>
        /// <returns>An array of <see cref="PropertyProvider"/>.</returns>
        protected virtual PropertyProvider[] BuildProperties() => [];

        /// <summary>
        /// Gets the list of fields for this type.
        /// </summary>
        /// <returns>An array of <see cref="FieldProvider"/>.</returns>
        protected virtual FieldProvider[] BuildFields() => [];

        /// <summary>
        /// Gets the list of interfaces implemented by this type.
        /// </summary>
        /// <returns>An array of <see cref="CSharpType"/>.</returns>
        protected virtual CSharpType[] BuildImplements() => [];

        /// <summary>
        /// Gets the list of methods for this type.
        /// </summary>
        /// <returns>An array of <see cref="MethodProvider"/>.</returns>
        protected virtual MethodProvider[] BuildMethods() => [];

        /// <summary>
        /// Gets the list of constructors for this type.
        /// </summary>
        /// <returns>An array of <see cref="ConstructorProvider"/>.</returns>
        protected virtual ConstructorProvider[] BuildConstructors() => [];

        /// <summary>
        /// Gets the list of nested types for this type.
        /// </summary>
        /// <returns>An array of <see cref="TypeProvider"/>.</returns>
        protected virtual TypeProvider[] BuildNestedTypes() => [];

        /// <summary>
        /// Gets the list of serialization providers for this type.
        /// </summary>
        /// <returns>An array of <see cref="TypeProvider"/>.</returns>
        protected virtual TypeProvider[] BuildSerializationProviders() => [];

        /// <summary>
        /// Gets the enum underlying type for this type, if it is an enum.
        /// </summary>
        /// <returns>The underlying <see cref="CSharpType"/>.</returns>
        protected virtual CSharpType BuildEnumUnderlyingType() => throw new InvalidOperationException("Not an EnumProvider type");

        /// <summary>
        /// Builds the attributes for this type provider.
        /// </summary>
        /// <returns>A read-only list of <see cref="AttributeStatement"/>.</returns>
        protected virtual IReadOnlyList<AttributeStatement> BuildAttributes() => [];

        /// <summary>
        /// Builds the enum values for this type provider.
        /// </summary>
        /// <returns>A read-only list of <see cref="EnumTypeMember"/>.</returns>
        protected virtual IReadOnlyList<EnumTypeMember> BuildEnumValues() => throw new InvalidOperationException("Not an EnumProvider type");

        /// <summary>
        /// Gets the custom code view for this type provider, if any.
        /// </summary>
        public TypeProvider? CustomCodeView => _customCodeView.Value;

        /// <summary>
        /// Gets the last contract view for this type provider, if any.
        /// </summary>
        public TypeProvider? LastContractView => _lastContractView.Value;

        private string? _relativeFilePath;

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

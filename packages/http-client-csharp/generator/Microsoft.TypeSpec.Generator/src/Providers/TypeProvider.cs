// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public abstract class TypeProvider
    {
        private Lazy<TypeProvider?> _customCodeView;
        private Lazy<TypeProvider?> _lastContractView;
        private Lazy<CanonicalTypeProvider> _canonicalView;
        private Lazy<TypeProvider> _specView;
        private Lazy<string?> _declaringTypeName;
        private readonly InputType? _inputType;

        protected TypeProvider(InputType? inputType = default)
        {
            _customCodeView = new(() => BuildCustomCodeView());
            _canonicalView = new(BuildCanonicalView);
            _lastContractView = new(() => BuildLastContractView());
            _specView = new(BuildSpecView);
            _declaringTypeName = new(() => GetDeclaringTypeName(DeclaringTypeProvider));
            _inputType = inputType;
        }

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected TypeProvider() : this(null)
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        private protected virtual TypeProvider? BuildCustomCodeView(string? generatedTypeName = null, string? generatedTypeNamespace = null)
            => CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCustomization(
                generatedTypeNamespace ?? BuildNamespace(),
                generatedTypeName ?? BuildName(),
                _declaringTypeName.Value);

        private protected virtual TypeProvider? BuildLastContractView(string? generatedTypeName = null, string? generatedTypeNamespace = null)
            => CodeModelGenerator.Instance.SourceInputModel.FindForTypeInLastContract(
                generatedTypeNamespace ?? CustomCodeView?.Type.Namespace ?? BuildNamespace(),
                generatedTypeName ?? CustomCodeView?.Name ?? BuildName(),
                _declaringTypeName.Value);

        private static string? GetDeclaringTypeName(TypeProvider? declaringTypeProvider)
        {
            if (declaringTypeProvider is null)
            {
                return null;
            }

            var parentName = GetDeclaringTypeName(declaringTypeProvider.DeclaringTypeProvider);
            return parentName is null
                ? declaringTypeProvider.Type.Name
                : $"{parentName}+{declaringTypeProvider.Type.Name}";
        }

        private protected virtual TypeProvider BuildSpecView() => new SpecTypeProvider(this);

        public TypeProvider? CustomCodeView => _customCodeView.Value;
        public TypeProvider? LastContractView => _lastContractView.Value;
        public TypeProvider SpecView => _specView.Value;

        private IReadOnlyList<PropertyProvider> BuildAllCustomProperties()
        {
            var allCustomProperties = CustomCodeView?.Properties != null
                ? new List<PropertyProvider>(CustomCodeView.Properties)
                : [];
            var baseTypeProvider = BaseTypeProvider;
            var includeBaseProviderMembers = CustomCodeView?.BaseType != null;
            var visited = new HashSet<TypeProvider>();

            // add all custom properties from base types
            while (baseTypeProvider != null && visited.Add(baseTypeProvider))
            {
                if (includeBaseProviderMembers)
                {
                    allCustomProperties.AddRange(baseTypeProvider.Properties);
                }

                if (baseTypeProvider.CustomCodeView is { } customCodeView)
                {
                    allCustomProperties.AddRange(customCodeView.Properties);
                }
                baseTypeProvider = baseTypeProvider.BaseTypeProvider;
            }

            return allCustomProperties;
        }

        private IReadOnlyList<FieldProvider> BuildAllCustomFields()
        {
            var allCustomFields = CustomCodeView?.Fields != null
                ? new List<FieldProvider>(CustomCodeView.Fields)
                : [];
            var baseTypeProvider = BaseTypeProvider;
            var includeBaseProviderMembers = CustomCodeView?.BaseType != null;
            var visited = new HashSet<TypeProvider>();

            // add all custom fields from base types
            while (baseTypeProvider != null && visited.Add(baseTypeProvider))
            {
                if (includeBaseProviderMembers)
                {
                    allCustomFields.AddRange(baseTypeProvider.Fields);
                }

                if (baseTypeProvider.CustomCodeView is { } customCodeView)
                {
                    allCustomFields.AddRange(customCodeView.Fields);
                }
                baseTypeProvider = baseTypeProvider.BaseTypeProvider;
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

        internal bool PreserveTypeXmlDocs { get; private set; }

        protected internal virtual bool ShouldWriteTypeXmlDocs => false;

        protected internal virtual bool IsClientProvider => false;

        internal void PreserveXmlDocs()
        {
            PreserveTypeXmlDocs = true;
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
                BaseType,
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
                CodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                   DiagnosticCodes.InvalidAccessModifier,
                   $"Invalid modifiers {modifiers} detected.",
                   severity: EmitterDiagnosticSeverity.Warning);
            }

            // Back-compat: a type that the last contract published as non-abstract must not become
            // abstract, which would be a source-breaking change for existing derived types and
            // callers. Preserve the previously-published non-abstract shape.
            if (modifiers.HasFlag(TypeSignatureModifiers.Abstract) &&
                LastContractView is { } lastContractView &&
                !lastContractView.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract))
            {
                modifiers &= ~TypeSignatureModifiers.Abstract;
            }

            // we always add partial when possible
            if (!modifiers.HasFlag(TypeSignatureModifiers.Enum) && DeclaringTypeProvider is null)
            {
                modifiers |= TypeSignatureModifiers.Partial;
            }

            return modifiers;
        }

        internal virtual TypeProvider? BaseTypeProvider => null;

        protected virtual CSharpType? BuildBaseType() => null;

        private IReadOnlyList<SuppressionStatement>? _disabledFileWarnings;
        public IReadOnlyList<SuppressionStatement> DisabledFileWarnings => _disabledFileWarnings ??= BuildDisabledFileWarnings();

        private protected virtual bool FilterCustomizedMembers => true;

        public CSharpType? BaseType => _baseType ??= BuildBaseType() ?? CustomCodeView?.BaseType;
        private CSharpType? _baseType;

        public WhereExpression? WhereClause => _whereClause ??= BuildWhereClause();
        private WhereExpression? _whereClause;
        protected virtual WhereExpression? BuildWhereClause() => null;

        public TypeProvider? DeclaringTypeProvider => _declaringTypeProvider ??= BuildDeclaringTypeProvider();
        private TypeProvider? _declaringTypeProvider;
        protected virtual TypeProvider? BuildDeclaringTypeProvider() => null;

        private IReadOnlyList<CSharpType>? _implements;

        public IReadOnlyList<CSharpType> Implements => _implements ??= BuildImplements();

        private IReadOnlyList<PropertyProvider>? _properties;

        public IReadOnlyList<PropertyProvider> Properties => _properties ??= ApplyCustomizationFilter(BuildProperties());

        private IReadOnlyList<MethodProvider>? _methods;
        public IReadOnlyList<MethodProvider> Methods => _methods ??= ApplyCustomizationFilter(BuildMethods());

        private IReadOnlyList<ConstructorProvider>? _constructors;

        public IReadOnlyList<ConstructorProvider> Constructors => _constructors ??= ApplyCustomizationFilter(BuildConstructors());

        private IReadOnlyList<FieldProvider>? _fields;
        public IReadOnlyList<FieldProvider> Fields => _fields ??= ApplyCustomizationFilter(BuildFields());

        // Applies customization filtering when enabled, otherwise returns the input as-is.
        // Centralizes the FilterCustomizedMembers gate so the property getters and
        // ProcessTypeForBackCompatibility share identical filtering semantics.
        private IReadOnlyList<PropertyProvider> ApplyCustomizationFilter(IEnumerable<PropertyProvider> properties)
            => FilterCustomizedMembers
                ? FilterCustomizedProperties(properties)
                : (properties as IReadOnlyList<PropertyProvider>) ?? [.. properties];

        private IReadOnlyList<MethodProvider> ApplyCustomizationFilter(IEnumerable<MethodProvider> methods)
            => FilterCustomizedMembers
                ? FilterCustomizedMethods(methods)
                : (methods as IReadOnlyList<MethodProvider>) ?? [.. methods];

        private IReadOnlyList<ConstructorProvider> ApplyCustomizationFilter(IEnumerable<ConstructorProvider> constructors)
            => FilterCustomizedMembers
                ? FilterCustomizedConstructors(constructors)
                : (constructors as IReadOnlyList<ConstructorProvider>) ?? [.. constructors];

        private IReadOnlyList<FieldProvider> ApplyCustomizationFilter(IEnumerable<FieldProvider> fields)
            => FilterCustomizedMembers
                ? FilterCustomizedFields(fields)
                : (fields as IReadOnlyList<FieldProvider>) ?? [.. fields];

        private IReadOnlyList<TypeProvider>? _nestedTypes;
        public IReadOnlyList<TypeProvider> NestedTypes => _nestedTypes ??= BuildNestedTypesInternal();

        private IReadOnlyList<TypeProvider>? _serializationProviders;

        public IReadOnlyList<TypeProvider> SerializationProviders => _serializationProviders ??= BuildSerializationProvidersInternal();

        internal TypeProvider? SerializationProviderOwner { get; private set; }

        private IReadOnlyList<CSharpType>? _helperDependencyTypes;
        internal IReadOnlyList<CSharpType> HelperDependencyTypes => _helperDependencyTypes ??= BuildHelperDependencyTypes();
        protected internal virtual IReadOnlyList<CSharpType> BuildHelperDependencyTypes() => [];

        private IReadOnlyList<CSharpType>? _bodyDependencyTypes;
        public IReadOnlyList<CSharpType> BodyDependencyTypes => _bodyDependencyTypes ??= BuildBodyDependencyTypes();
        protected internal virtual IReadOnlyList<CSharpType> BuildBodyDependencyTypes() => [];

        private IReadOnlyList<CSharpType>? _signatureDependencyTypes;
        public IReadOnlyList<CSharpType> SignatureDependencyTypes => _signatureDependencyTypes ??= BuildSignatureDependencyTypes();
        protected internal virtual IReadOnlyList<CSharpType> BuildSignatureDependencyTypes() => [];

        private IReadOnlyList<MethodBodyStatement>? _attributes;

        public IReadOnlyList<AttributeStatement> Attributes
        {
            get
            {
                _attributes ??= BuildAttributes();
                return [.. _attributes
                    .Select(a => a switch
                    {
                        SuppressionStatement suppression => suppression.AsStatement<AttributeStatement>() ??
                                                            throw new InvalidOperationException(
                                                                $"Unexpected suppression statement in {Name}."),
                        AttributeStatement attribute => attribute,
                        _ => throw new InvalidOperationException($"Unexpected attribute type {a.GetType()} in {Name}.")
                    })];
            }
        }

        internal IReadOnlyList<MethodBodyStatement> GetAttributes() => _attributes ??= BuildAttributes();

        internal IReadOnlyList<MethodBodyStatement> GetAttributesForWrite() => BuildAttributesForWrite();

        /// <summary>
        /// Builds the attributes emitted by the writer. Providers whose generated attributes depend on final
        /// generation decisions can override this without replacing attributes updated by visitors.
        /// </summary>
        protected internal virtual IReadOnlyList<MethodBodyStatement> BuildAttributesForWrite() => GetAttributes();

        /// <summary>
        /// Indicates whether this provider's attributes should contribute to reference-map analysis.
        /// </summary>
        protected internal virtual bool ShouldAnalyzeAttributesInReferenceMap => true;

        /// <summary>
        /// Determines whether a provider remains in the generated output after reference-map analysis.
        /// </summary>
        protected static bool ShouldWriteProvider(TypeProvider provider) =>
            ProviderReferenceMapAnalyzer.ShouldWriteProvider(provider);

        /// <summary>
        /// Determines whether a type remains resolvable after reference-map analysis.
        /// </summary>
        protected static bool IsResolvableBuildableType(CSharpType type) =>
            ProviderReferenceMapAnalyzer.IsResolvableBuildableType(type);

        protected virtual CSharpType[] GetTypeArguments() => [];

        internal PropertyProvider[] FilterCustomizedProperties(IEnumerable<PropertyProvider> specProperties)
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

            return [.. properties];
        }

        internal FieldProvider[] FilterCustomizedFields(IEnumerable<FieldProvider> specFields)
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

        internal MethodProvider[] FilterCustomizedMethods(IEnumerable<MethodProvider> specMethods)
        {
            var methods = new List<MethodProvider>();
            var customMethods = CustomCodeView?.Methods;
            // Only build the partial-declarations list when there are custom methods to inspect.
            // The vast majority of TypeProviders have no custom code; skip the allocation in that case.
            List<MethodProvider>? partialDeclarations = null;
            if (customMethods != null && customMethods.Count > 0)
            {
                foreach (var customMethod in customMethods)
                {
                    if (customMethod.IsPartialMethod)
                    {
                        (partialDeclarations ??= new List<MethodProvider>()).Add(customMethod);
                    }
                }
            }

            foreach (var method in specMethods)
            {
                // If a generated method is already marked as partial (e.g., by
                // ScmMethodProviderCollection's early detection), keep it as-is.
                if (method.IsPartialMethod)
                {
                    methods.Add(method);
                    continue;
                }

                MethodProvider? matchingPartial = null;
                if (partialDeclarations != null)
                {
                    foreach (var partial in partialDeclarations)
                    {
                        if (MethodSignatureBase.SignatureComparer.Equals(partial.Signature, method.Signature))
                        {
                            matchingPartial = partial;
                            break;
                        }
                    }
                }

                if (matchingPartial != null)
                {
                    methods.Add(CreatePartialMethodFromCustomSignature(matchingPartial.Signature, method));
                    continue;
                }

                if (ShouldGenerate(method))
                {
                    methods.Add(method);
                }
            }

            return [.. methods];
        }

        private static MethodProvider CreatePartialMethodFromCustomSignature(MethodSignature customSignature, MethodProvider generatedMethod)
        {
            // Partial method implementations require all parameters to be required (no default values).
            // The generator's parameters carry the metadata and the declarations referenced by the
            // method body and XML docs; the custom signature only supplies the parameter names.
            var requiredParameters = PartialMethodCustomization.RenameAndCloneParameters(
                generatedMethod.Signature.Parameters,
                customSignature.Parameters,
                removeDefaults: true);

            var partialSignature = PartialMethodCustomization.BuildPartialSignature(
                customSignature,
                requiredParameters,
                generatedMethod.Signature.ReturnType);

            MethodProvider partialMethod = generatedMethod.BodyExpression != null
                ? new MethodProvider(partialSignature, generatedMethod.BodyExpression, generatedMethod.EnclosingType, generatedMethod.XmlDocs, generatedMethod.Suppressions)
                : new MethodProvider(partialSignature, generatedMethod.BodyStatements ?? MethodBodyStatement.Empty, generatedMethod.EnclosingType, generatedMethod.XmlDocs, generatedMethod.Suppressions);

            return partialMethod;
        }

        internal ConstructorProvider[] FilterCustomizedConstructors(IEnumerable<ConstructorProvider> specConstructors)
        {
            var constructors = new List<ConstructorProvider>();
            foreach (var constructor in specConstructors)
            {
                if (ShouldGenerate(constructor))
                {
                    constructors.Add(constructor);
                }
            }

            return [.. constructors];
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

        protected internal virtual PropertyProvider[] BuildProperties() => [];

        protected internal virtual FieldProvider[] BuildFields() => [];

        protected internal virtual CSharpType[] BuildImplements() => [];

        protected internal virtual MethodProvider[] BuildMethods() => [];

        protected internal virtual ConstructorProvider[] BuildConstructors() => [];
        protected internal virtual SuppressionStatement[] BuildDisabledFileWarnings() => [];

        protected virtual TypeProvider[] BuildNestedTypes() => [];

        protected virtual TypeProvider[] BuildSerializationProviders() => [];

        private IReadOnlyList<TypeProvider> BuildSerializationProvidersInternal()
            => AssignSerializationProviderOwners(BuildSerializationProviders());

        private IReadOnlyList<TypeProvider> AssignSerializationProviderOwners(IEnumerable<TypeProvider> serializationProviders)
        {
            var providers = (serializationProviders as IReadOnlyList<TypeProvider>) ?? [.. serializationProviders];
            foreach (var serializationProvider in providers)
            {
                serializationProvider.SerializationProviderOwner = this;
            }

            return providers;
        }

        protected virtual CSharpType BuildEnumUnderlyingType() => throw new InvalidOperationException("Not an EnumProvider type");

        protected virtual IReadOnlyList<MethodBodyStatement> BuildAttributes() => [];

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
        /// Resets only the cached methods so they are rebuilt on next access.
        /// Use this instead of <see cref="Reset"/> when you need to force a method
        /// rebuild without discarding visitor-applied state on properties, fields,
        /// constructors, or canonical/last-contract views.
        /// </summary>
        public void ResetMethods()
        {
            _methods = null;
        }

        /// <summary>
        /// Resets the type provider to its initial state, clearing all cached properties and fields.
        /// This allows for the type provider to rebuild its state on subsequent calls to its properties.
        /// </summary>
        public virtual void Reset()
        {
            _methods = null;
            _properties = null;
            _fields = null;
            _constructors = null;
            _implements = null;
            _serializationProviders = null;
            _nestedTypes = null;
            _xmlDocs = null;
            PreserveTypeXmlDocs = false;
            _declarationModifiers = null;
            _relativeFilePath = null;
            _declaringTypeName = new(() => GetDeclaringTypeName(DeclaringTypeProvider));
            _customCodeView = new(() => BuildCustomCodeView());
            _canonicalView = new(BuildCanonicalView);
            _lastContractView = new(() => BuildLastContractView());
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
        /// <param name="attributes">The new attributes.</param>
        /// <param name="implements"> The new implemented interfaces.</param>
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
            IEnumerable<CSharpType>? implements = null,
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
                _methods = ApplyCustomizationFilter(methods);
            }
            if (properties != null)
            {
                _properties = ApplyCustomizationFilter(properties);
            }
            if (fields != null)
            {
                _fields = ApplyCustomizationFilter(fields);
            }
            if (constructors != null)
            {
                _constructors = ApplyCustomizationFilter(constructors);
            }
            if (implements != null)
            {
                _implements = (implements as IReadOnlyList<CSharpType>) ?? implements.ToList();
            }
            if (serializations != null)
            {
                _serializationProviders = AssignSerializationProviderOwners(serializations);
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
                _attributes = [.. attributes];
            }

            if (name != null)
            {
                ResetMembersBasedOnIdentityChange(name);
            }

            if (@namespace != null)
            {
                ResetMembersBasedOnIdentityChange(@namespace: @namespace);
            }

            // Rebuild the canonical view
            _canonicalView = new(BuildCanonicalView);
        }

        private void ResetMembersBasedOnIdentityChange(string? name = null, string? @namespace = null)
        {
            _declaringTypeName = new(() => GetDeclaringTypeName(DeclaringTypeProvider));
            // Reset the custom code view to reflect the new namespace
            _customCodeView = new(BuildCustomCodeView(name ?? Type.Name, @namespace ?? Type.Namespace));
            name = _customCodeView.Value?.Name ?? name ?? Type.Name;
            @namespace = _customCodeView.Value?.Type.Namespace ?? @namespace ?? Type.Namespace;
            _lastContractView = new(BuildLastContractView(
                name,
                @namespace));
            // recalculate declaration modifiers and constructors
            _declarationModifiers = null;
            // constructors might change based on declaration modifier changes
            _constructors = null;
            // serialization providers need to reflect the new type name/namespace
            _serializationProviders = null;
            Type.Update(name: name, @namespace: @namespace);
        }

        public IReadOnlyList<EnumTypeMember> EnumValues => _enumValues ??= BuildEnumValues();

        protected virtual IReadOnlyList<EnumTypeMember> BuildEnumValues() => throw new InvalidOperationException("Not an EnumProvider type");

        internal void EnsureBuilt()
        {
            // Build all members without applying customization filtering.
            // Filtering is deferred to CSharpGen.ExecuteAsync after visitors have had a chance
            // to transform members (e.g., merging parameters). This ensures visitors see the
            // full set of members before customization filtering is applied.
            _methods ??= BuildMethods();
            _constructors ??= BuildConstructors();
            _properties ??= BuildProperties();
            _fields ??= BuildFields();
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

        internal void ProcessTypeForBackCompatibility()
        {
            var hasMethods = LastContractView?.Methods != null && LastContractView.Methods.Count > 0;
            var hasConstructors = LastContractView?.Constructors != null && LastContractView.Constructors.Count > 0;
            var hasAttributes = LastContractView?.Attributes is { Count: > 0 };

            IReadOnlyList<EnumTypeMember>? updatedEnumValues = null;
            IEnumerable<FieldProvider>? newFields = null;
            if (this is EnumProvider)
            {
                var hasFields = LastContractView?.Fields != null && LastContractView.Fields.Count > 0;
                if (hasFields)
                {
                    var newEnumValues = BuildEnumValuesForBackCompatibility(EnumValues);
                    if (newEnumValues != null)
                    {
                        // Filter the back-compat fields up front so we can keep _enumValues in sync
                        // with the surviving fields (Update will apply the same filter when assigning
                        // _fields, but it doesn't know about the EnumValues correspondence).
                        var filteredFields = ApplyCustomizationFilter(newEnumValues.Select(v => v.Field));

                        if (filteredFields.Count != newEnumValues.Count)
                        {
                            var allowedFields = new HashSet<FieldProvider>(filteredFields);
                            updatedEnumValues = [.. newEnumValues.Where(v => allowedFields.Contains(v.Field))];
                        }
                        else
                        {
                            updatedEnumValues = newEnumValues;
                        }

                        newFields = filteredFields;
                    }
                }
            }

            var newMethods = hasMethods ? BuildMethodsForBackCompatibility(Methods) : null;
            var newConstructors = hasConstructors ? BuildConstructorsForBackCompatibility(Constructors) : null;

            IReadOnlyList<AttributeStatement>? newAttributes = null;
            if (hasAttributes)
            {
                var backCompatAttributes = BuildAttributesForBackCompatibility(Attributes);
                if (backCompatAttributes.Count != Attributes.Count)
                {
                    newAttributes = backCompatAttributes;
                }
            }

            if (newFields != null || newMethods != null || newConstructors != null || newAttributes != null)
            {
                if (updatedEnumValues != null)
                {
                    _enumValues = updatedEnumValues;
                }

                // Back-compatibility processing intentionally runs after the library visitor pass so
                // that the contract comparison uses the final, post-visitor member signatures (otherwise
                // we could incorrectly decide whether a back-compat member is needed). As a result, any
                // members synthesized above (e.g. back-compat overloads) have not been visited yet. Run
                // only those newly-added members through the visitors now so visitor transforms apply to
                // them as well, without re-visiting members that were already visited during the main pass.
                if (newMethods != null)
                {
                    newMethods = VisitNewMembers(newMethods, Methods, static (member, visitor) => member.Accept(visitor));
                }
                if (newConstructors != null)
                {
                    newConstructors = VisitNewMembers(newConstructors, Constructors, static (member, visitor) => visitor.VisitConstructor(member));
                }
                if (newFields != null)
                {
                    newFields = VisitNewMembers(newFields, Fields, static (member, visitor) => visitor.VisitField(member));
                }

                Update(fields: newFields, methods: newMethods, constructors: newConstructors, attributes: newAttributes);
            }
        }

        // Runs newly-added back-compatibility members through every registered visitor while leaving
        // members that were already visited during the main visitor pass untouched. Membership in the
        // already-visited set is determined by reference identity against the pre-Update collection.
        private static IReadOnlyList<T> VisitNewMembers<T>(
            IEnumerable<T> allMembers,
            IReadOnlyList<T> alreadyVisited,
            Func<T, LibraryVisitor, T?> visit)
            where T : class
        {
            var visitors = CodeModelGenerator.Instance.Visitors;
            var materialized = allMembers as IReadOnlyList<T> ?? [.. allMembers];
            if (visitors.Count == 0)
            {
                return materialized;
            }

            var alreadyVisitedSet = new HashSet<T>(alreadyVisited, ReferenceEqualityComparer.Instance);
            var result = new List<T>(materialized.Count);
            foreach (var member in materialized)
            {
                if (alreadyVisitedSet.Contains(member))
                {
                    result.Add(member);
                    continue;
                }

                T? visited = member;
                foreach (var visitor in visitors)
                {
                    visited = visit(visited, visitor);
                    if (visited == null)
                    {
                        break;
                    }
                }

                if (visited != null)
                {
                    result.Add(visited);
                }
            }

            return result;
        }

        protected internal virtual IReadOnlyList<EnumTypeMember>? BuildEnumValuesForBackCompatibility(IReadOnlyList<EnumTypeMember> originalEnumValues)
            => null;

        /// <summary>
        /// Returns this type's methods with backward compatibility applied against
        /// <see cref="LastContractView"/>. The default implementation restores the previous
        /// parameter order on a current method when it matches a last-contract method by name and
        /// return type with the same parameter set but in a different order. Reordering is done in
        /// place, so a method's body (which references its parameters by object) remains valid.
        /// Override and call <c>base</c> to extend this behavior; override without calling
        /// <c>base</c> to replace it.
        /// </summary>
        protected internal virtual IReadOnlyList<MethodProvider> BuildMethodsForBackCompatibility(IEnumerable<MethodProvider> originalMethods)
        {
            var methods = new List<MethodProvider>(originalMethods);

            if (LastContractView?.Methods is not { Count: > 0 } previousMethods)
            {
                return methods;
            }

            var currentMethodSignatures = BuildCurrentMethodSignatureMap(methods);

            foreach (var previousMethod in previousMethods)
            {
                if (!BackCompatHelper.ShouldApplyMethodBackCompatibility(previousMethod.Signature, currentMethodSignatures)
                    || BackCompatHelper.IsMethodRemovalAcceptedInBaseline(this, previousMethod.Signature))
                {
                    continue;
                }

                var methodToReorder = BackCompatHelper.FindMethodWithSameParametersDifferentOrder(previousMethod.Signature, currentMethodSignatures);
                if (methodToReorder != null && BackCompatHelper.TryRestorePreviousParameterOrder(methodToReorder, previousMethod.Signature))
                {
                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"Reordered parameters of '{Name}.{methodToReorder.Signature.Name}' to match last contract.",
                        BackCompatibilityChangeCategory.MethodParameterReordering);
                }
            }

            BackCompatHelper.RestorePreviousParameterNames(this, methods);
            BackCompatHelper.AddOverloadsForNewOptionalParameters(this, methods);

            return methods;
        }

        /// <summary>
        /// Builds a lookup of the type's current method signatures (including custom code methods)
        /// used to match against last-contract methods.
        /// </summary>
        private Dictionary<MethodSignature, MethodProvider> BuildCurrentMethodSignatureMap(IEnumerable<MethodProvider> methods)
        {
            var allMethods = CustomCodeView?.Methods != null
                ? methods.Concat(CustomCodeView.Methods)
                : methods;

            var result = new Dictionary<MethodSignature, MethodProvider>(MethodSignature.MethodSignatureComparer);
            foreach (var method in allMethods)
            {
                result.TryAdd(method.Signature, method);
            }
            return result;
        }

        /// <summary>
        /// Returns this type's constructors with backward compatibility applied against
        /// <see cref="LastContractView"/>. The default implementation preserves a previously-published
        /// public constructor on an abstract base type: when the current generation would emit a
        /// <c>private protected</c> constructor whose parameters match a <c>public</c> constructor in
        /// the last contract, the modifier is promoted back to <c>public</c>. Override and call
        /// <c>base</c> to extend this behavior.
        /// </summary>
        protected internal virtual IReadOnlyList<ConstructorProvider> BuildConstructorsForBackCompatibility(IEnumerable<ConstructorProvider> originalConstructors)
        {
            // Only handle the case of changing modifiers on abstract base types.
            if (!DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract))
            {
                return [.. originalConstructors];
            }

            if (LastContractView?.Constructors == null || LastContractView.Constructors.Count == 0)
            {
                return [.. originalConstructors];
            }

            List<ConstructorProvider> constructors = [.. originalConstructors];

            // Check if the last contract had a public constructor with matching parameters
            foreach (var previousConstructor in LastContractView.Constructors)
            {
                if (!previousConstructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public))
                {
                    continue;
                }

                // Find a matching constructor in the current version by parameter signature
                for (int i = 0; i < constructors.Count; i++)
                {
                    var currentConstructor = constructors[i];
                    if (!currentConstructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Private) ||
                        !currentConstructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected))
                    {
                        continue;
                    }

                    // Check if parameters match (same count and types)
                    if (BackCompatHelper.ParametersMatch(currentConstructor.Signature.Parameters, previousConstructor.Signature.Parameters))
                    {
                        // Change the modifier from private protected to public
                        currentConstructor.Signature.Update(modifiers: MethodSignatureModifiers.Public);
                        CodeModelGenerator.Instance.Emitter.Debug(
                            $"Promoted constructor '{Name}({string.Join(", ", currentConstructor.Signature.Parameters.Select(p => p.Type.ToString()))})' from 'private protected' to 'public' to match last contract.",
                            BackCompatibilityChangeCategory.ConstructorModifierPreserved);
                    }
                }
            }

            return [.. constructors];
        }

        /// <summary>
        /// Returns the generated type attributes to use after back-compat processing.
        /// The base implementation does not restore any last-contract type attributes.
        /// Providers that own specific restorable attributes can override this method.
        /// </summary>
        protected internal virtual IReadOnlyList<AttributeStatement> BuildAttributesForBackCompatibility(IEnumerable<AttributeStatement> originalAttributes)
        {
            return originalAttributes as IReadOnlyList<AttributeStatement> ?? [.. originalAttributes];
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
                if (MethodSignatureBase.SignatureComparer.Equals(customConstructor.Signature, constructor.Signature))
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
                // Partial method declarations are handled in FilterCustomizedMethods and
                // should not suppress the generated method.
                if (customMethod.IsPartialMethod)
                {
                    continue;
                }

                if (MethodSignatureBase.SignatureComparer.Equals(customMethod.Signature, method.Signature))
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

        /// <summary>
        /// Determines whether the method with the given <paramref name="signature"/> on <paramref name="enclosingType"/>
        /// matches the given <c>CodeGenSuppress</c> <paramref name="attribute"/>.
        /// </summary>
        internal static bool IsMatch(TypeProvider enclosingType, MethodSignatureBase signature, AttributeData attribute)
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
                parameterTypes = attribute.ConstructorArguments[1..].Select(a => (ISymbol?)a.Value).ToArray();
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
                var signatureParamType = signature.Parameters[i].Type;

                // If the parameter type is a generic type alias, resolve to the constraint type for matching.
                if (signature is MethodSignature methodSig)
                {
                    signatureParamType = ResolveGenericConstraintType(signatureParamType, methodSig);
                }

                // we ignore nullability for reference types as these are generated the same regardless of nullability
                if (!IsNameMatch(parameterType, signatureParamType) ||
                    (parameterType.IsValueType && parameterType.IsNullable != signatureParamType.IsNullable))
                {
                    return false;
                }
            }

            return true;
        }

        private static CSharpType ResolveGenericConstraintType(CSharpType paramType, MethodSignature methodSignature)
        {
            if (methodSignature.GenericArguments is null || methodSignature.GenericParameterConstraints is null)
            {
                return paramType;
            }

            foreach (var genericArg in methodSignature.GenericArguments)
            {
                if (genericArg.Name != paramType.Name)
                {
                    continue;
                }

                foreach (var whereExpr in methodSignature.GenericParameterConstraints)
                {
                    if (whereExpr.Type.Name != paramType.Name)
                    {
                        continue;
                    }

                    foreach (var constraint in whereExpr.Constraints)
                    {
                        if (constraint is TypeReferenceExpression { Type: { } constraintType })
                        {
                            return constraintType;
                        }
                    }
                }
            }

            return paramType;
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

        internal IEnumerable<AttributeData> GetMemberSuppressionAttributes()
            => CustomCodeView?.Attributes.Where(a => a.Data?.AttributeClass?.Name == CodeGenAttributes.CodeGenSuppressAttributeName).
                Select(a => a.Data!).ToList() ?? [];
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class ModelProvider : TypeProvider
    {
        private const string AdditionalBinaryDataPropsFieldDescription = "Keeps track of any properties unknown to the library.";
        private readonly InputModelType _inputModel;
        // Note the description cannot be built from the constructor as it would lead to a circular dependency between the base
        // and derived models resulting in a stack overflow.
        protected override FormattableString BuildDescription()
        {
            var description = DocHelpers.GetFormattableDescription(_inputModel.Summary, _inputModel.Doc) ??
                              $"The {Name}.";
            if (_isDiscriminatedBaseType)
            {
                _derivedModels = BuildDerivedModels();
                var publicDerivedModels = _derivedModels.Where(m => m.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public)).ToList();
                var derivedClassesDescription = DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                    ? "Please note this is the abstract base class. The derived classes available for instantiation are: "
                    : "Please note this is the base class. The derived classes available for instantiation are: ";
                bool addComma = publicDerivedModels.Count > 2;
                for (int i = 0; i < publicDerivedModels.Count; i++)
                {
                    if (i == publicDerivedModels.Count - 1)
                    {
                        derivedClassesDescription += $"{(i > 0 ? "and " : "")}<see cref=\"{publicDerivedModels[i].Type.FullyQualifiedName}\"/>.";
                    }
                    else
                    {
                        derivedClassesDescription += $"<see cref=\"{publicDerivedModels[i].Type.FullyQualifiedName}\"/>{(addComma ? ", " : " ")}";
                    }
                }

                description = $"{description}\n{derivedClassesDescription}";
            }

            return description;
        }

        private bool? _isMultiLevelDiscriminator;
        private bool IsMultiLevelDiscriminator => _isMultiLevelDiscriminator ??= ComputeIsMultiLevelDiscriminator();

        private readonly CSharpType _additionalBinaryDataPropsFieldType = typeof(IDictionary<string, BinaryData>);
        private readonly CSharpType _additionalObjectPropsFieldType = typeof(IDictionary<string, object>);
        private readonly Type _additionalPropsUnknownType = typeof(BinaryData);
        private Lazy<bool> _useObjectAdditionalProperties;
        private FieldProvider? _rawDataField;
        private bool _buildingRawDataField;
        private List<FieldProvider>? _additionalPropertyFields;
        private List<PropertyProvider>? _additionalPropertyProperties;
        private ModelProvider? _baseModelProvider;
        private ConstructorProvider? _fullConstructor;
        internal PropertyProvider? DiscriminatorProperty { get; private set; }

        private readonly bool _isDiscriminatedBaseType;

        private ValueExpression DiscriminatorLiteral => Literal(_inputModel.DiscriminatorValue ?? "");

        public ModelProvider(InputModelType inputModel) : base(inputModel)
        {
            _inputModel = inputModel;
            _isDiscriminatedBaseType = inputModel.DiscriminatorProperty is not null && inputModel.DiscriminatorValue is null;
            _useObjectAdditionalProperties = new Lazy<bool>(ShouldUseObjectAdditionalProperties);
        }

        public bool IsUnknownDiscriminatorModel => _inputModel.IsUnknownDiscriminatorModel;

        // Whether this model is reused from another shipped package (linked via an `external` block)
        // rather than emitted by this library. Such a type's constructor surface is owned elsewhere.
        internal bool IsExternal => _inputModel.External is not null;

        public string? DiscriminatorValue => _inputModel.DiscriminatorValue;

        private ValueExpression? _discriminatorValueExpression;
        public ValueExpression? DiscriminatorValueExpression =>
            _inputModel.BaseModel is not null
                ? _discriminatorValueExpression ??= EnsureDiscriminatorValueExpression()
                : null;

        private IReadOnlyList<ModelProvider>? _derivedModels;
        public IReadOnlyList<ModelProvider> DerivedModels => _derivedModels ??= BuildDerivedModels();

        private IDictionary<string, CSharpType> LastContractPropertiesMap
            => _lastContractPropertiesMap ??= LastContractView?.Properties
                .Where(p => MethodSignatureHelper.IsPublicApi(p.Modifiers))
                .ToDictionary(p => p.Name, p => p.Type) ?? [];

        private IDictionary<string, CSharpType>? _lastContractPropertiesMap;

        private IReadOnlyList<ModelProvider> BuildDerivedModels()
        {
            var derivedModels = new HashSet<ModelProvider>(_inputModel.DiscriminatedSubtypes.Count + _inputModel.DerivedModels.Count);
            // add discriminated subtypes
            foreach (var subtype in _inputModel.DiscriminatedSubtypes)
            {
                var model = CodeModelGenerator.Instance.TypeFactory.CreateModel(subtype.Value);
                if (model != null)
                {
                    derivedModels.Add(model);
                }
            }

            // add derived models
            foreach (var derivedModel in _inputModel.DerivedModels)
            {
                var model = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedModel);
                if (model != null)
                {
                    derivedModels.Add(model);
                }
            }

            return [.. derivedModels];
        }
        internal override TypeProvider? BaseTypeProvider => _baseTypeProvider ??= BuildBaseTypeProvider();
        private TypeProvider? _baseTypeProvider;

        private TypeProvider? BuildBaseTypeProvider()
        {
            // First check if there's a generated base model.
            if (BaseModelProvider != null)
            {
                return BaseModelProvider;
            }

            var baseType = BaseType;
            if (baseType is null || string.IsNullOrEmpty(baseType.Namespace))
            {
                return null;
            }

            // A base preserved from the last contract can be a framework or external type, just like
            // a custom base. Resolve it from the current compilation rather than retaining a symbol
            // that exists only in the baseline assembly.
            if (CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(baseType, out var existingProvider))
            {
                return existingProvider;
            }

            var baseTypeProvider = CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCurrentCompilation(
                GetMetadataNamespace(baseType),
                GetMetadataSimpleName(baseType),
                baseType.DeclaringType?.ClrMetadataName,
                includeReferencedAssemblies: true);

            if (baseTypeProvider != null)
            {
                CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[baseType] = baseTypeProvider;
                return baseTypeProvider;
            }

            // Preserve the existing fallback for unresolved custom base types. Last-contract bases
            // are selected only after they have been resolved against the current build.
            if (CustomCodeView?.BaseType != null)
            {
                var systemObjectTypeProvider = new SystemObjectTypeProvider(baseType);
                CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[baseType] = systemObjectTypeProvider;
                return systemObjectTypeProvider;
            }

            return null;
        }

        public ModelProvider? BaseModelProvider
            => _baseModelProvider ??= BuildBaseModelProvider();

        /// <inheritdoc/>
        public override void Reset()
        {
            base.Reset();
            _rawDataField = null;
            _additionalPropertyFields = null;
            _additionalPropertyProperties = null;
            _isMultiLevelDiscriminator = null;
        }

        private protected override void ResetConstructors()
        {
            base.ResetConstructors();
            _fullConstructor = null;
        }

        protected FieldProvider? RawDataField
        {
            get
            {
                if (_rawDataField is not null)
                {
                    return _rawDataField;
                }

                if (_buildingRawDataField)
                {
                    // BuildRawDataField walks base models and can re-enter this property when custom
                    // base models form a cycle.
                    return null;
                }

                _buildingRawDataField = true;
                try
                {
                    return _rawDataField = BuildRawDataField();
                }
                finally
                {
                    _buildingRawDataField = false;
                }
            }
        }
        protected virtual bool ShouldSkipDerivedModelProperties => false;
        private protected virtual bool ShouldUseFullConstructorInDerivedTypes => true;
        /// <summary>
        /// Gets whether derived models should skip overriding serialization methods from this base model.
        /// </summary>
        public virtual bool ShouldSkipDerivedSerializationMethodOverrides => false;
        private List<FieldProvider> AdditionalPropertyFields => _additionalPropertyFields ??= BuildAdditionalPropertyFields();
        private List<PropertyProvider> AdditionalPropertyProperties => _additionalPropertyProperties ??= BuildAdditionalPropertyProperties();
        protected internal bool SupportsBinaryDataAdditionalProperties => AdditionalPropertyProperties.Any(p =>
            p.Type.ElementType.Equals(_additionalPropsUnknownType) ||
            (p.Type.ElementType.IsFrameworkType && p.Type.ElementType.FrameworkType == typeof(object)));
        /// <summary>
        /// The constructor that takes every serializable property.
        /// </summary>
        public ConstructorProvider FullConstructor => _fullConstructor ??= BuildFullConstructor();

        protected override string BuildNamespace() => string.IsNullOrEmpty(_inputModel.Namespace) ?
            // TODO remove null check once https://github.com/Azure/typespec-azure/issues/2209 is fixed.
            CodeModelGenerator.Instance.TypeFactory.PrimaryNamespace :
            CodeModelGenerator.Instance.TypeFactory.GetCleanNameSpace(_inputModel.Namespace);

        protected override CSharpType? BuildBaseType()
        {
            var currentBase = BuildCurrentBaseType();
            return BuildBaseTypeForBackCompatibility(currentBase);
        }

        /// <summary>
        /// Returns the model base type after applying backward compatibility against <see cref="LastContractView"/>.
        /// The default implementation conservatively restores a resolvable previously-published base type.
        /// Override and call <c>base</c> to extend this behavior, or override without calling <c>base</c> to replace it.
        /// This hook runs while the base type is being built, before model members and serialization are materialized.
        /// </summary>
        /// <param name="currentBase">The base type selected from custom code or the current input model.</param>
        protected virtual CSharpType? BuildBaseTypeForBackCompatibility(CSharpType? currentBase)
        {
            var previousBase = LastContractView?.BaseType;
            if (previousBase is null || IsInBaseTypeHierarchy(currentBase, previousBase))
            {
                return currentBase;
            }

            // A generated partial cannot replace a different base declared by custom code: all partial
            // declarations must specify the same base class. Keep the custom base authoritative and
            // report that the previous inheritance relationship could not be restored.
            if (CustomCodeView?.BaseType is not null)
            {
                ReportIncompatibleBackcompatBaseType(
                    previousBase,
                    $"custom code declares base type '{currentBase?.FullyQualifiedName}'");
                return currentBase;
            }

            if (!TryResolveTypeInCurrentBuild(previousBase, out var resolvedPreviousBaseProvider))
            {
                CodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                    DiagnosticCodes.UnavailableBackcompatType,
                    $"Could not preserve base type '{previousBase.FullyQualifiedName}' on model '{BuildNamespace()}.{BuildName()}' because the previous base is unavailable or does not expose an accessible parameterless constructor in the current build.");
                return currentBase;
            }

            if (HasDirectPropertyNameCollision(resolvedPreviousBaseProvider))
            {
                ReportIncompatibleBackcompatBaseType(
                    previousBase,
                    "the current model directly declares a property from the previous base hierarchy");
                return currentBase;
            }

            var resolvedPreviousBase = GetResolvedBaseType(previousBase, resolvedPreviousBaseProvider);
            CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[resolvedPreviousBase] = resolvedPreviousBaseProvider;
            CodeModelGenerator.Instance.Emitter.Info(
                $"Changed base type of model '{BuildName()}' from '{currentBase?.FullyQualifiedName ?? "object"}' to '{resolvedPreviousBase.FullyQualifiedName}' to match the last contract.",
                BackCompatibilityChangeCategory.ModelBaseTypePreserved);
            return resolvedPreviousBase;
        }

        /// <summary>
        /// Reports that a last-contract base type cannot be restored without making the current model invalid.
        /// </summary>
        /// <param name="previousBase">The base type from the last contract.</param>
        /// <param name="reason">The reason the base type cannot be restored.</param>
        private void ReportIncompatibleBackcompatBaseType(CSharpType previousBase, string reason)
        {
            CodeModelGenerator.Instance.Emitter.ReportDiagnostic(
                DiagnosticCodes.IncompatibleBackcompatBaseType,
                $"Could not preserve base type '{previousBase.FullyQualifiedName}' on model '{BuildNamespace()}.{BuildName()}' because {reason}.");
        }

        private CSharpType? BuildCurrentBaseType()
        {
            if (CustomCodeView?.BaseType != null)
            {
                var customBase = CustomCodeView.BaseType;

                // If the custom base type doesn't have a resolved namespace, then try to resolve it from the input model map.
                // This will happen if a model is customized to inherit from another generated model, but that generated model
                // was not also defined in custom code so Roslyn does not recognize it.
                if (string.IsNullOrEmpty(customBase.Namespace))
                {
                    if (CodeModelGenerator.Instance.TypeFactory.TypeProvidersByName.TryGetValue(
                            customBase.Name, out var resolvedProvider) &&
                        resolvedProvider is ModelProvider resolvedModel)
                    {
                        return resolvedModel.Type;
                    }

                    // Force-create all input models so that visitors run (which may rename models
                    // via TypeProvider.Update) and TypeProvidersByName is fully populated.
                    foreach (var model in CodeModelGenerator.Instance.InputLibrary.InputNamespace.Models)
                    {
                        CodeModelGenerator.Instance.TypeFactory.CreateModel(model);
                    }

                    if (CodeModelGenerator.Instance.TypeFactory.TypeProvidersByName.TryGetValue(
                            customBase.Name, out resolvedProvider) &&
                        resolvedProvider is ModelProvider resolvedAfterCreate)
                    {
                        return resolvedAfterCreate.Type;
                    }
                }

                if (CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(
                        customBase, out var mappedProvider) &&
                    mappedProvider is ModelProvider mappedModel)
                {
                    return mappedModel.Type;
                }

                return customBase;
            }

            return _inputModel.BaseModel is null
                ? null
                : CodeModelGenerator.Instance.TypeFactory.CreateModel(_inputModel.BaseModel)?.Type;
        }

        protected static bool IsInBaseTypeHierarchy(CSharpType? currentBase, CSharpType previousBase)
        {
            var visited = new HashSet<string>(StringComparer.Ordinal);
            for (var type = currentBase; type is not null && visited.Add(GetMetadataTypeIdentity(type)); type = type.BaseType)
            {
                if (AreMetadataTypesEqual(type, previousBase))
                {
                    return true;
                }
            }

            return false;
        }

        private bool HasDirectPropertyNameCollision(TypeProvider previousBase)
        {
            var enclosingTypeName = BuildName();
            var directPropertyNames = _inputModel.Properties
                .Select(property => GetGeneratedPropertyName(property, enclosingTypeName))
                .ToHashSet(StringComparer.Ordinal);
            if (directPropertyNames.Count == 0)
            {
                return false;
            }

            var visited = new HashSet<TypeProvider>();
            for (TypeProvider? provider = previousBase; provider is not null && visited.Add(provider); provider = provider.BaseTypeProvider)
            {
                if (provider.Properties.Any(property =>
                    IsInheritedProperty(property) && directPropertyNames.Contains(property.Name)))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool IsInheritedProperty(PropertyProvider property)
            => !property.Modifiers.HasFlag(MethodSignatureModifiers.Private) ||
                property.Modifiers.HasFlag(MethodSignatureModifiers.Protected);

        private string GetGeneratedPropertyName(InputModelProperty property, string enclosingTypeName)
        {
            var propertyType = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(property.Type);
            return propertyType is null
                ? PropertyProvider.AvoidPropertyNameCollision(
                    property.IsExactName
                        ? property.Name
                        : property.Name.ToIdentifierName().NormalizeCSharpAcronyms(property.Type.IsDateTimeInputType()),
                    enclosingTypeName)
                : PropertyProvider.GetPropertyName(property, propertyType, this, enclosingTypeName);
        }

        private bool TryResolveTypeInCurrentBuild(CSharpType type, [NotNullWhen(true)] out TypeProvider? resolvedProvider)
        {
            foreach (var provider in CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.Values)
            {
                if (provider is not null &&
                    AreMetadataTypesEqual(provider.Type, type) &&
                    TryUseProviderAsBase(provider, out resolvedProvider))
                {
                    return true;
                }
            }

            // The previous base may occur later in input order. Force-create all input models before
            // deciding that no generated provider is available.
            foreach (var model in CodeModelGenerator.Instance.InputLibrary.InputNamespace.Models)
            {
                CodeModelGenerator.Instance.TypeFactory.CreateModel(model);
            }

            foreach (var provider in CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.Values)
            {
                if (provider is not null &&
                    AreMetadataTypesEqual(provider.Type, type) &&
                    TryUseProviderAsBase(provider, out resolvedProvider))
                {
                    return true;
                }
            }

            var currentProvider = CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCurrentCompilation(
                GetMetadataNamespace(type),
                GetMetadataSimpleName(type),
                type.DeclaringType?.ClrMetadataName,
                includeReferencedAssemblies: true);
            if (currentProvider is null)
            {
                resolvedProvider = null;
                return false;
            }

            CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[currentProvider.Type] = currentProvider;
            return TryUseProviderAsBase(currentProvider, out resolvedProvider);
        }

        private static string GetMetadataSimpleName(CSharpType type)
        {
            var metadataName = type.ClrMetadataName;
            var separatorIndex = metadataName.LastIndexOf('+');
            return separatorIndex < 0 ? metadataName : metadataName[(separatorIndex + 1)..];
        }

        private static CSharpType GetResolvedBaseType(CSharpType requestedType, TypeProvider resolvedProvider)
        {
            var resolvedType = resolvedProvider.Type;
            return resolvedProvider is NamedTypeSymbolProvider
                ? ApplyTypeConstruction(resolvedType, requestedType)
                : resolvedType;
        }

        private static CSharpType ApplyTypeConstruction(CSharpType resolvedType, CSharpType requestedType)
        {
            var declaringType = resolvedType.DeclaringType;
            if (declaringType is not null && requestedType.DeclaringType is not null)
            {
                declaringType = ApplyTypeConstruction(declaringType, requestedType.DeclaringType);
            }

            var arguments = resolvedType.Arguments.Count == requestedType.Arguments.Count
                ? requestedType.Arguments
                : resolvedType.Arguments;
            return new CSharpType(
                resolvedType.Name,
                resolvedType.Namespace,
                resolvedType.IsValueType,
                resolvedType.IsNullable,
                declaringType,
                arguments,
                resolvedType.IsPublic,
                resolvedType.IsStruct,
                resolvedType.BaseType);
        }

        private static bool AreMetadataTypesEqual(CSharpType left, CSharpType right)
            => string.Equals(
                GetMetadataTypeIdentity(left),
                GetMetadataTypeIdentity(right),
                StringComparison.Ordinal);

        private static string GetMetadataTypeIdentity(CSharpType type)
        {
            var typeArguments = type.Arguments.Count == 0
                ? string.Empty
                : $"[{string.Join(",", type.Arguments.Select(GetMetadataTypeIdentity))}]";
            var declaringType = type.DeclaringType is null
                ? string.Empty
                : $"@{GetMetadataTypeIdentity(type.DeclaringType)}";
            return $"{GetMetadataNamespace(type)}.{type.ClrMetadataName}{typeArguments}{declaringType}";
        }

        private static string GetMetadataNamespace(CSharpType type)
        {
            while (type.DeclaringType is not null)
            {
                type = type.DeclaringType;
            }

            return type.Namespace;
        }

        private static bool TryUseProviderAsBase(TypeProvider provider, [NotNullWhen(true)] out TypeProvider? resolvedProvider)
        {
            // Generated model bases already participate in ModelProvider's constructor chaining. A
            // symbol-backed base does not, so generated constructors can only rely on an accessible
            // parameterless constructor (explicit or implicit).
            if (provider is ModelProvider ||
                provider is NamedTypeSymbolProvider { HasAccessibleParameterlessConstructor: true } ||
                provider is not NamedTypeSymbolProvider && provider.Constructors.Any(c =>
                    c.Signature.Parameters.Count == 0 &&
                    MethodSignatureHelper.IsPublicApi(c.Signature.Modifiers)))
            {
                resolvedProvider = provider;
                return true;
            }

            resolvedProvider = null;
            return false;
        }

        protected override TypeProvider[] BuildSerializationProviders()
        {
            return [.. CodeModelGenerator.Instance.TypeFactory.CreateSerializations(_inputModel, this)];
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");

        protected override string BuildName()
        {
            if (_inputModel.IsExactName)
            {
                return _inputModel.Name;
            }

            return NormalizeTypeNameForNewContract(_inputModel.Name.ToIdentifierName());
        }

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
        {
            var customCodeModifiers = CustomCodeView?.DeclarationModifiers ?? TypeSignatureModifiers.None;
            var isStruct = false;
            // the information of if this model should be a struct comes from two sources:
            // 1. the customied code
            // 2. the spec
            if (customCodeModifiers.HasFlag(TypeSignatureModifiers.Struct))
            {
                isStruct = true;
            }
            if (_inputModel.ModelAsStruct)
            {
                isStruct = true;
            }
            var declarationModifiers = TypeSignatureModifiers.Partial;

            if (isStruct)
            {
                declarationModifiers |= TypeSignatureModifiers.ReadOnly | TypeSignatureModifiers.Struct;
            }
            else
            {
                declarationModifiers |= TypeSignatureModifiers.Class;
            }

            if (customCodeModifiers != TypeSignatureModifiers.None)
            {
                declarationModifiers |= GetAccessibilityModifiers(customCodeModifiers);
            }
            else if (_inputModel.Access == "internal")
            {
                declarationModifiers |= TypeSignatureModifiers.Internal;
            }

            if (_isDiscriminatedBaseType)
            {
                declarationModifiers |= TypeSignatureModifiers.Abstract;
            }

            return declarationModifiers;

            static TypeSignatureModifiers GetAccessibilityModifiers(TypeSignatureModifiers modifiers)
            {
                return modifiers & (TypeSignatureModifiers.Public | TypeSignatureModifiers.Internal | TypeSignatureModifiers.Protected | TypeSignatureModifiers.Private);
            }
        }

        /// <summary>
        /// Builds the fields for the model by adding the raw data field.
        /// </summary>
        /// <returns>The list of <see cref="FieldProvider"/> for the model.</returns>
        protected internal override FieldProvider[] BuildFields()
        {
            List<FieldProvider> fields = [];
            if (RawDataField != null)
            {
                fields.Add(RawDataField);
            }

            // add fields for additional properties
            if (AdditionalPropertyFields.Count > 0)
            {
                fields.AddRange(AdditionalPropertyFields);
            }

            foreach (var property in _inputModel.Properties)
            {
                if (IsDiscriminator(property))
                {
                    continue;
                }

                var derivedProperty = InputDerivedProperties.FirstOrDefault(p => p.Value.ContainsKey(property.Name)).Value?[property.Name];
                if (derivedProperty is not null)
                {
                    if (!DomainEqual(property, derivedProperty))
                    {
                        fields.Add(new FieldProvider(
                            FieldModifiers.Private | FieldModifiers.Protected,
                            CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(property.Type)!,
                            $"_{property.Name.ToVariableName()}",
                            this));
                    }
                }
            }
            return [.. fields];
        }

        private static bool IsDiscriminator(InputProperty property)
        {
            return property is InputModelProperty modelProperty && modelProperty.IsDiscriminator;
        }

        protected virtual ModelProvider? BuildBaseModelProvider()
        {
            var baseType = BaseType;
            if (baseType is null)
            {
                return null;
            }

            if (CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(baseType, out var provider)
                && provider is ModelProvider modelProvider)
            {
                return modelProvider;
            }

            if (CustomCodeView?.BaseType is null && _inputModel.BaseModel is not null)
            {
                var inputBaseModelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(_inputModel.BaseModel);
                if (inputBaseModelProvider is not null && inputBaseModelProvider.Type.AreNamesEqual(baseType))
                {
                    CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[baseType] = inputBaseModelProvider;
                    return inputBaseModelProvider;
                }
            }

            if (CustomCodeView?.BaseType != null && !string.IsNullOrEmpty(baseType.Namespace))
            {
                foreach (var (mapKey, mapValue) in CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap)
                {
                    if (mapValue is ModelProvider model
                        && mapKey.Name == baseType.Name
                        && mapKey.Namespace == baseType.Namespace)
                    {
                        CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[baseType] = model;
                        return model;
                    }
                }
            }

            return null;
        }

        private List<FieldProvider> BuildAdditionalPropertyFields()
        {
            var fields = new List<FieldProvider>();

            if (_inputModel.AdditionalProperties != null)
            {
                var valueType = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(_inputModel.AdditionalProperties);
                if (valueType != null)
                {
                    if (valueType.IsUnion)
                    {
                        foreach (var unionType in valueType.UnionItemTypes)
                        {
                            AddFieldForAdditionalProperties(unionType, fields, true);
                        }
                    }
                    else
                    {
                        AddFieldForAdditionalProperties(valueType, fields, false);
                    }
                }
            }

            return fields;
        }

        private void AddFieldForAdditionalProperties(CSharpType valueType, List<FieldProvider> fields, bool isUnionType)
        {
            var originalType = new CSharpType(typeof(IDictionary<,>), typeof(string), valueType);
            var additionalPropsType = ReplaceUnverifiableType(originalType);

            if ((isUnionType && additionalPropsType.ContainsBinaryData)
                || additionalPropsType.Equals(_additionalBinaryDataPropsFieldType))
            {
                return;
            }

            fields.Add(new(
                FieldModifiers.Private,
                additionalPropsType,
                BuildAdditionalTypePropertiesFieldName(additionalPropsType.ElementType),
                this));
        }

        private List<PropertyProvider> BuildAdditionalPropertyProperties()
        {
            var additionalPropertiesFieldCount = AdditionalPropertyFields.Count;
            var properties = new List<PropertyProvider>(additionalPropertiesFieldCount + 1);
            bool containsAdditionalTypeProperties = false;

            for (int i = 0; i < additionalPropertiesFieldCount; i++)
            {
                var field = AdditionalPropertyFields[i];
                var propertyType = !_inputModel.Usage.HasFlag(InputModelTypeUsage.Input) ? field.Type.OutputType : field.Type;
                var assignment = propertyType.IsReadOnlyDictionary
                   ? new ExpressionPropertyBody(New.ReadOnlyDictionary(propertyType.Arguments[0], propertyType.ElementType, field))
                   : new ExpressionPropertyBody(field);

                properties.Add(new(
                    null,
                    MethodSignatureModifiers.Public,
                    propertyType,
                    i == 0 ? AdditionalPropertiesHelper.DefaultAdditionalPropertiesPropertyName : field.Name.ToIdentifierName(),
                    assignment,
                    this)
                {
                    BackingField = field,
                    IsAdditionalProperties = true
                });
                containsAdditionalTypeProperties = true;
            }

            if (RawDataField == null || _inputModel.AdditionalProperties == null)
            {
                return properties;
            }

            var apValueType = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(_inputModel.AdditionalProperties);
            if (apValueType == null)
            {
                return properties;
            }

            // add public property for raw binary data if the model supports additional binary data properties
            var originalType = new CSharpType(typeof(IDictionary<,>), typeof(string), apValueType);
            var additionalPropsType = ReplaceUnverifiableType(originalType);
            var shouldAddPropForUnionType = additionalPropsType.ElementType.IsUnion
                && additionalPropsType.ElementType.UnionItemTypes.Any(t => !t.IsFrameworkType);

            if (shouldAddPropForUnionType || (!apValueType.IsUnion && additionalPropsType.Equals(_additionalBinaryDataPropsFieldType)))
            {
                var name = !containsAdditionalTypeProperties
                    ? AdditionalPropertiesHelper.DefaultAdditionalPropertiesPropertyName
                    : RawDataField.Name.ToIdentifierName();

                // Use object type if backward compatibility requires it, otherwise use BinaryData type
                var propertyType = _useObjectAdditionalProperties.Value ? _additionalObjectPropsFieldType : additionalPropsType;
                var type = !_inputModel.Usage.HasFlag(InputModelTypeUsage.Input)
                    ? propertyType.OutputType
                    : propertyType;

                var assignment = type.IsReadOnlyDictionary
                    ? new ExpressionPropertyBody(New.ReadOnlyDictionary(type.Arguments[0], type.ElementType, RawDataField))
                    : new ExpressionPropertyBody(RawDataField);
                var property = new PropertyProvider(
                    null,
                    MethodSignatureModifiers.Public,
                    type,
                    name,
                    assignment,
                    this)
                {
                    BackingField = RawDataField,
                    IsAdditionalProperties = true
                };
                properties.Add(property);
            }

            return properties;
        }

        private Dictionary<InputModelType, Dictionary<string, InputModelProperty>>? _inputDerivedProperties;
        private Dictionary<InputModelType, Dictionary<string, InputModelProperty>> InputDerivedProperties => _inputDerivedProperties ??= BuildDerivedProperties();

        private Dictionary<InputModelType, Dictionary<string, InputModelProperty>> BuildDerivedProperties()
        {
            Dictionary<InputModelType, Dictionary<string, InputModelProperty>> derivedProperties = [];
            var derivedModels = new List<InputModelType>();
            EnumerateDerivedModels(_inputModel, derivedModels);
            foreach (var derivedModel in derivedModels)
            {
                var derivedModelProperties = derivedModel.Properties;
                if (derivedModelProperties.Count > 0)
                {
                    derivedProperties[derivedModel] = derivedModelProperties.ToDictionary(p => p.Name);
                }
            }
            return derivedProperties;
        }

        private void EnumerateDerivedModels(InputModelType inputModel, List<InputModelType> derivedModels)
        {
            foreach (var derivedModel in inputModel.DerivedModels)
            {
                derivedModels.Add(derivedModel);
                EnumerateDerivedModels(derivedModel, derivedModels);
            }
        }

        protected internal override PropertyProvider[] BuildProperties()
        {
            var propertiesCount = _inputModel.Properties.Count;
            var properties = new List<PropertyProvider>(propertiesCount + 1);
            Dictionary<string, InputModelProperty> baseProperties = [];
            HashSet<string> skippedBasePropertyNames = [];
            foreach (var baseModelProvider in EnumerateBaseModelProviders())
            {
                foreach (var baseProperty in baseModelProvider._inputModel.Properties)
                {
                    if (baseProperties.ContainsKey(baseProperty.Name) || skippedBasePropertyNames.Contains(baseProperty.Name))
                    {
                        continue;
                    }

                    if (baseModelProvider.ShouldSkipDerivedModelProperties)
                    {
                        skippedBasePropertyNames.Add(baseProperty.Name);
                    }
                    else
                    {
                        baseProperties.Add(baseProperty.Name, baseProperty);
                    }
                }
            }
            // Build a set of serialized names for base discriminator properties to handle cases where
            // the derived model has a discriminator with a different C# name but the same wire name
            HashSet<string> baseDiscriminatorSerializedNames = EnumerateBaseModels()
                .SelectMany(m => m.Properties)
                .Where(p => p.IsDiscriminator && p.SerializedName is not null)
                .Select(p => p.SerializedName)
                .ToHashSet();
            for (int i = 0; i < propertiesCount; i++)
            {
                var property = _inputModel.Properties[i];
                var isDiscriminator = IsDiscriminator(property);

                // Skip discriminator properties that already exist in the base class
                // Check both by C# property name and by serialized name to handle cases where
                // the derived model has a discriminator with a different C# name but the same wire name
                if (isDiscriminator && (baseProperties.ContainsKey(property.Name) || skippedBasePropertyNames.Contains(property.Name) || (property.SerializedName is not null && baseDiscriminatorSerializedNames.Contains(property.SerializedName))))
                {
                    continue;
                }

                var outputProperty = CodeModelGenerator.Instance.TypeFactory.CreateProperty(property, this);

                if (_inputModel.DiscriminatorProperty == property)
                {
                    DiscriminatorProperty = outputProperty;
                }

                if (outputProperty is null)
                {
                    continue;
                }

                // Apply back-compat type replacement only for properties on the public API
                // surface: changing the type of an internal/private generated property is not
                // a source-breaking change
                if (MethodSignatureHelper.IsPublicApi(outputProperty.Modifiers) &&
                    LastContractPropertiesMap.TryGetValue(outputProperty.Name, out var lastContractPropertyType) &&
                    !lastContractPropertyType.Equals(outputProperty.Type))
                {
                    // If the previous property type (or a type nested in it) has been intentionally
                    // removed and that removal is accepted in the ApiCompat baseline, preserving it
                    // would reference a now-deleted type. Honor the baseline and allow the new type.
                    if (CodeModelGenerator.Instance.SourceInputModel?.ApiCompatBaseline.ReferencesSuppressedType(lastContractPropertyType) == true)
                    {
                        CodeModelGenerator.Instance.Emitter.Info(
                            $"Allowing property '{Name}.{outputProperty.Name}' type change to '{outputProperty.Type}'; previous type '{lastContractPropertyType}' is an accepted removal in the ApiCompat baseline.",
                            BackCompatibilityChangeCategory.BaselineAcceptedRemovalSkipped);
                    }
                    else
                    {
                        outputProperty.Type = lastContractPropertyType.ApplyInputSpecProperty(property);
                        CodeModelGenerator.Instance.Emitter.Info(
                            $"Changed property '{Name}.{outputProperty.Name}' type to '{lastContractPropertyType}' to match last contract.",
                            BackCompatibilityChangeCategory.PropertyTypePreserved);
                    }
                }

                if (!isDiscriminator)
                {
                    var derivedProperty = InputDerivedProperties.FirstOrDefault(p => p.Value.ContainsKey(property.Name)).Value?[property.Name];
                    if (derivedProperty is not null)
                    {
                        if (DomainEqual(property, derivedProperty))
                        {
                            outputProperty.Modifiers |= MethodSignatureModifiers.Virtual;
                        }
                    }
                    if (skippedBasePropertyNames.Contains(property.Name))
                    {
                        continue;
                    }

                    if (baseProperties.TryGetValue(property.Name, out var baseProperty))
                    {
                        if (DomainEqual(baseProperty, property))
                        {
                            outputProperty.Modifiers |= MethodSignatureModifiers.Override;
                        }
                        else
                        {
                            outputProperty.Modifiers |= MethodSignatureModifiers.New;
                            var fieldName = $"_{baseProperty.Name.ToVariableName()}";
                            outputProperty.Body = new ExpressionPropertyBody(
                                This.Property(fieldName).NullCoalesce(Default),
                                outputProperty.Body.HasSetter ? This.Property(fieldName).Assign(Value) : null);
                            outputProperty.BackingField = BaseModelProvider?.Fields.FirstOrDefault(f => f.Name == fieldName);
                        }
                        outputProperty.BaseProperty = CodeModelGenerator.Instance.TypeFactory.CreateProperty(baseProperty, BaseModelProvider!);
                    }
                }
                properties.Add(outputProperty);
            }

            if (AdditionalPropertyProperties.Count > 0)
            {
                properties.AddRange(AdditionalPropertyProperties);
            }

            return [.. properties];
        }

        private IEnumerable<InputModelType> EnumerateBaseModels()
            => EnumerateBaseModelProviders().Select(model => model._inputModel);

        private IEnumerable<ModelProvider> EnumerateBaseModelProviders()
        {
            // Custom code can create base-model cycles; include this model in the visited set so a cycle
            // back to it is not yielded as one of its own bases.
            HashSet<ModelProvider> visited = [this];
            var model = BaseModelProvider;
            while (model != null && visited.Add(model))
            {
                yield return model;
                model = model.BaseModelProvider;
            }
        }

        private static bool DomainEqual(InputProperty baseProperty, InputProperty derivedProperty)
        {
            if (baseProperty.Type.Name != derivedProperty.Type.Name)
            {
                return false;
            }

            if (baseProperty.IsRequired != derivedProperty.IsRequired)
            {
                return false;
            }

            var baseNullable = baseProperty.Type is InputNullableType;
            return baseNullable ? derivedProperty.Type is InputNullableType : derivedProperty.Type is not InputNullableType;
        }

        protected internal override ConstructorProvider[] BuildConstructors()
        {
            if (_inputModel.IsUnknownDiscriminatorModel)
            {
                return [FullConstructor];
            }

            // Build the standard single initialization constructor
            var accessibility = DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                ? MethodSignatureModifiers.Private | MethodSignatureModifiers.Protected
                : _inputModel.Usage.HasFlag(InputModelTypeUsage.Input)
                    ? MethodSignatureModifiers.Public
                    : MethodSignatureModifiers.Internal;
            var includeDiscriminatorParameter = _isDiscriminatedBaseType
                && BaseModelProvider?._inputModel.DiscriminatorProperty is not null;
            var (constructorParameters, constructorInitializer) = BuildConstructorParameters(
                true,
                includeDiscriminatorParameter);

            var constructor = new ConstructorProvider(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    accessibility,
                    constructorParameters,
                    initializer: constructorInitializer),
                bodyStatements: new MethodBodyStatement[]
                {
                    GetPropertyInitializers(true, parameters: constructorParameters)
                },
                this);

            var constructors = new List<ConstructorProvider> { constructor };

            // Add FullConstructor if parameters are different
            if (!constructorParameters.SequenceEqual(FullConstructor.Signature.Parameters))
            {
                constructors.Add(FullConstructor);
            }

            // For multi-level discriminators, add one additional private protected constructor
            if (IsMultiLevelDiscriminator)
            {
                var protectedConstructor = BuildProtectedInheritanceConstructor();
                constructors.Add(protectedConstructor);
            }

            return [.. constructors];
        }

        /// <summary>
        /// Restores previously-published public constructors that the current generation would otherwise
        /// drop. The primary scenario is a previously required property becoming optional: the corresponding
        /// parameter is removed from the initialization constructor, which is a source-breaking change for
        /// callers that construct the model positionally. When the previous public constructor can be safely
        /// reconstructed - i.e. every one of its extra parameters still maps to a settable property whose
        /// name and type are unchanged (or a property renamed via a codegen customization but keeping the
        /// same type) - a back-compat overload is added that chains to the current public constructor and
        /// assigns the extra properties.
        /// </summary>
        protected internal override IReadOnlyList<ConstructorProvider> BuildConstructorsForBackCompatibility(IEnumerable<ConstructorProvider> originalConstructors)
        {
            if (LastContractView?.Constructors is not { Count: > 0 } previousConstructors)
            {
                return base.BuildConstructorsForBackCompatibility(originalConstructors);
            }

            var originalConstructorList = originalConstructors as IReadOnlyList<ConstructorProvider> ?? [.. originalConstructors];
            IReadOnlyList<ConstructorProvider> candidateConstructors = CustomCodeView?.Constructors is { Count: > 0 } customConstructors
                ? [.. originalConstructorList, .. customConstructors]
                : originalConstructorList;

            var restorablePreviousConstructors = previousConstructors
                .Where(c => !BackCompatHelper.IsConstructorRemovalAcceptedInBaseline(this, c.Signature))
                .ToList();

            RestorePreviousConstructorParameterNames(originalConstructorList, candidateConstructors, restorablePreviousConstructors);

            var constructors = new List<ConstructorProvider>(base.BuildConstructorsForBackCompatibility(originalConstructorList));
            var restorablePropertyLookup = BuildRestorablePropertyLookup();

            foreach (var previousConstructor in restorablePreviousConstructors)
            {
                if (!MethodSignatureHelper.IsPublicApi(previousConstructor.Signature.Modifiers))
                {
                    continue;
                }

                var previousParameters = previousConstructor.Signature.Parameters;

                // A previously published accessible parameterless constructor is dropped when the current
                // generation makes a property required. Restore it and drop the generated mocking constructor
                // so it is not a duplicate. An accessible parameterless constructor on any generated partial
                // or in custom code counts as already present. A struct always exposes a public parameterless
                // constructor via its serialization partial, so there is nothing to restore on the model partial.
                if (previousParameters.Count == 0)
                {
                    if (Type.IsStruct)
                    {
                        continue;
                    }

                    var hasAccessibleParameterlessSerializationConstructor = SerializationProviders
                        .SelectMany(p => p.Constructors)
                        .Any(c => c.Signature.Parameters.Count == 0 && MethodSignatureHelper.IsPublicApi(c.Signature.Modifiers));

                    if (!constructors.Any(c => c.Signature.Parameters.Count == 0 && MethodSignatureHelper.IsPublicApi(c.Signature.Modifiers))
                        && !candidateConstructors.Any(c => c.Signature.Parameters.Count == 0 && MethodSignatureHelper.IsPublicApi(c.Signature.Modifiers))
                        && !hasAccessibleParameterlessSerializationConstructor)
                    {
                        var parameterlessConstructor = BuildBackCompatParameterlessConstructor(previousConstructor, candidateConstructors);
                        RemoveGeneratedMockingConstructor(constructors);
                        constructors.Add(parameterlessConstructor);
                        CodeModelGenerator.Instance.Emitter.Info(
                            $"Restored parameterless constructor '{Name}()' to match last contract.",
                            BackCompatibilityChangeCategory.ConstructorAddedFromLastContract);
                    }

                    continue;
                }

                // If a constructor with the same parameters already exists - either still generated or
                // supplied by custom code - there is nothing to restore.
                if (constructors.Any(c => BackCompatHelper.ParametersMatch(c.Signature.Parameters, previousParameters))
                    || candidateConstructors.Any(c => BackCompatHelper.ParametersMatch(c.Signature.Parameters, previousParameters)))
                {
                    continue;
                }

                if (TryBuildRestoredConstructor(previousConstructor, candidateConstructors, restorablePropertyLookup, out var restoredConstructor))
                {
                    constructors.Add(restoredConstructor);
                    CodeModelGenerator.Instance.Emitter.Info(
                        $"Restored constructor '{Name}({string.Join(", ", previousParameters.Select(p => p.Type.Name))})' to match last contract.",
                        BackCompatibilityChangeCategory.ConstructorAddedFromLastContract);
                }
                else
                {
                    CodeModelGenerator.Instance.Emitter.Info(
                        $"Could not restore constructor '{Name}({string.Join(", ", previousParameters.Select(p => p.Type.Name))})' from the last contract; a property name or type has changed.",
                        BackCompatibilityChangeCategory.ConstructorAddedFromLastContractSkipped);
                }
            }

            return constructors;
        }

        private void RestorePreviousConstructorParameterNames(
            IReadOnlyList<ConstructorProvider> currentConstructors,
            IReadOnlyList<ConstructorProvider> candidateConstructors,
            IReadOnlyList<ConstructorProvider> previousConstructors)
        {
            const MethodSignatureModifiers privateProtected = MethodSignatureModifiers.Private | MethodSignatureModifiers.Protected;
            foreach (var previousConstructor in previousConstructors)
            {
                if (!MethodSignatureHelper.IsPublicApi(previousConstructor.Signature.Modifiers))
                {
                    continue;
                }

                var previousParameters = previousConstructor.Signature.Parameters;

                // A generated or custom constructor that already matches the previous signature (types and
                // names) satisfies the contract; renaming another constructor into it would collide.
                if (candidateConstructors.Any(c => BackCompatHelper.ParametersMatch(c.Signature.Parameters, previousParameters)))
                {
                    continue;
                }

                var currentConstructor = currentConstructors.FirstOrDefault(c =>
                    (MethodSignatureHelper.IsPublicApi(c.Signature.Modifiers)
                        || (c.Signature.Modifiers & privateProtected) == privateProtected)
                    && MethodSignatureBase.SignatureComparer.Equals(c.Signature, previousConstructor.Signature));
                if (currentConstructor is null)
                {
                    continue;
                }

                var currentParameters = currentConstructor.Signature.Parameters;

                // A swap or rotation keeps every previous name, so realign the existing parameter objects
                // to the previous order - renaming positionally would mis-bind a caller's named argument to
                // the wrong property. Otherwise restore names positionally where the types line up.
                var currentByName = currentParameters.ToDictionary(p => p.Name);
                IReadOnlyList<ParameterProvider> restoredParameters = previousParameters.All(p => currentByName.ContainsKey(p.Name))
                    ? [.. previousParameters.Select(p => currentByName[p.Name])]
                    : currentParameters;
                if (!restoredParameters.Select((p, i) => p.Type.AreNamesEqual(previousParameters[i].Type)).All(match => match))
                {
                    continue;
                }

                // A permutation replaces every name, so a clash there is transient. Exact names are
                // retained, so restoring another parameter onto one would produce a real duplicate.
                var retainedExactNames = restoredParameters
                    .Where(p => p.IsExactName)
                    .Select(p => p.Name)
                    .ToHashSet(StringComparer.Ordinal);
                for (int i = 0; i < restoredParameters.Count; i++)
                {
                    var restoredName = previousParameters[i].Name;
                    if (string.Equals(restoredParameters[i].Name, restoredName, StringComparison.Ordinal)
                        || restoredParameters[i].IsExactName)
                    {
                        continue;
                    }

                    if (retainedExactNames.Contains(restoredName))
                    {
                        CodeModelGenerator.Instance.Emitter.Info(
                            $"Could not preserve parameter name '{restoredName}' at position {i} on constructor '{Name}' from the last contract; it collides with the exact name of another parameter.",
                            BackCompatibilityChangeCategory.ParameterNamePreserved);
                        continue;
                    }

                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"Preserved parameter name '{restoredName}' at position {i} on constructor '{Name}' from last contract (instead of '{restoredParameters[i].Name}').",
                        BackCompatibilityChangeCategory.ParameterNamePreserved);
                    restoredParameters[i].Update(name: restoredName);
                }

                currentConstructor.Signature.Update(parameters: [.. restoredParameters]);
                currentConstructor.Update(signature: currentConstructor.Signature);
            }
        }

        private bool TryBuildRestoredConstructor(
            ConstructorProvider previousConstructor,
            IReadOnlyList<ConstructorProvider> currentConstructors,
            Dictionary<string, PropertyProvider> restorablePropertyLookup,
            [NotNullWhen(true)] out ConstructorProvider? restoredConstructor)
        {
            restoredConstructor = null;
            var previousParameters = previousConstructor.Signature.Parameters;

            // Find the public constructor to chain to: its parameters must form an in-order subsequence of
            // the previous constructor's parameters. Prefer the closest one. Without a chaining target the
            // constructor is not restored - a standalone constructor would bypass the current constructor's
            // initialization (e.g. the implicit base() call and inherited get-only properties).
            ConstructorProvider? targetConstructor = null;
            foreach (var candidate in currentConstructors)
            {
                if (!MethodSignatureHelper.IsPublicApi(candidate.Signature.Modifiers)
                    || candidate.Signature.Parameters.Count >= previousParameters.Count)
                {
                    continue;
                }

                // Check whether this candidate would improve on the current target before performing the
                // more expensive subsequence lookup.
                if ((targetConstructor == null
                        || candidate.Signature.Parameters.Count > targetConstructor.Signature.Parameters.Count)
                    && IsParameterSubsequence(candidate.Signature.Parameters, previousParameters))
                {
                    targetConstructor = candidate;
                }
            }

            if (targetConstructor is null)
            {
                return false;
            }

            var targetParameters = targetConstructor.Signature.Parameters;
            var restoredParameters = new List<ParameterProvider>(previousParameters.Count);
            var initializerArguments = new List<ParameterProvider>(targetParameters.Count);
            var extraAssignments = new List<(PropertyProvider Property, ParameterProvider Parameter)>();
            int targetIndex = 0;

            foreach (var previousParameter in previousParameters)
            {
                if (targetIndex < targetParameters.Count
                    && targetParameters[targetIndex].Equals(previousParameter))
                {
                    var keptParameter = PartialMethodCustomization.CloneParameterWithName(
                        targetParameters[targetIndex],
                        previousParameter.Name,
                        removeDefault: false,
                        validation: ParameterValidationType.None);
                    restoredParameters.Add(keptParameter);
                    initializerArguments.Add(keptParameter);
                    targetIndex++;
                    continue;
                }

                // Each extra parameter (not consumed by the chain target) must map to a settable, wire-backed
                // property assigned in the restored constructor's body.
                var property = restorablePropertyLookup.TryGetValue(previousParameter.Name, out var chained)
                    && chained.Type.AreNamesEqual(previousParameter.Type)
                    ? chained
                    : null;

                if (property is null || extraAssignments.Any(a => a.Property == property))
                {
                    return false;
                }

                var restoredParameter = PartialMethodCustomization.CloneParameterWithName(property.AsParameter, previousParameter.Name, removeDefault: true);
                restoredParameters.Add(restoredParameter);
                extraAssignments.Add((property, restoredParameter));
            }

            if (targetIndex != targetParameters.Count || extraAssignments.Count == 0)
            {
                return false;
            }

            var bodyStatements = new List<MethodBodyStatement>(extraAssignments.Count);
            foreach (var (property, parameter) in extraAssignments)
            {
                ValueExpression assignee = property.BackingField is null ? property : property.BackingField;
                ValueExpression value = parameter;
                if (CSharpType.RequiresToList(parameter.Type, property.Type))
                {
                    value = parameter.Type.IsNullable ? value.NullConditional().ToList() : value.ToList();
                }

                bodyStatements.Add(assignee.Assign(value).Terminate());
            }

            var signature = new ConstructorSignature(
                Type,
                $"Initializes a new instance of {Type:C}",
                previousConstructor.Signature.Modifiers,
                restoredParameters,
                initializer: new ConstructorInitializer(false, initializerArguments));

            restoredConstructor = new ConstructorProvider(signature, bodyStatements, this);
            return true;
        }

        private ConstructorProvider BuildBackCompatParameterlessConstructor(
            ConstructorProvider previousConstructor,
            IReadOnlyList<ConstructorProvider> currentConstructors)
        {
            // Prefer the public or protected constructor with the fewest required parameters, then a
            // private-protected one; a null target yields a standalone constructor.
            const MethodSignatureModifiers privateProtected = MethodSignatureModifiers.Private | MethodSignatureModifiers.Protected;
            var target = currentConstructors
                .Where(c => c.Signature.Parameters.Count > 0
                    && (MethodSignatureHelper.IsPublicApi(c.Signature.Modifiers) || (c.Signature.Modifiers & privateProtected) == privateProtected))
                .MinBy(c => (MethodSignatureHelper.IsPublicApi(c.Signature.Modifiers) ? 0 : 1, c.Signature.Parameters.Count(p => p.DefaultValue is null)));

            ConstructorInitializer? initializer = target is null
                ? null
                : new ConstructorInitializer(false, [.. target.Signature.Parameters.Select(_ => Snippet.Default)]);

            var signature = new ConstructorSignature(
                Type,
                $"Initializes a new instance of {Type:C}",
                previousConstructor.Signature.Modifiers,
                parameters: [],
                initializer: initializer);

            return new ConstructorProvider(signature, MethodBodyStatement.Empty, this);
        }

        private void RemoveGeneratedMockingConstructor(List<ConstructorProvider> constructors)
        {
            constructors.RemoveAll(c => c.Signature.Parameters.Count == 0);

            foreach (var serializationProvider in SerializationProviders)
            {
                var serializationConstructors = serializationProvider.Constructors;
                if (serializationConstructors.Any(c => c.Signature.Parameters.Count == 0))
                {
                    serializationProvider.Update(
                        constructors: [.. serializationConstructors.Where(c => c.Signature.Parameters.Count != 0)]);
                }
            }
        }

        private static bool IsParameterSubsequence(
            IReadOnlyList<ParameterProvider> subset,
            IReadOnlyList<ParameterProvider> full)
        {
            if (subset.Count > full.Count)
            {
                return false;
            }

            int matched = 0;
            foreach (var parameter in full)
            {
                if (matched == subset.Count)
                {
                    break;
                }

                if (subset[matched].Equals(parameter))
                {
                    matched++;
                }
            }

            return matched == subset.Count;
        }

        private Dictionary<string, PropertyProvider> BuildRestorablePropertyLookup()
        {
            var lookup = new Dictionary<string, PropertyProvider>();
            foreach (var property in CanonicalView.Properties)
            {
                if (!MethodSignatureHelper.IsPublicApi(property.Modifiers) || !property.Body.HasSetter || property.WireInfo == null)
                {
                    continue;
                }

                lookup.TryAdd(property.AsParameter.Name, property);

                if (property.OriginalName != null)
                {
                    lookup.TryAdd(property.OriginalName.ToVariableName(), property);
                }
            }

            return lookup;
        }

        /// <summary>
        /// Determines if this model should have a dual constructor pattern.
        /// This is needed when the model shares the same discriminator property name as its base model
        /// AND has derived models, indicating it's an intermediate type in a discriminated union hierarchy.
        /// </summary>
        private bool ComputeIsMultiLevelDiscriminator()
        {
            // Only applies to non-abstract models with a base model
            if (DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract) || _inputModel.BaseModel == null)
            {
                return false;
            }
            // Must have derived models to be considered an intermediate type
            if (_inputModel.DerivedModels.Count == 0)
            {
                return false;
            }

            // Check if this model has a discriminator property in the input
            if (_inputModel.DiscriminatorProperty == null)
            {
                return false;
            }

            // Check if base model has a discriminator property with the same name
            if (_inputModel.BaseModel.DiscriminatorProperty == null)
            {
                return false;
            }

            // If both models have discriminator properties with the same name,
            // and this model has derived models, it needs the dual constructor pattern
            return _inputModel.DiscriminatorProperty.Name ==
                _inputModel.BaseModel.DiscriminatorProperty.Name;
        }

        /// <summary>
        /// Builds a private protected constructor for multi-level discriminator inheritance.
        /// This allows derived models to call this constructor with their discriminator value.
        /// </summary>
        private ConstructorProvider BuildProtectedInheritanceConstructor()
        {
            var (parameters, initializer) = BuildConstructorParameters(true, includeDiscriminatorParameter: true);

            return new ConstructorProvider(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    MethodSignatureModifiers.Private | MethodSignatureModifiers.Protected,
                    parameters,
                    initializer: initializer),
                bodyStatements: new MethodBodyStatement[]
                {
                    GetPropertyInitializers(true, parameters: parameters)
                },
                this);
        }

        /// <summary>
        /// Builds the internal constructor for the model which contains all public properties
        /// as parameters.
        /// </summary>
        private ConstructorProvider BuildFullConstructor()
        {
            var (ctorParameters, ctorInitializer) = BuildConstructorParameters(false);
            return new ConstructorProvider(
                signature: new ConstructorSignature(
                    Type,
                    $"Initializes a new instance of {Type:C}",
                    MethodSignatureModifiers.Internal,
                    ctorParameters,
                    initializer: ctorInitializer),
                bodyStatements: new MethodBodyStatement[]
                {
                    GetPropertyInitializers(false)
                },
                this);
        }

        private IEnumerable<PropertyProvider> GetAllBasePropertiesForConstructorInitialization(bool includeAllHierarchyDiscriminator = false)
        {
            var properties = new Stack<List<PropertyProvider>>();
            bool isDirectBase = true;
            foreach (var modelProvider in EnumerateBaseModelProviders())
            {
                properties.Push([]);
                foreach (var property in modelProvider.CanonicalView.Properties)
                {
                    if (property.IsDiscriminator)
                    {
                        // In the case of nested discriminators, include discriminator property based on the parameter
                        if (isDirectBase || includeAllHierarchyDiscriminator)
                        {
                            properties.Peek().Add(property);
                        }
                    }
                    else
                    {
                        properties.Peek().Add(property);
                    }
                }

                isDirectBase = false;
            }

            // parameters need to be ordered from the base-most class to the derived class
            return properties.SelectMany(l => l);
        }

        private IEnumerable<FieldProvider> GetAllBaseFieldsForConstructorInitialization()
        {
            var fields = new Stack<List<FieldProvider>>();
            foreach (var modelProvider in EnumerateBaseModelProviders())
            {
                fields.Push([]);
                foreach (var field in modelProvider.CanonicalView.Fields)
                {
                    fields.Peek().Add(field);
                }
            }

            return fields.SelectMany(l => l);
        }

        private (IReadOnlyList<ParameterProvider> Parameters, ConstructorInitializer? Initializer) BuildConstructorParameters(
            bool isInitializationConstructor, bool includeDiscriminatorParameter = false)
        {
            var baseParameters = new List<ParameterProvider>();
            var constructorParameters = new List<ParameterProvider>();
            IEnumerable<PropertyProvider> baseProperties = [];
            IEnumerable<FieldProvider> baseFields = [];

            if (isInitializationConstructor)
            {
                baseProperties = GetAllBasePropertiesForConstructorInitialization(includeDiscriminatorParameter);
                baseFields = GetAllBaseFieldsForConstructorInitialization();
            }
            else if (BaseModelProvider is not null && BaseModelProvider.ShouldUseFullConstructorInDerivedTypes && !HasBaseModelProviderCycle())
            {
                baseParameters.AddRange(BaseModelProvider.FullConstructor.Signature.Parameters);
            }

            HashSet<PropertyProvider> overriddenProperties = CanonicalView.Properties.Where(p => p.BaseProperty is not null).Select(p => p.BaseProperty!).ToHashSet();

            // add the base parameters, if any
            foreach (var property in baseProperties)
            {
                AddInitializationParameterForCtor(baseParameters, Type.IsStruct, isInitializationConstructor, property);
            }

            // add the base fields, if any
            foreach (var field in baseFields)
            {
                AddInitializationParameterForCtor(baseParameters, Type.IsStruct, isInitializationConstructor, field: field);
            }

            // Build constructor parameters first so we can use them for initializer
            foreach (var property in CanonicalView.Properties)
            {
                AddInitializationParameterForCtor(constructorParameters, Type.IsStruct, isInitializationConstructor, property);
            }

            foreach (var field in CanonicalView.Fields)
            {
                AddInitializationParameterForCtor(constructorParameters, Type.IsStruct, isInitializationConstructor, field: field);
            }

            constructorParameters.InsertRange(0, _inputModel.IsUnknownDiscriminatorModel
                ? baseParameters
                : baseParameters.Where(p =>
                    p.Property is null
                    || (!overriddenProperties.Contains(p.Property!) && (!p.Property.IsDiscriminator || !isInitializationConstructor || includeDiscriminatorParameter))));

            // construct the initializer using the parameters from base signature
            ConstructorInitializer? constructorInitializer = null;
            if (BaseModelProvider != null)
            {
                if (baseParameters.Count > 0)
                {
                    // Check if we should call multi-level discriminator constructor
                    if (isInitializationConstructor && (IsMultiLevelDiscriminator || BaseModelProvider.IsMultiLevelDiscriminator))
                    {
                        var baseDiscriminatorParam = baseParameters.FirstOrDefault(p => p.Property?.IsDiscriminator == true);

                        ValueExpression discriminatorExpression = (baseDiscriminatorParam is not null && includeDiscriminatorParameter)
                            ? constructorParameters.FirstOrDefault(p => p.Property?.IsDiscriminator == true) ?? baseDiscriminatorParam
                            : DiscriminatorLiteral;

                        var args = baseParameters.Where(p => p.Property?.IsDiscriminator != true)
                            .Select(p => GetExpressionForCtor(p, overriddenProperties, isInitializationConstructor, constructorParameters));

                        constructorInitializer = new ConstructorInitializer(true, [discriminatorExpression, .. args]);
                    }
                    else
                    {
                        // Standard base constructor call
                        constructorInitializer = new ConstructorInitializer(true, [.. baseParameters.Select(p => GetExpressionForCtor(p, overriddenProperties, isInitializationConstructor, constructorParameters))]);
                    }
                }
                else
                {
                    // Even when no base parameters, we still need a base constructor call if there's a base model
                    constructorInitializer = new ConstructorInitializer(true, Array.Empty<ValueExpression>());
                }
            }

            if (!isInitializationConstructor)
            {
                foreach (var property in AdditionalPropertyProperties)
                {
                    constructorParameters.Add(property.AsParameter);
                }

                // only add the raw data field if it has not already been added as a parameter for BinaryData additional properties
                if (RawDataField != null && !SupportsBinaryDataAdditionalProperties)
                {
                    constructorParameters.Add(RawDataField.AsParameter);
                }
            }

            return (constructorParameters, constructorInitializer);
        }

        private bool HasBaseModelProviderCycle()
        {
            // FullConstructor reads the base constructor signature. If the custom base chain loops back
            // to this model, skip that read rather than recursively building this constructor again.
            HashSet<ModelProvider> visited = [this];
            var modelProvider = BaseModelProvider;
            while (modelProvider != null)
            {
                if (!visited.Add(modelProvider))
                {
                    return true;
                }

                modelProvider = modelProvider.BaseModelProvider;
            }

            return false;
        }

        private ValueExpression? EnsureDiscriminatorValueExpression()
        {
            if (_inputModel.BaseModel is not null && _inputModel.DiscriminatorValue is not null)
            {
                var discriminator = BaseModelProvider?.CanonicalView.Properties.Where(p => p.IsDiscriminator).FirstOrDefault();
                if (discriminator != null)
                {
                    var type = discriminator.Type;
                    if (IsUnknownDiscriminatorModel)
                    {
                        return GetUnknownDiscriminatorExpression(discriminator);
                    }

                    if (type is { IsFrameworkType: false, IsEnum: true })
                    {
                        if (_inputModel.BaseModel.DiscriminatorProperty?.Type is InputEnumType inputEnumType)
                        {
                            var discriminatorProvider = CodeModelGenerator.Instance.TypeFactory.CreateEnum(enumType: inputEnumType);

                            var enumMember = discriminatorProvider!.EnumValues.FirstOrDefault(e => e.Value.ToString() == _inputModel.DiscriminatorValue)
                                             ?? throw new InvalidOperationException($"invalid discriminator value {_inputModel.DiscriminatorValue}");
                            var enumMemberName = enumMember.Name;

                            // Check to see if the enum member for this discriminator value has been customized
                            var customEnumProperty = discriminatorProvider.CustomCodeView?.Properties
                                .FirstOrDefault(f => f.OriginalName?.Equals(enumMemberName, StringComparison.OrdinalIgnoreCase) == true);
                            if (customEnumProperty != null)
                            {
                                enumMemberName = customEnumProperty.Name;
                            }
                            /* {KindType}.{enumMember} */
                            return Static(type).Property(enumMemberName);
                        }

                        // Handle custom fixed enum discriminator
                        if (discriminator.CustomProvider?.Value?.IsEnum == true)
                        {
                            var enumMember = discriminator.CustomProvider.Value.Fields
                                .FirstOrDefault(f => f.Name.Equals(_inputModel.DiscriminatorValue, StringComparison.OrdinalIgnoreCase));
                            if (enumMember != null)
                            {
                                return Static(type).Property(enumMember.Name);
                            }
                        }
                    }

                    // fallback to the default value
                    return DiscriminatorLiteral;
                }
            }
            return null;
        }

        private ValueExpression GetExpressionForCtor(
            ParameterProvider parameter,
            HashSet<PropertyProvider> overriddenProperties,
            bool isPrimaryConstructor,
            IReadOnlyList<ParameterProvider>? availableParameters = null)
        {
            if (parameter.Property is not null && parameter.Property.IsDiscriminator && _inputModel.DiscriminatorValue != null)
            {
                if (isPrimaryConstructor)
                {
                    return DiscriminatorValueExpression ?? throw new InvalidOperationException($"invalid discriminator {_inputModel.DiscriminatorValue} for property {parameter.Property.Name}");
                }
                else if (IsUnknownDiscriminatorModel)
                {
                    return GetUnknownDiscriminatorExpression(parameter.Property) ?? throw new InvalidOperationException($"invalid discriminator {_inputModel.DiscriminatorValue} for property {parameter.Property.Name}");
                }
                else
                {
                    return parameter;
                }
            }

            var paramToUse = parameter.Property is not null && overriddenProperties.Contains(parameter.Property) ? Properties.First(p => p.Name == parameter.Property.Name).AsParameter : parameter;
            if (availableParameters is not null && paramToUse.Property is not null)
            {
                paramToUse = availableParameters.FirstOrDefault(p => p.Property == paramToUse.Property)
                    ?? availableParameters.FirstOrDefault(p => p.Property?.Name == paramToUse.Property.Name)
                    ?? paramToUse;
            }

            return paramToUse.Property is not null ? GetConversion(paramToUse.Property, sourceParameter: paramToUse) : paramToUse;
        }

        private ValueExpression? GetUnknownDiscriminatorExpression(PropertyProvider property)
        {
            if (!property.IsDiscriminator || _inputModel.DiscriminatorValue == null)
            {
                return null;
            }

            var discriminatorExpression = property.AsParameter;
            var type = property.Type;

            if (!type.IsFrameworkType && type.IsEnum)
            {
                if (type.IsStruct)
                {
                    /* kind != default ? kind : "unknown" */
                    return new TernaryConditionalExpression(discriminatorExpression.NotEqual(Default), discriminatorExpression, DiscriminatorLiteral);
                }
                else
                {
                    return discriminatorExpression;
                }
            }
            else
            {
                /* kind ?? "unknown" */
                return discriminatorExpression.NullCoalesce(DiscriminatorLiteral);
            }
        }

        private static void AddInitializationParameterForCtor(
            List<ParameterProvider> parameters,
            bool isStruct,
            bool isPrimaryConstructor,
            PropertyProvider? property = default,
            FieldProvider? field = default)
        {
            var wireInfo = property?.WireInfo ?? field?.WireInfo;
            var type = property?.Type ?? field?.Type;

            // We only add those properties with wire info indicating they are coming from specs.
            if (wireInfo == null)
            {
                return;
            }

            var parameter = property?.AsParameter ?? field!.AsParameter;
            if (isPrimaryConstructor)
            {
                if (isStruct || (wireInfo.IsRequired && !type!.IsLiteral))
                {
                    if (!wireInfo.IsReadOnly)
                    {
                        parameters.Add(parameter.ToPublicInputParameter());
                    }
                }
            }
            else
            {
                // For the serialization constructor, we always add the property as a parameter
                parameters.Add(parameter);
            }
        }

        private MethodBodyStatement GetPropertyInitializers(
            bool isPrimaryConstructor,
            IReadOnlyList<ParameterProvider>? parameters = null)
        {
            List<MethodBodyStatement> methodBodyStatements = new(CanonicalView.Properties.Count + CanonicalView.Fields.Count + 1);
            Dictionary<string, ParameterProvider> parameterMap = parameters?.ToDictionary(p => p.Name) ?? [];

            foreach (var property in CanonicalView.Properties)
            {
                CreatePropertyAssignmentStatement(isPrimaryConstructor, methodBodyStatements, parameterMap, property);
            }

            foreach (var field in CanonicalView.Fields)
            {
                CreatePropertyAssignmentStatement(isPrimaryConstructor, methodBodyStatements, parameterMap, field: field);
            }

            // If discriminator is defined as optional in the base model, but we have an expression for it, assign it in the
            // primary constructor body.
            if (isPrimaryConstructor && DiscriminatorValueExpression != null)
            {
                var baseDiscriminatorProperty = BaseModelProvider?.DiscriminatorProperty;
                if (baseDiscriminatorProperty is { WireInfo.IsRequired: false })
                {
                    methodBodyStatements.Add(baseDiscriminatorProperty.Assign(DiscriminatorValueExpression).Terminate());
                }
            }

            // handle additional properties
            foreach (var property in AdditionalPropertyProperties)
            {
                var backingField = property.BackingField;
                if (backingField != null)
                {
                    AssignmentExpression assignment = backingField.Assign(property.AsParameter);
                    if (isPrimaryConstructor)
                    {
                        assignment = backingField.Assign(New.Instance(backingField.Type.PropertyInitializationType));
                    }
                    else if (property.Type.IsReadOnlyDictionary)
                    {
                        assignment = backingField.Assign(New.Instance(backingField.Type.PropertyInitializationType, property.AsParameter));
                    }

                    methodBodyStatements.Add(assignment.Terminate());
                }
            }

            if (RawDataField != null)
            {
                // initialize the raw data field in the serialization constructor if the model does not explicitly support AP of binary data.
                if (!isPrimaryConstructor && !SupportsBinaryDataAdditionalProperties)
                {
                    methodBodyStatements.Add(RawDataField.Assign(RawDataField.AsParameter).Terminate());
                }
            }

            return methodBodyStatements;
        }

        private void CreatePropertyAssignmentStatement(
            bool isPrimaryConstructor,
            List<MethodBodyStatement> methodBodyStatements,
            Dictionary<string, ParameterProvider> parameterMap,
            PropertyProvider? property = default,
            FieldProvider? field = default)
        {
            var wireInfo = property?.WireInfo ?? field?.WireInfo;
            // skip those non-spec properties
            if (wireInfo == null)
            {
                return;
            }

            // skip if this is an overload / new of a base property
            // also skip if the base was required or the derived property is not required
            if (property?.BaseProperty is not null && (!isPrimaryConstructor || wireInfo.IsRequired == false || property.BaseProperty.WireInfo?.IsRequired == true))
            {
                return;
            }

            ValueExpression assignee = property != null
                ? property.BackingField is null ? property : property.BackingField
                : field!;

            if (!isPrimaryConstructor)
            {
                // always add the property for the serialization constructor
                methodBodyStatements.Add(assignee.Assign(GetConversion(property, field)).Terminate());
                return;
            }

            ValueExpression? initializationValue = null;

            var type = property?.Type ?? field!.Type;

            if (parameterMap.TryGetValue(property?.AsParameter.Name ?? field!.AsParameter.Name, out var parameter) || Type.IsStruct)
            {
                if (parameter != null)
                {
                    initializationValue = parameter;

                    if (CSharpType.RequiresToList(parameter.Type, type))
                    {
                        initializationValue = parameter.Type.IsNullable ?
                            initializationValue.NullConditional().ToList() :
                            initializationValue.ToList();
                    }
                }
            }
            else if (initializationValue == null && type.IsCollection)
            {
                initializationValue = New.Instance(type.PropertyInitializationType);
            }

            if (initializationValue != null)
            {
                methodBodyStatements.Add(assignee.Assign(initializationValue).Terminate());
            }
        }

        private static ValueExpression GetConversion(PropertyProvider? property = default, FieldProvider? field = default, ValueExpression? source = default, ParameterProvider? sourceParameter = default)
        {
            CSharpType to = property != null
                ? property.BackingField is null ? property.Type : property.BackingField.Type
                : field!.Type;
            CSharpType from = property?.Type ?? field!.Type;
            sourceParameter ??= property?.AsParameter ?? field!.AsParameter;
            source ??= sourceParameter;

            if (from.IsEnum && to.Equals(from.UnderlyingEnumType))
            {
                return from.ToSerial(sourceParameter);
            }

            return source;
        }

        /// <summary>
        /// Builds the raw data field for the model to be used for serialization.
        /// </summary>
        /// <returns>The constructed <see cref="FieldProvider"/> if the model should generate the field.</returns>
        protected virtual FieldProvider? BuildRawDataField()
        {
            if (!_inputModel.Usage.HasFlag(InputModelTypeUsage.Json)
                && (_inputModel.Usage.HasFlag(InputModelTypeUsage.Xml)
                    || _inputModel.Usage.HasFlag(InputModelTypeUsage.MultipartFormData)))
            {
                return null;
            }

            // check if there is a raw data field on any of the base models, if so, we do not have to have one here.
            foreach (var baseModelProvider in EnumerateBaseModelProviders())
            {
                if (baseModelProvider.RawDataField != null)
                {
                    return null;
                }
            }

            var modifiers = FieldModifiers.Private;
            if (!DeclarationModifiers.HasFlag(TypeSignatureModifiers.Sealed) && !DeclarationModifiers.HasFlag(TypeSignatureModifiers.Struct))
            {
                modifiers |= FieldModifiers.Protected;
            }
            modifiers |= FieldModifiers.ReadOnly;

            // Use object type for backward compatibility if needed, otherwise use BinaryData
            var fieldType = _useObjectAdditionalProperties.Value ? _additionalObjectPropsFieldType : _additionalBinaryDataPropsFieldType;

            var rawDataField = new FieldProvider(
                modifiers: modifiers,
                type: fieldType,
                description: FormattableStringHelpers.FromString(AdditionalBinaryDataPropsFieldDescription),
                name: AdditionalPropertiesHelper.AdditionalBinaryDataPropsFieldName,
                enclosingType: this);

            return rawDataField;
        }

        /// <summary>
        /// Replaces unverifiable types, types that do not have value kind checks during deserialization of additional properties,
        /// with the corresponding verifiable types. By default, BinaryData is used as the value type for unknown additional properties.
        /// </summary>
        /// <param name="type"></param>
        /// <returns></returns>
        private CSharpType ReplaceUnverifiableType(CSharpType type)
        {
            return type switch
            {
                _ when type.Equals(_additionalPropsUnknownType, ignoreNullable: true) => type,
                _ when type.IsFrameworkType && AdditionalPropertiesHelper.VerifiableAdditionalPropertyTypes.Contains(type.FrameworkType) => type,
                _ when type.IsUnion => type,
                _ when type.IsList => type.MakeGenericType([ReplaceUnverifiableType(type.Arguments[0])]),
                _ when type.IsDictionary => type.MakeGenericType([ReplaceUnverifiableType(type.Arguments[0]), ReplaceUnverifiableType(type.Arguments[1])]),
                _ => CSharpType.FromUnion([type], false, UnionItemTypeReferenceKind.MetadataOnly)
            };
        }

        /// <summary>
        /// Determines whether to use object type for AdditionalProperties based on backward compatibility requirements.
        /// Checks if the last contract (previous version) had an AdditionalProperties property of type IDictionary&lt;string, object&gt;.
        /// </summary>
        /// <returns>True if object type should be used for backward compatibility; otherwise false (uses BinaryData).</returns>
        private bool ShouldUseObjectAdditionalProperties()
        {
            if (LastContractView == null || _inputModel.AdditionalProperties == null)
            {
                return false;
            }

            // Check if the property exists in the last contract by name
            var lastContractProperty = LastContractView.Properties.FirstOrDefault(p =>
                MethodSignatureHelper.IsPublicApi(p.Modifiers) &&
                p.Name == AdditionalPropertiesHelper.DefaultAdditionalPropertiesPropertyName);

            if (lastContractProperty == null)
            {
                return false;
            }

            // Check if it's IDictionary<string, object>
            var propertyType = lastContractProperty.Type;
            if (propertyType.IsDictionary && propertyType.Arguments.Count == 2)
            {
                var keyType = propertyType.Arguments[0];
                var valueType = propertyType.Arguments[1];

                // Check if key is string and value is object
                if (keyType.IsFrameworkType && keyType.FrameworkType == typeof(string) &&
                    valueType.IsFrameworkType && valueType.FrameworkType == typeof(object))
                {
                    return true;
                }
            }

            return false;
        }

        private static string BuildAdditionalTypePropertiesFieldName(CSharpType additionalPropertiesValueType)
        {
            var name = additionalPropertiesValueType.Name;

            while (additionalPropertiesValueType.IsCollection)
            {
                additionalPropertiesValueType = additionalPropertiesValueType.ElementType;
                name += additionalPropertiesValueType.Name;
            }

            return $"_additional{name.ToIdentifierName()}Properties";
        }
    }
}

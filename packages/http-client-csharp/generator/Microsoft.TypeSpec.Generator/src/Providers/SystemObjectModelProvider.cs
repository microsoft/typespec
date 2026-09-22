// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Represents a model type from an external assembly (system or referenced assembly) that is mapped
    /// from an input model type. Unlike <see cref="SystemObjectTypeProvider"/> which extends <see cref="TypeProvider"/>,
    /// this class extends <see cref="ModelProvider"/> so it can serve as a <see cref="ModelProvider.BaseModelProvider"/>
    /// for derived models that inherit from system types.
    /// <para>
    /// This is used when a code generator maps an input model (e.g., an ARM Resource type) to an existing
    /// framework type (e.g., ResourceData) rather than generating a new type.
    /// </para>
    /// </summary>
    public class SystemObjectModelProvider : ModelProvider
    {
        private readonly CSharpType _systemType;
        private readonly bool _skipDerivedConstructorParameters;
        private readonly TypeProvider? _lastContractType;

        /// <summary>
        /// Initializes a new instance of <see cref="SystemObjectModelProvider"/>.
        /// </summary>
        /// <param name="systemType">The CSharp type from the external/system assembly.</param>
        /// <param name="inputModel">The input model type that this system type replaces.</param>
        public SystemObjectModelProvider(CSharpType systemType, InputModelType inputModel)
            : this(systemType, inputModel, skipDerivedConstructorParameters: false, lastContractType: null)
        {
        }

        public SystemObjectModelProvider(
            CSharpType systemType,
            InputModelType inputModel,
            bool skipDerivedConstructorParameters)
            : this(systemType, inputModel, skipDerivedConstructorParameters, lastContractType: null)
        {
        }

        internal SystemObjectModelProvider(
            CSharpType systemType,
            InputModelType inputModel,
            TypeProvider lastContractType)
            : this(systemType, inputModel, skipDerivedConstructorParameters: false, lastContractType)
        {
        }

        private SystemObjectModelProvider(
            CSharpType systemType,
            InputModelType inputModel,
            bool skipDerivedConstructorParameters,
            TypeProvider? lastContractType)
            : base(inputModel)
        {
            _systemType = systemType ?? throw new ArgumentNullException(nameof(systemType));
            _skipDerivedConstructorParameters = skipDerivedConstructorParameters;
            _lastContractType = lastContractType;
            CrossLanguageDefinitionId = inputModel.CrossLanguageDefinitionId;

            // The base ModelProvider constructor can evaluate Type before _systemType is assigned.
            // Clear those cached values so Name/Namespace/BaseType are rebuilt from the wrapped type.
            Reset();
        }

        /// <summary>
        /// Gets the underlying system <see cref="CSharpType"/> that this provider wraps.
        /// </summary>
        public CSharpType SystemType => _systemType;

        internal bool UsesLastContractType => _lastContractType is not null;

        internal bool HasReconstructibleLastContractConstructor
        {
            get
            {
                if (_lastContractType is null)
                {
                    return HasCallableFrameworkConstructor(FullConstructor.Signature.Parameters) &&
                        HasCallableFrameworkConstructor(Properties.Where(IsRequiredInitializationProperty)
                            .Select(property => property.AsParameter.ToPublicInputParameter()).ToArray());
                }

                if (_lastContractType.Constructors.Count == 0)
                {
                    return InputModel.Properties.Count == 0 &&
                        HasCallableInitializationConstructor() &&
                        HasCallableFrameworkConstructor([]);
                }

                return TryGetLastContractConstructor(out var constructor, out _) &&
                    HasCallableInitializationConstructor() &&
                    HasCallableFrameworkConstructor(constructor.Signature.Parameters);
            }
        }

        private bool HasCallableFrameworkConstructor(
            IReadOnlyList<ParameterProvider> generatedParameters,
            IReadOnlyList<ParameterProvider>? historicalParameters = null)
        {
            if (!SystemType.IsFrameworkType)
            {
                return false;
            }

            const BindingFlags flags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;
            var candidates = SystemType.FrameworkType.GetConstructors(flags).Where(constructor =>
                IsPublicOrProtected(constructor) &&
                constructor.GetParameters() is { } frameworkParameters &&
                frameworkParameters.Length >= generatedParameters.Count &&
                frameworkParameters.Take(generatedParameters.Count).Zip(generatedParameters).All(pair =>
                    ModelBaseMemberCompatibility.AreTypesCompatible(pair.Second.Type, new CSharpType(pair.First.ParameterType))) &&
                frameworkParameters.Skip(generatedParameters.Count).All(parameter =>
                    parameter.IsOptional ||
                    parameter.HasDefaultValue ||
                    parameter.GetCustomAttribute<ParamArrayAttribute>() is not null)).ToArray();

            // Exact parameter types without omitted arguments are preferred. Otherwise require a
            // single callable overload; generalized overload resolution is outside this policy.
            var exactCandidates = candidates.Where(constructor => constructor.GetParameters().Length == generatedParameters.Count).ToArray();
            var selected = exactCandidates.Length == 1 ? exactCandidates[0] : candidates.Length == 1 ? candidates[0] : null;
            if (selected is null)
            {
                return false;
            }
            var parameters = selected.GetParameters();
            return historicalParameters is null ||
                historicalParameters.Skip(generatedParameters.Count).Select((parameter, index) =>
                    (Parameter: parameter, Index: index + generatedParameters.Count)).All(pair =>
                        pair.Index < parameters.Length &&
                        ModelBaseMemberCompatibility.AreTypesCompatible(pair.Parameter.Type, new CSharpType(parameters[pair.Index].ParameterType)) &&
                        ModelBaseMemberCompatibility.HasCompatibleDefaultValue(pair.Parameter, parameters[pair.Index]));
        }

        private bool HasCallableInitializationConstructor()
        {
            var requiredProperties = Properties.Where(IsRequiredInitializationProperty).ToArray();
            var constructors = _lastContractType!.Constructors;
            if (constructors.Count == 0)
            {
                // A class with no declared instance constructors has an implicit parameterless constructor.
                return requiredProperties.Length == 0;
            }

            foreach (var constructor in constructors.Where(constructor =>
                MethodSignatureHelper.IsPublicApi(constructor.Signature.Modifiers) &&
                HasSupportedConstructorParameters(constructor.Signature.Parameters)))
            {
                var matches = constructor.Signature.Parameters
                    .Select(parameter => Properties.FirstOrDefault(property =>
                        property.AsParameter.Name == parameter.Name &&
                        property.Type.Equals(parameter.Type, ignoreNullable: true)))
                    .ToArray();
                if (matches.Take(requiredProperties.Length).SequenceEqual(requiredProperties) &&
                    constructor.Signature.Parameters.Skip(requiredProperties.Length)
                        .All(parameter => parameter.DefaultValue is not null) &&
                    HasCallableFrameworkConstructor(requiredProperties
                        .Select(property => property.AsParameter.ToPublicInputParameter()).ToArray(), constructor.Signature.Parameters))
                {
                    return true;
                }
            }
            return false;
        }

        private static bool IsRequiredInitializationProperty(PropertyProvider property)
            => property.WireInfo is { IsRequired: true, IsReadOnly: false } &&
                !property.Type.IsLiteral;

        /// <summary>
        /// Gets the cross-language definition ID from the input model.
        /// </summary>
        public string CrossLanguageDefinitionId { get; }

        /// <inheritdoc/>
        // _systemType may be null when called from base constructor before field assignment.
        protected override string BuildName() => _systemType?.Name ?? string.Empty;

        /// <inheritdoc/>
        protected override string BuildRelativeFilePath()
            => throw new InvalidOperationException("This type should not be writing in generation");

        /// <inheritdoc/>
        // _systemType may be null when called from base constructor before field assignment.
        protected override string BuildNamespace() => _systemType?.Namespace ?? string.Empty;

        /// <inheritdoc/>
        protected override CSharpType? BuildBaseType() => SystemType.BaseType ?? base.BuildBaseType();

        /// <inheritdoc/>
        private protected override bool ShouldUseFullConstructorInDerivedTypes => !_skipDerivedConstructorParameters;

        /// <inheritdoc/>
        private protected override ConstructorProvider BuildFullConstructor()
        {
            if (_lastContractType is null)
            {
                return base.BuildFullConstructor();
            }

            if (_lastContractType.Constructors.Count == 0)
            {
                return new ConstructorProvider(
                    new ConstructorSignature(
                        Type,
                        null,
                        MethodSignatureModifiers.Internal,
                        []),
                    Array.Empty<MethodBodyStatement>(),
                    this);
            }

            if (!TryGetLastContractConstructor(out var constructor, out var matchedProperties))
            {
                return base.BuildFullConstructor();
            }

            // The synthetic full constructor is prepended to derived parameters. Keep its parameters
            // required so a shipped optional parameter cannot precede a required derived parameter.
            var parameters = constructor.Signature.Parameters
                .Zip(matchedProperties)
                .Select(pair => new ParameterProvider(
                    pair.First.Name,
                    pair.First.Description,
                    pair.First.Type,
                    null,
                    pair.First.IsRef,
                    pair.First.IsOut,
                    pair.First.IsIn,
                    pair.First.IsParams,
                    pair.First.Attributes,
                    pair.Second,
                    initializationValue: pair.First.InitializationValue,
                    location: pair.First.Location,
                    wireInfo: pair.First.WireInfo,
                    validation: pair.First.Validation,
                    inputParameter: pair.First.InputParameter))
                .ToArray();

            return new ConstructorProvider(
                new ConstructorSignature(
                    Type,
                    constructor.Signature.Description,
                    MethodSignatureModifiers.Internal,
                    parameters),
                Array.Empty<MethodBodyStatement>(),
                this);
        }

        private bool TryGetLastContractConstructor(
            [NotNullWhen(true)] out ConstructorProvider? constructor,
            [NotNullWhen(true)] out IReadOnlyList<PropertyProvider>? matchedProperties)
        {
            var properties = Properties;
            foreach (var candidate in _lastContractType!.Constructors
                .Where(constructor => MethodSignatureHelper.IsPublicApi(constructor.Signature.Modifiers) &&
                    HasSupportedConstructorParameters(constructor.Signature.Parameters))
                .OrderByDescending(constructor => constructor.Signature.Parameters.Count))
            {
                var matches = candidate.Signature.Parameters
                    .Select(parameter => properties.FirstOrDefault(property =>
                        property.AsParameter.Name == parameter.Name &&
                        property.Type.Equals(parameter.Type, ignoreNullable: true)))
                    .ToArray();
                if (matches.All(property => property is not null) &&
                    InputModel.Properties.All(inputProperty => matches.Any(property =>
                        property is not null &&
                        CodeModelGenerator.Instance.TypeFactory.IsLastContractModelBasePropertyCompatible(
                            SystemType,
                            inputProperty,
                            property))))
                {
                    constructor = candidate;
                    matchedProperties = matches.Select(property => property!).ToArray();
                    return true;
                }
            }

            constructor = null;
            matchedProperties = null;
            return false;
        }

        internal static bool HasSupportedConstructorParameters(IReadOnlyList<ParameterProvider> parameters)
            => parameters.All(parameter =>
                !parameter.IsRef && !parameter.IsOut && !parameter.IsIn && !parameter.IsParams &&
                !parameter.HasUnsupportedDefaultValue && !parameter.HasUnsupportedParameterModifiers);

        /// <inheritdoc/>
        protected internal override PropertyProvider[] BuildProperties()
        {
            if (_lastContractType is null)
            {
                return base.BuildProperties();
            }

            var properties = new List<PropertyProvider>();
            for (var provider = _lastContractType; provider is not null; provider = provider.BaseTypeProvider)
            {
                foreach (var property in provider.Properties.Where(property =>
                    MethodSignatureHelper.IsPublicApi(property.Modifiers) &&
                    !properties.Any(existing => existing.Name == property.Name)))
                {
                    properties.Add(ApplyCurrentInputMetadata(property));
                }
            }
            return [.. properties];
        }

        internal bool HasCompatibleLastContractProperties()
        {
            if (_lastContractType is null)
            {
                return true;
            }

            if (!SystemType.IsFrameworkType)
            {
                return false;
            }

            for (var provider = _lastContractType; provider is not null; provider = provider.BaseTypeProvider)
            {
                if (provider.Properties
                    .Where(property => MethodSignatureHelper.IsPublicApi(property.Modifiers))
                    .Any(property => FindEffectiveFrameworkProperty(property.Name) is not { } candidate ||
                        !IsCompatibleProperty(property, candidate)))
                {
                    return false;
                }
            }

            return true;
        }

        internal bool HasCompatibleLastContractInterfaces(TypeProvider? historicalBase)
        {
            var historical = _lastContractType ?? historicalBase;
            if (historical is null)
            {
                return true;
            }
            return SystemType.IsFrameworkType && historical.Implements.All(previous =>
                SystemType.FrameworkType.GetInterfaces().Any(current =>
                    ModelBaseMemberCompatibility.AreTypesCompatible(previous, new CSharpType(current))));
        }

        internal bool HasCompatibleLastContractNonPropertyMembers()
        {
            if (_lastContractType is null)
            {
                return true;
            }

            if (!SystemType.IsFrameworkType)
            {
                return false;
            }

            for (var provider = _lastContractType; provider is not null; provider = provider.BaseTypeProvider)
            {
                if (provider.Methods
                    .Where(method => MethodSignatureHelper.IsPublicApi(method.Signature.Modifiers))
                    .Any(method => !FindEffectiveFrameworkMethods(method.Signature)
                        .Any(candidate => IsCompatibleMethod(method.Signature, candidate))) ||
                    provider.Fields
                    .Where(field => IsPublicApiField(field.Modifiers))
                    .Any(field => FindEffectiveFrameworkMember(field.Name) is not FieldInfo candidate ||
                        !IsCompatibleField(field, candidate)))
                {
                    return false;
                }
            }

            return true;
        }

        internal IEnumerable<string> GetPublicApiMemberNames()
        {
            if (_lastContractType is not null)
            {
                for (var provider = _lastContractType; provider is not null; provider = provider.BaseTypeProvider)
                {
                    foreach (var property in provider.Properties.Where(property =>
                        MethodSignatureHelper.IsPublicApi(property.Modifiers)))
                    {
                        yield return property.Name;
                    }
                    foreach (var method in provider.Methods.Where(method =>
                        MethodSignatureHelper.IsPublicApi(method.Signature.Modifiers)))
                    {
                        yield return GetPublicApiMemberName(method.Signature.Name);
                    }
                    foreach (var field in provider.Fields.Where(field => IsPublicApiField(field.Modifiers)))
                    {
                        yield return field.Name;
                    }
                }
            }

            foreach (var name in GetFrameworkPublicApiMemberNames())
            {
                yield return name;
            }
        }

        internal IEnumerable<string> GetFrameworkPublicApiMemberNames()
        {
            if (!SystemType.IsFrameworkType)
            {
                yield break;
            }

            const BindingFlags flags = BindingFlags.DeclaredOnly | BindingFlags.Instance |
                BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic;
            foreach (var type in EnumerateFrameworkHierarchy())
            {
                foreach (var property in type.GetProperties(flags).Where(property =>
                    property.GetAccessors(nonPublic: true).Any(IsPublicOrProtected)))
                {
                    yield return property.Name;
                }
                foreach (var method in type.GetMethods(flags).Where(IsPublicOrProtected))
                {
                    yield return method.Name;
                }
                foreach (var @event in type.GetEvents(flags).Where(@event =>
                    @event.GetAddMethod(nonPublic: true) is { } addMethod && IsPublicOrProtected(addMethod)))
                {
                    yield return @event.Name;
                }
                foreach (var field in type.GetFields(flags).Where(IsPublicOrProtected))
                {
                    yield return field.Name;
                }
            }
        }

        private IEnumerable<Type> EnumerateFrameworkHierarchy()
        {
            for (var type = SystemType.FrameworkType; type is not null; type = type.BaseType)
            {
                yield return type;
            }
        }

        private PropertyInfo? FindEffectiveFrameworkProperty(string name)
            => FindEffectiveFrameworkMember(name) as PropertyInfo;

        private MemberInfo? FindEffectiveFrameworkMember(string name)
        {
            const BindingFlags flags = BindingFlags.DeclaredOnly | BindingFlags.Instance |
                BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic;
            foreach (var type in EnumerateFrameworkHierarchy())
            {
                var declaredMembers = type.GetMember(name, flags);
                if (declaredMembers.Length > 0)
                {
                    return declaredMembers.Length == 1 ? declaredMembers[0] : null;
                }
            }
            return null;
        }

        private static bool IsCompatibleProperty(PropertyProvider previous, PropertyInfo current)
        {
            if (previous.HasUnsupportedBaseContract || previous.IsRef || previous.Name != current.Name ||
                current.GetIndexParameters().Length != 0 ||
                current.GetCustomAttributesData().Any(attribute =>
                    attribute.AttributeType.FullName == typeof(System.Runtime.CompilerServices.RequiredMemberAttribute).FullName) ||
                !ModelBaseMemberCompatibility.AreTypesCompatible(previous.Type, new CSharpType(current.PropertyType)) ||
                current.GetMethod is not { } getter ||
                !HasCompatibleAccessibility(previous.Modifiers, getter))
            {
                return false;
            }

            var isStatic = previous.Modifiers.HasFlag(MethodSignatureModifiers.Static);
            if (isStatic != getter.IsStatic ||
                RequiresOverridableProperty(previous.Modifiers) && (!getter.IsVirtual || getter.IsFinal))
            {
                return false;
            }

            if (!previous.Body.HasSetter)
            {
                return true;
            }

            var setterModifiers = previous.Body switch
            {
                AutoPropertyBody autoProperty => autoProperty.SetterModifiers,
                MethodPropertyBody methodProperty => methodProperty.SetterModifiers,
                _ => MethodSignatureModifiers.None
            };
            if (setterModifiers == MethodSignatureModifiers.None)
            {
                setterModifiers = previous.Modifiers;
            }

            return current.SetMethod is { } setter &&
                setter.IsStatic == isStatic &&
                (!RequiresOverridableProperty(previous.Modifiers) || setter.IsVirtual && !setter.IsFinal) &&
                previous.IsInitOnly == IsInitOnly(setter) &&
                HasCompatibleAccessibility(setterModifiers, setter);
        }

        private static bool RequiresOverridableProperty(MethodSignatureModifiers modifiers)
            => !modifiers.HasFlag(MethodSignatureModifiers.Sealed) &&
                (modifiers.HasFlag(MethodSignatureModifiers.Virtual) ||
                    modifiers.HasFlag(MethodSignatureModifiers.Abstract) ||
                    modifiers.HasFlag(MethodSignatureModifiers.Override));

        private static bool IsInitOnly(MethodInfo setter)
            => setter.ReturnParameter.GetRequiredCustomModifiers()
                .Any(modifier => modifier.FullName == typeof(System.Runtime.CompilerServices.IsExternalInit).FullName);

        private MethodInfo[] FindEffectiveFrameworkMethods(MethodSignature previous)
        {
            const BindingFlags flags = BindingFlags.DeclaredOnly | BindingFlags.Instance |
                BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic;
            foreach (var type in EnumerateFrameworkHierarchy())
            {
                var methods = type.GetMethods(flags)
                    .Where(method => HasMatchingMethodIdentity(previous, method))
                    .ToArray();
                if (methods.Length > 0)
                {
                    return methods;
                }
            }
            return [];
        }

        private static bool IsCompatibleMethod(MethodSignature previous, MethodInfo current)
        {
            var currentParameters = current.GetParameters();
            // Generic constraints are not represented by the historical method provider. Fail closed
            // instead of treating equal arity as proof that the old calls still compile.
            if (previous.HasUnsupportedBaseContract || previous.GenericArguments is { Count: > 0 } || current.IsGenericMethod ||
                !HasMatchingMethodIdentity(previous, current) ||
                previous.Modifiers.HasFlag(MethodSignatureModifiers.Static) != current.IsStatic ||
                RequiresOverridableMethod(previous.Modifiers) && (!current.IsVirtual || current.IsFinal) ||
                !HasCompatibleAccessibility(previous.Modifiers, current) ||
                !IsCompatibleReturnType(previous.ReturnType, current.ReturnType))
            {
                return false;
            }

            return previous.Parameters.Zip(currentParameters).All(pair =>
            {
                var isByRef = pair.Second.ParameterType.IsByRef;
                return pair.First.Name == pair.Second.Name &&
                    ModelBaseMemberCompatibility.HasCompatibleDefaultValue(pair.First, pair.Second) &&
                    pair.First.IsRef == (isByRef && !pair.Second.IsIn && !pair.Second.IsOut) &&
                    pair.First.IsIn == pair.Second.IsIn &&
                    pair.First.IsOut == pair.Second.IsOut &&
                    pair.First.IsParams == (pair.Second.GetCustomAttribute<ParamArrayAttribute>() is not null);
            });
        }

        private static bool HasMatchingMethodIdentity(MethodSignature previous, MethodInfo current)
        {
            var currentParameters = current.GetParameters();
            return GetReflectionMethodName(previous.Name) == current.Name &&
                previous.Parameters.Count == currentParameters.Length &&
                (previous.GenericArguments?.Count ?? 0) == current.GetGenericArguments().Length &&
                previous.Parameters.Zip(currentParameters).All(pair =>
                {
                    var currentType = pair.Second.ParameterType;
                    var isByRef = currentType.IsByRef;
                    if (isByRef)
                    {
                        currentType = currentType.GetElementType()!;
                    }
                    return (pair.First.IsRef || pair.First.IsIn || pair.First.IsOut) == isByRef &&
                        ModelBaseMemberCompatibility.AreTypesCompatible(pair.First.Type, new CSharpType(currentType));
                });
        }

        private static string GetReflectionMethodName(string name)
        {
            var accessorSeparator = name.LastIndexOf('.');
            if (accessorSeparator > 0 && name[(accessorSeparator + 1)..] is "add" or "remove")
            {
                return $"{name[(accessorSeparator + 1)..]}_{name[..accessorSeparator]}";
            }
            return name;
        }

        private static string GetPublicApiMemberName(string methodName)
        {
            var accessorSeparator = methodName.LastIndexOf('.');
            return accessorSeparator > 0 && methodName[(accessorSeparator + 1)..] is "add" or "remove"
                ? methodName[..accessorSeparator]
                : methodName;
        }

        private static bool RequiresOverridableMethod(MethodSignatureModifiers modifiers)
            => modifiers.HasFlag(MethodSignatureModifiers.Virtual) ||
                modifiers.HasFlag(MethodSignatureModifiers.Abstract) ||
                modifiers.HasFlag(MethodSignatureModifiers.Override);

        private static bool IsPublicApiField(FieldModifiers modifiers)
            => modifiers.HasFlag(FieldModifiers.Public) ||
                modifiers.HasFlag(FieldModifiers.Protected) && !modifiers.HasFlag(FieldModifiers.Private);

        private static bool IsCompatibleField(FieldProvider previous, FieldInfo current)
            // Historical constant expressions are not necessarily available (e.g. metadata symbols).
            // Constant-value reconciliation is outside this narrow restoration path.
            => !previous.Modifiers.HasFlag(FieldModifiers.Const) && !current.IsLiteral &&
                previous.Name == current.Name &&
                ModelBaseMemberCompatibility.AreTypesCompatible(previous.Type, new CSharpType(current.FieldType)) &&
                previous.Modifiers.HasFlag(FieldModifiers.Static) == current.IsStatic &&
                previous.Modifiers.HasFlag(FieldModifiers.ReadOnly) == current.IsInitOnly &&
                previous.Modifiers.HasFlag(FieldModifiers.Const) == current.IsLiteral &&
                HasCompatibleAccessibility(previous.Modifiers, current);

        private static bool IsCompatibleReturnType(CSharpType? previous, Type current)
            => previous is null
                ? current == typeof(void)
                : ModelBaseMemberCompatibility.AreTypesCompatible(previous, new CSharpType(current));

        private static bool HasCompatibleAccessibility(MethodSignatureModifiers previous, MethodBase current)
            => previous.HasFlag(MethodSignatureModifiers.Public)
                ? current.IsPublic
                : previous.HasFlag(MethodSignatureModifiers.Protected) && IsPublicOrProtected(current);

        private static bool HasCompatibleAccessibility(FieldModifiers previous, FieldInfo current)
            => previous.HasFlag(FieldModifiers.Public)
                ? current.IsPublic
                : previous.HasFlag(FieldModifiers.Protected) && IsPublicOrProtected(current);

        private static bool IsPublicOrProtected(MethodBase method)
            => method.IsPublic || method.IsFamily || method.IsFamilyOrAssembly;

        private static bool IsPublicOrProtected(FieldInfo field)
            => field.IsPublic || field.IsFamily || field.IsFamilyOrAssembly;

        private PropertyProvider ApplyCurrentInputMetadata(PropertyProvider lastContractProperty)
        {
            var matchingInputProperties = InputModel.Properties.Where(property =>
                CodeModelGenerator.Instance.TypeFactory.IsLastContractModelBasePropertyCompatible(
                    SystemType,
                    property,
                    lastContractProperty)).ToArray();
            if (matchingInputProperties.Length != 1 ||
                CodeModelGenerator.Instance.TypeFactory.CreateUncachedProperty(matchingInputProperties[0], this) is not { } property)
            {
                return lastContractProperty;
            }

            // Keep the shipped CLR surface while using the current input as the authority for wire metadata.
            property.Name = lastContractProperty.Name;
            property.Type = lastContractProperty.Type;
            property.Modifiers = lastContractProperty.Modifiers;
            property.Body = lastContractProperty.Body;
            property.IsInitOnly = lastContractProperty.IsInitOnly;
            return property;
        }

        /// <inheritdoc/>
        protected override bool ShouldSkipDerivedModelProperties => true;

        /// <inheritdoc/>
        protected internal override CSharpType[] BuildImplements()
        {
            if (SystemType.IsFrameworkType)
            {
                var frameworkType = SystemType.FrameworkType;
                var typeArguments = frameworkType.IsGenericTypeDefinition
                    ? frameworkType.GetGenericArguments()
                        .Zip(SystemType.Arguments)
                        .ToDictionary(pair => pair.First, pair => pair.Second)
                    : [];

                return [.. frameworkType.GetInterfaces().Select(type => CreateInterfaceType(type, typeArguments))];
            }

            return [.. CodeModelGenerator.Instance.SourceInputModel.FindForTypeInCurrentCompilation(
                    SystemType.Namespace,
                    SystemType.Name,
                    declaringTypeName: SystemType.DeclaringType?.Name,
                    includeReferencedAssemblies: true)?.Implements ?? []];
        }

        private static CSharpType CreateInterfaceType(
            Type type,
            IReadOnlyDictionary<Type, CSharpType> typeArguments)
        {
            if (type.IsGenericParameter && typeArguments.TryGetValue(type, out var typeArgument))
            {
                return typeArgument;
            }

            return type.IsGenericType
                ? new CSharpType(
                    type.GetGenericTypeDefinition(),
                    [.. type.GetGenericArguments().Select(argument => CreateInterfaceType(argument, typeArguments))])
                : new CSharpType(type);
        }

        /// <inheritdoc/>
        public override bool ShouldSkipDerivedSerializationMethodOverrides => true;

        /// <summary>
        /// Framework types manage their own fields; no generated fields needed.
        /// </summary>
        protected internal override FieldProvider[] BuildFields() => [];

        /// <summary>
        /// Framework types have their own serialization; no generated serialization providers needed.
        /// </summary>
        protected override TypeProvider[] BuildSerializationProviders() => [];

        /// <summary>
        /// Framework types manage their own raw data field.
        /// Returns null so derived models create their own.
        /// </summary>
        protected override FieldProvider? BuildRawDataField() => null;
    }
}

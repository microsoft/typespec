// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// cspell:ignore Ldarg Ldfld Stfld

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Reflection.Emit;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    /// <summary>
    /// Tests for <see cref="SystemObjectModelProvider"/> that demonstrate capabilities
    /// missing from the existing <see cref="SystemObjectTypeProvider"/>.
    /// <para>
    /// <see cref="SystemObjectTypeProvider"/> extends <see cref="TypeProvider"/> and cannot
    /// serve as a <see cref="ModelProvider.BaseModelProvider"/>. <see cref="SystemObjectModelProvider"/>
    /// extends <see cref="ModelProvider"/> to fill this gap — enabling derived models to inherit
    /// from framework/system types while getting proper property deduplication, raw data field, and
    /// serialization handling.
    /// </para>
    /// </summary>
    public class SystemObjectModelProviderTests
    {
        /// <summary>
        /// Creates a non-framework CSharpType with the given name and namespace.
        /// Uses the internal constructor accessible via InternalsVisibleTo.
        /// </summary>
        private static CSharpType CreateSystemCSharpType(string name, string ns, CSharpType? baseType = null)
            => new(name, ns, isValueType: false, isNullable: false, declaringType: null,
                   args: Array.Empty<CSharpType>(), isPublic: true, isStruct: false, baseType: baseType);

        public class HiddenPropertyBase
        {
            public string Value { get; set; } = string.Empty;
        }

        public class HiddenPropertyTarget : HiddenPropertyBase
        {
            public new int Value { get; set; }
        }

        public class NonVirtualPropertyTarget
        {
            public string Value { get; set; } = string.Empty;
        }

        public class VirtualMethodBase
        {
            public virtual string GetValue() => string.Empty;
        }

        public class HiddenMethodTarget : VirtualMethodBase
        {
            public new string GetValue() => string.Empty;
        }

        public class InitOnlyPropertyTarget
        {
            public string Value { get; init; } = string.Empty;
        }

        public class StaticPropertyTarget
        {
            public StaticPropertyTarget(string value = "")
            {
                Value = value;
            }

            public static string Value { get; set; } = string.Empty;
        }

        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        // -------------------------------------------------------------------
        // 1. Type hierarchy: ModelProvider vs TypeProvider
        // -------------------------------------------------------------------

        [Test]
        public void SystemObjectModelProvider_IsModelProvider()
        {
            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var inputModel = InputFactory.Model("Resource", properties: []);
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            Assert.IsInstanceOf<ModelProvider>(provider);
        }

        [Test]
        public void FrameworkInterfacesArePopulated()
        {
            var inputModel = InputFactory.Model("Resource", properties: []);
            var provider = new SystemObjectModelProvider(new CSharpType(typeof(List<string>)), inputModel);

            Assert.That(
                provider.Implements,
                Has.Some.EqualTo(new CSharpType(typeof(IEnumerable<string>))));
        }

        [Test]
        public void FrameworkInterfacesUseGeneratedTypeArguments()
        {
            var inputModel = InputFactory.Model("Resource", properties: []);
            var generatedType = CreateSystemCSharpType("GeneratedModel", "Sample.Models");
            var provider = new SystemObjectModelProvider(
                new CSharpType(typeof(List<>), generatedType),
                inputModel);

            Assert.That(
                provider.Implements,
                Has.Some.EqualTo(new CSharpType(typeof(IEnumerable<>), generatedType)));
        }

        [Test]
        public async Task ReferencedInterfacesArePopulated()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var inputModel = InputFactory.Model("Resource", properties: []);
            var provider = new SystemObjectModelProvider(
                CreateSystemCSharpType("ReferencedModel", "TestFramework"),
                inputModel);

            Assert.That(
                provider.Implements,
                Has.Some.EqualTo(new CSharpType(typeof(IDisposable))));
        }

        [TestCase("ref")]
        [TestCase("out")]
        [TestCase("in")]
        [TestCase("params")]
        public void UnsupportedConstructorParameterModifierIsRejected(string modifier)
        {
            var parameter = new ParameterProvider(
                "value",
                $"",
                typeof(string),
                isRef: modifier == "ref",
                isOut: modifier == "out",
                isIn: modifier == "in",
                isParams: modifier == "params");

            Assert.That(
                SystemObjectModelProvider.HasSupportedConstructorParameters([parameter]),
                Is.False);
        }

        [Test]
        public void SystemObjectTypeProvider_IsNotModelProvider()
        {
            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var provider = new SystemObjectTypeProvider(systemType);

            Assert.IsNotInstanceOf<ModelProvider>(provider);
            Assert.IsInstanceOf<TypeProvider>(provider);
        }

        // -------------------------------------------------------------------
        // 2. Can serve as BaseModelProvider for derived models
        //    (SystemObjectTypeProvider cannot because it's not a ModelProvider)
        // -------------------------------------------------------------------

        [Test]
        public void CanServeAsBaseModelProvider()
        {
            var baseProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var baseInputModel = InputFactory.Model("Resource", properties: [baseProp]);

            var derivedProp = InputFactory.Property("Location", InputPrimitiveType.String);
            var derivedInputModel = InputFactory.Model("DerivedResource", properties: [derivedProp], baseModel: baseInputModel);

            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            MockHelpers.LoadMockGenerator(
                inputModelTypes: [baseInputModel, derivedInputModel],
                createModelCore: (model) =>
                {
                    if (model.Name == "Resource")
                    {
                        return new SystemObjectModelProvider(systemType, model);
                    }

                    return new ModelProvider(model);
                });

            var derivedProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derivedProvider);

            // The base should be a SystemObjectModelProvider — impossible with SystemObjectTypeProvider
            Assert.IsNotNull(derivedProvider!.BaseModelProvider);
            Assert.IsInstanceOf<SystemObjectModelProvider>(derivedProvider.BaseModelProvider);
        }

        [Test]
        public void CanRepresentExternalBaseChainWithoutSeparateInheritedProperties()
        {
            var baseSystemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var baseInputModel = InputFactory.Model("Resource", properties: []);
            var baseProvider = new SystemObjectModelProvider(baseSystemType, baseInputModel);

            var inputModel = InputFactory.Model(
                "TrackedResource",
                properties: [InputFactory.Property("resourceType", InputPrimitiveType.String, wireName: "type")]);
            var systemTypeWithBase = CreateSystemCSharpType("TrackedResourceData", "TestFramework", baseSystemType);
            CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[baseSystemType] = baseProvider;

            var provider = new SystemObjectModelProvider(systemTypeWithBase, inputModel, skipDerivedConstructorParameters: true);

            Assert.AreSame(baseProvider, provider.BaseModelProvider);
            Assert.AreEqual(baseProvider.Type, provider.Type.BaseType);
            Assert.AreEqual(1, provider.Properties.Count);
            Assert.AreEqual("ResourceType", provider.Properties[0].Name);
        }

        [Test]
        public void BaseSystemProviderIsCreatedFromInputModelHierarchy()
        {
            var baseInputModel = InputFactory.Model(
                "SystemException",
                properties: [InputFactory.Property("message", InputPrimitiveType.String)]);
            var derivedInputModel = InputFactory.Model(
                "ArgumentException",
                properties: [InputFactory.Property("paramName", InputPrimitiveType.String)],
                baseModel: baseInputModel);

            var baseSystemType = new CSharpType(typeof(SystemException));
            var derivedSystemType = new CSharpType(typeof(ArgumentException));
            MockHelpers.LoadMockGenerator(
                inputModelTypes: [baseInputModel, derivedInputModel],
                createModelCore: model => model == baseInputModel
                    ? new SystemObjectModelProvider(baseSystemType, model)
                    : new SystemObjectModelProvider(derivedSystemType, model));

            var provider = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);

            Assert.IsNotNull(provider);
            Assert.IsNotNull(provider!.BaseModelProvider);
            Assert.IsInstanceOf<SystemObjectModelProvider>(provider.BaseModelProvider);
            Assert.AreEqual("SystemException", provider.BaseModelProvider!.Name);
            Assert.AreEqual("Message", provider.BaseModelProvider.Properties.Single().Name);
        }

        // -------------------------------------------------------------------
        // 3. Property deduplication: properties matching framework base are skipped
        // -------------------------------------------------------------------

        [Test]
        public void DerivedModel_SkipsPropertiesDefinedInSystemObjectBase()
        {
            var baseProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var baseInputModel = InputFactory.Model("Resource", properties: [baseProp]);

            // Derived re-declares "Name" (same as base) + has its own "Location"
            var derivedNameProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var derivedLocationProp = InputFactory.Property("Location", InputPrimitiveType.String);
            var derivedInputModel = InputFactory.Model(
                "TrackedResource",
                properties: [derivedNameProp, derivedLocationProp],
                baseModel: baseInputModel);

            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            MockHelpers.LoadMockGenerator(
                inputModelTypes: [baseInputModel, derivedInputModel],
                createModelCore: (model) =>
                {
                    if (model.Name == "Resource")
                    {
                        return new SystemObjectModelProvider(systemType, model);
                    }

                    return new ModelProvider(model);
                });

            var derived = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derived);

            // "Name" should be skipped (defined in the framework base)
            // Only "Location" should be generated
            var propertyNames = derived!.Properties.Select(p => p.Name).ToList();
            Assert.IsFalse(propertyNames.Contains("Name"),
                "Property 'Name' should be skipped because it is defined in the SystemObjectModelProvider base");
            Assert.IsTrue(propertyNames.Contains("Location"),
                "Property 'Location' should be generated because it is NOT in the base");
        }

        [Test]
        public void DerivedModel_OnlySkipsPropertiesFromSkippingBaseProvider()
        {
            var systemBaseProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var systemBaseInputModel = InputFactory.Model("Resource", properties: [systemBaseProp]);

            var regularBaseProp = InputFactory.Property("MiddleName", InputPrimitiveType.String);
            var regularBaseInputModel = InputFactory.Model("MiddleResource", properties: [regularBaseProp], baseModel: systemBaseInputModel);

            var derivedSystemBaseProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var derivedRegularBaseProp = InputFactory.Property("MiddleName", InputPrimitiveType.String);
            var derivedLocationProp = InputFactory.Property("Location", InputPrimitiveType.String);
            var derivedInputModel = InputFactory.Model(
                "TrackedResource",
                properties: [derivedSystemBaseProp, derivedRegularBaseProp, derivedLocationProp],
                baseModel: regularBaseInputModel);

            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            MockHelpers.LoadMockGenerator(
                inputModelTypes: [systemBaseInputModel, regularBaseInputModel, derivedInputModel],
                createModelCore: (model) =>
                {
                    if (model.Name == "Resource")
                    {
                        return new SystemObjectModelProvider(systemType, model);
                    }

                    return new ModelProvider(model);
                });

            var derived = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derived);

            var propertyNames = derived!.Properties.Select(p => p.Name).ToList();
            Assert.IsFalse(propertyNames.Contains("Name"),
                "Property 'Name' should be skipped because it is defined by the SystemObjectModelProvider ancestor");
            Assert.IsTrue(propertyNames.Contains("MiddleName"),
                "Property 'MiddleName' should not be skipped because it is defined by the regular immediate base provider");
            Assert.IsTrue(propertyNames.Contains("Location"));
        }

        [Test]
        public void RegularBaseModel_DoesNotSkipMatchingProperties()
        {
            // Same setup but with a regular ModelProvider base (not SystemObjectModelProvider)
            var baseProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var baseInputModel = InputFactory.Model("Resource", properties: [baseProp]);

            var derivedNameProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var derivedLocationProp = InputFactory.Property("Location", InputPrimitiveType.String);
            var derivedInputModel = InputFactory.Model(
                "TrackedResource",
                properties: [derivedNameProp, derivedLocationProp],
                baseModel: baseInputModel);

            MockHelpers.LoadMockGenerator(inputModelTypes: [baseInputModel, derivedInputModel]);

            var derived = new ModelProvider(derivedInputModel);

            // With a regular base, both properties should be generated (Name as override)
            var propertyNames = derived.Properties.Select(p => p.Name).ToList();
            Assert.IsTrue(propertyNames.Contains("Name"),
                "Property 'Name' should be generated with override modifier for regular inheritance");
            Assert.IsTrue(propertyNames.Contains("Location"));
        }

        // -------------------------------------------------------------------
        // 4. Raw data field: SystemObjectModelProvider returns null,
        //    so derived models create their own field
        // -------------------------------------------------------------------

        [Test]
        public void SystemObjectModelProvider_HasNoRawDataField_InFields()
        {
            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var inputModel = InputFactory.Model("Resource", properties: []);
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            // SystemObjectModelProvider should have no fields at all (including no raw data field)
            Assert.IsEmpty(provider.Fields,
                "SystemObjectModelProvider should return no fields — the framework type manages its own raw data");
        }

        [Test]
        public void DerivedModel_CreatesOwnRawDataField_WhenBaseIsSystemObject()
        {
            var baseProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var baseInputModel = InputFactory.Model("Resource", properties: [baseProp]);
            var derivedProp = InputFactory.Property("Location", InputPrimitiveType.String);
            var derivedInputModel = InputFactory.Model("TrackedResource", properties: [derivedProp], baseModel: baseInputModel);

            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            MockHelpers.LoadMockGenerator(
                inputModelTypes: [baseInputModel, derivedInputModel],
                createModelCore: (model) =>
                {
                    if (model.Name == "Resource")
                    {
                        return new SystemObjectModelProvider(systemType, model);
                    }

                    return new ModelProvider(model);
                });

            var derived = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derived);

            // Derived model should have its own raw data field since the system base has none
            var rawDataField = derived!.Fields.FirstOrDefault(f => f.Name == "_additionalBinaryDataProperties");
            Assert.IsNotNull(rawDataField,
                "Derived model should create its own raw data field when SystemObjectModelProvider base has none");
        }

        // -------------------------------------------------------------------
        // 5. Empty members: SystemObjectModelProvider generates nothing
        //    (framework type provides everything at runtime)
        // -------------------------------------------------------------------

        [Test]
        public void SystemObjectModelProvider_Properties_ComeFromInputModel()
        {
            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var prop = InputFactory.Property("Name", InputPrimitiveType.String);
            var inputModel = InputFactory.Model("Resource", properties: [prop]);
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            // Properties are now built from the input model so derived models can see
            // base properties for constructor building and property deduplication.
            var propertyNames = provider.Properties.Select(p => p.Name).ToList();
            Assert.IsTrue(propertyNames.Contains("Name"),
                "SystemObjectModelProvider should expose properties from the input model for derived model constructor building");
        }

        [Test]
        public void SystemObjectModelProvider_Fields_AreEmpty()
        {
            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var inputModel = InputFactory.Model("Resource", properties: []);
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            Assert.IsEmpty(provider.Fields,
                "SystemObjectModelProvider should not generate fields");
        }

        [Test]
        public void SystemObjectModelProvider_Constructors_AreBuiltFromInputModel()
        {
            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var prop = InputFactory.Property("Name", InputPrimitiveType.String, isRequired: true);
            var inputModel = InputFactory.Model("Resource", properties: [prop]);
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            // Constructors are now built from the input model so derived models can use
            // BaseModelProvider.FullConstructor.Signature.Parameters for constructor building.
            Assert.IsNotEmpty(provider.Constructors,
                "SystemObjectModelProvider should build constructors from the input model for derived model constructor building");
        }

        [Test]
        public void SystemObjectModelProvider_SerializationProviders_AreEmpty()
        {
            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var inputModel = InputFactory.Model("Resource", properties: []);
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            Assert.IsEmpty(provider.SerializationProviders,
                "SystemObjectModelProvider should not generate serialization providers");
        }

        // -------------------------------------------------------------------
        // 6. Name and namespace come from the system CSharpType
        // -------------------------------------------------------------------

        [Test]
        public void Name_ComesFromSystemType_ViaSystemTypeProperty()
        {
            var systemType = CreateSystemCSharpType("TrackedResourceData", "Azure.ResourceManager.Models");
            var inputModel = InputFactory.Model("TrackedResource", properties: [], access: "internal");
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            // The SystemType property always reflects the original system type
            Assert.AreEqual("TrackedResourceData", provider.SystemType.Name);
        }

        [Test]
        public void Namespace_ComesFromSystemType_ViaSystemTypeProperty()
        {
            var systemType = CreateSystemCSharpType("TrackedResourceData", "Azure.ResourceManager.Models");
            var inputModel = InputFactory.Model("TrackedResource", properties: [], access: "internal");
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            Assert.AreEqual("Azure.ResourceManager.Models", provider.SystemType.Namespace);
        }

        [Test]
        public void Name_ComesFromSystemType_WhenTypeNotEarlyCached()
        {
            // When access is not "public", the ModelProvider constructor doesn't call AddTypeToKeep,
            // so Type is not eagerly evaluated and BuildName() is deferred until after _systemType is set.
            var systemType = CreateSystemCSharpType("TrackedResourceData", "Azure.ResourceManager.Models");
            var inputModel = InputFactory.Model("TrackedResource", properties: [], access: "internal");
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            Assert.AreEqual("TrackedResourceData", provider.Name);
            Assert.AreEqual("Azure.ResourceManager.Models", provider.Type.Namespace);
        }

        [Test]
        public void CrossLanguageDefinitionId_ComesFromInputModel()
        {
            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var inputModel = InputFactory.Model("Resource", properties: []);
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            Assert.AreEqual(inputModel.CrossLanguageDefinitionId, provider.CrossLanguageDefinitionId);
        }

        // -------------------------------------------------------------------
        // 7. BuildRelativeFilePath throws — system types should not be written
        // -------------------------------------------------------------------

        [Test]
        public void BuildRelativeFilePath_Throws()
        {
            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var inputModel = InputFactory.Model("Resource", properties: []);
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            Assert.Throws<InvalidOperationException>(() => _ = provider.RelativeFilePath);
        }

        // -------------------------------------------------------------------
        // 8. Constructor validation
        // -------------------------------------------------------------------

        [Test]
        public void Constructor_ThrowsOnNullSystemType()
        {
            var inputModel = InputFactory.Model("Resource", properties: []);
            Assert.Throws<ArgumentNullException>(() => new SystemObjectModelProvider(null!, inputModel));
        }

        // -------------------------------------------------------------------
        // 9. A derived discriminated model forwards its discriminator value to a
        //    SystemObjectModelProvider base constructor. This is impossible with
        //    SystemObjectTypeProvider because it cannot serve as a BaseModelProvider.
        // -------------------------------------------------------------------

        [Test]
        public void DerivedDiscriminatedModel_ForwardsDiscriminatorToSystemObjectModelProviderBase()
        {
            var baseInputModel = InputFactory.Model(
                "BaseModel",
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
                ]);
            var derivedInputModel = InputFactory.Model(
                "DerivedModel",
                baseModel: baseInputModel,
                discriminatedKind: "one",
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                    InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
                ]);

            var systemType = CreateSystemCSharpType("BaseModelData", "TestFramework");
            MockHelpers.LoadMockGenerator(
                inputModelTypes: [baseInputModel, derivedInputModel],
                createModelCore: (model) =>
                    model.Name == "BaseModel"
                        ? new SystemObjectModelProvider(systemType, model)
                        : new ModelProvider(model));

            var derivedProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derivedProvider);
            Assert.IsInstanceOf<SystemObjectModelProvider>(derivedProvider!.BaseModelProvider);

            var publicCtor = derivedProvider.Constructors.FirstOrDefault(
                c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);

            var initializer = publicCtor!.Signature.Initializer;
            Assert.IsNotNull(initializer);
            Assert.IsTrue(initializer!.IsBase);

            // The base constructor call must forward the discriminator literal "one".
            Assert.IsTrue(
                initializer.Arguments.Any(a => a.ToDisplayString() == "\"one\""),
                "Expected the base constructor call to forward the discriminator value \"one\". " +
                "Actual arguments: " + string.Join(", ", initializer.Arguments.Select(a => a.ToDisplayString())));
        }

        // -------------------------------------------------------------------
        // 10. End-to-end: a base model marked external (External metadata) is mapped to a
        //     SystemObjectModelProvider by the default factory, is not emitted, and a derived
        //     discriminated model forwards its discriminator value to the external base.
        // -------------------------------------------------------------------

        [Test]
        public void ExternalBaseModel_MapsToSystemObjectModelProvider_AndForwardsDiscriminator()
        {
            var baseInputModel = InputFactory.Model(
                "BaseModel",
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
                ],
                external: new InputExternalTypeMetadata("System.Exception", null, null));
            var derivedInputModel = InputFactory.Model(
                "DerivedModel",
                baseModel: baseInputModel,
                discriminatedKind: "one",
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                    InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
                ]);

            // No createModelCore override: the default (real) CreateModelCore must perform the mapping.
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModelTypes: [baseInputModel, derivedInputModel]);

            // The external base maps to a SystemObjectModelProvider rather than a generated model.
            var baseProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);
            Assert.IsInstanceOf<SystemObjectModelProvider>(baseProvider);

            // The derived model uses it as its base model provider.
            var derivedProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derivedProvider);
            Assert.IsInstanceOf<SystemObjectModelProvider>(derivedProvider!.BaseModelProvider);

            // The derived constructor forwards the discriminator value to the external base.
            var publicCtor = derivedProvider.Constructors.FirstOrDefault(
                c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);
            var initializer = publicCtor!.Signature.Initializer;
            Assert.IsNotNull(initializer);
            Assert.IsTrue(initializer!.IsBase);
            Assert.IsTrue(
                initializer.Arguments.Any(a => a.ToDisplayString() == "\"one\""),
                "Expected the base constructor call to forward the discriminator value \"one\". " +
                "Actual arguments: " + string.Join(", ", initializer.Arguments.Select(a => a.ToDisplayString())));

            // The external base is not emitted as a generated type.
            Assert.IsFalse(
                CodeModelGenerator.Instance.OutputLibrary.TypeProviders.Any(t => t is SystemObjectModelProvider),
                "External base models should not be emitted as generated types.");
        }

        [Test]
        public void ImplicitLastContractConstructorMustBeCallableOnMappedTarget()
        {
            var inputModel = InputFactory.Model("MappedBase", properties: []);
            var mappedBase = new SystemObjectModelProvider(
                new CSharpType(typeof(System.Globalization.CultureInfo)),
                inputModel,
                new TestTypeProvider());

            Assert.That(mappedBase.HasReconstructibleLastContractConstructor, Is.False,
                "An implicit parameterless last-contract constructor cannot call a mapped target without a parameterless constructor");
        }

        [Test]
        public void ExplicitLastContractConstructorMustBeCallableOnMappedTarget()
        {
            var inputModel = InputFactory.Model(
                "MappedBase",
                properties: [InputFactory.Property("code", InputPrimitiveType.Int32, isRequired: true)]);
            MockHelpers.LoadMockGenerator(inputModelTypes: [inputModel]);

            var property = new ModelProvider(inputModel).Properties.Single();
            var constructorOwner = new TestTypeProvider();
            var lastContractConstructor = new ConstructorProvider(
                new ConstructorSignature(
                    new CSharpType(typeof(Exception)),
                    $"",
                    MethodSignatureModifiers.Public,
                    [property.AsParameter]),
                Array.Empty<MethodBodyStatement>(),
                constructorOwner);
            var lastContractType = new TestTypeProvider(
                properties: [property],
                constructors: [lastContractConstructor]);
            var mappedBase = new SystemObjectModelProvider(
                new CSharpType(typeof(Exception)),
                inputModel,
                lastContractType);

            Assert.That(mappedBase.HasReconstructibleLastContractConstructor, Is.False,
                "A reconstructed last-contract constructor must match an accessible constructor on the mapped target");
        }

        [Test]
        public void LastContractMemberNamesIncludeMappedFrameworkSurface()
        {
            var inputModel = InputFactory.Model("MappedBase", properties: []);
            var mappedBase = new SystemObjectModelProvider(
                new CSharpType(typeof(Exception)),
                inputModel,
                new TestTypeProvider());

            Assert.That(mappedBase.GetPublicApiMemberNames(), Does.Contain(nameof(Exception.Message)),
                "Collision checks must include members added by the actual mapped framework target");
        }

        [Test]
        public void LastContractMappingRejectsGeneratedFrameworkMemberCollision()
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var derivedModel = InputFactory.Model(
                "DerivedModel",
                properties: [InputFactory.Property("message", InputPrimitiveType.String)],
                baseModel: currentBase);
            MockHelpers.LoadMockGenerator(inputModelTypes: [currentBase, derivedModel]);

            var mappedBase = new SystemObjectModelProvider(
                new CSharpType(typeof(Exception)),
                currentBase,
                new TestTypeProvider());
            var compatibility = new ModelBaseTypeCompatibility(new ModelProvider(derivedModel));

            Assert.That(compatibility.CanUseMappedBase(mappedBase), Is.False,
                "A generated property must not hide a member added by the mapped framework target");
        }

        [Test]
        public void MappedInputPropertyMustMatchExactlyOneEffectiveProperty()
        {
            var mappedInput = InputFactory.Model(
                "MappedInput",
                properties: [InputFactory.Property("message", InputPrimitiveType.String, isRequired: true)]);
            var currentBase = InputFactory.Model(
                "CurrentBase",
                properties: [InputFactory.Property("message", InputPrimitiveType.String, isRequired: true)]);
            var derivedModel = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            MockHelpers.LoadMockGenerator(
                inputModelTypes: [mappedInput, currentBase, derivedModel],
                isLastContractModelBasePropertyCompatible: (_, _, _) => false);

            var mappedBase = new SystemObjectModelProvider(new CSharpType(typeof(Exception)), mappedInput);
            var compatibility = new ModelBaseTypeCompatibility(new ModelProvider(derivedModel));

            Assert.That(compatibility.CanUseMappedBase(mappedBase), Is.False,
                "Every mapped input property must match exactly one effective property");
        }

        [Test]
        public void LastContractMappingRejectsMissingHistoricalProperty()
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var derivedModel = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            MockHelpers.LoadMockGenerator(inputModelTypes: [currentBase, derivedModel]);

            var memberOwner = new TestTypeProvider();
            var historicalProperty = new PropertyProvider(
                $"",
                MethodSignatureModifiers.Public,
                typeof(string),
                "RemovedProperty",
                new AutoPropertyBody(true, MethodSignatureModifiers.Public),
                memberOwner);
            var mappedBase = new SystemObjectModelProvider(
                new CSharpType(typeof(Exception)),
                currentBase,
                new TestTypeProvider(properties: [historicalProperty]));
            var compatibility = new ModelBaseTypeCompatibility(new ModelProvider(derivedModel));

            Assert.That(compatibility.CanUseMappedBase(mappedBase), Is.False,
                "Restoration must not expose a historical property absent from the mapped target");
        }

        [Test]
        public void LastContractMappingRejectsCompatiblePropertyHiddenByIncompatibleTargetProperty()
        {
            Assert.That(CanUseMappedBaseWithHistoricalProperty(
                typeof(HiddenPropertyTarget),
                MethodSignatureModifiers.Public), Is.False,
                "A compatible farther-base property must not bypass an incompatible effective target property");
        }

        [Test]
        public void LastContractMappingRejectsNonVirtualTargetForVirtualHistoricalProperty()
        {
            Assert.That(CanUseMappedBaseWithHistoricalProperty(
                typeof(NonVirtualPropertyTarget),
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual), Is.False,
                "A historical virtual property requires an overridable mapped target property");
        }

        [Test]
        public void LastContractMappingRejectsInitOnlyTargetForOrdinaryHistoricalSetter()
        {
            Assert.That(CanUseMappedBaseWithHistoricalProperty(
                typeof(InitOnlyPropertyTarget),
                MethodSignatureModifiers.Public), Is.False,
                "An ordinary historical setter must not map to an init-only target setter");
        }

        [Test]
        public void LastContractMappingRejectsShimmedInitOnlyTargetForOrdinaryHistoricalSetter()
        {
            Assert.That(CanUseMappedBaseWithHistoricalProperty(
                CreateShimmedInitOnlyPropertyTarget(),
                MethodSignatureModifiers.Public), Is.False,
                "Init-only detection must use the marker metadata name rather than its assembly identity");
        }

        private static Type CreateShimmedInitOnlyPropertyTarget()
        {
            var assembly = AssemblyBuilder.DefineDynamicAssembly(
                new AssemblyName("ShimmedInitOnlyPropertyTargetAssembly"),
                AssemblyBuilderAccess.Run);
            var module = assembly.DefineDynamicModule("Main");
            var marker = module.DefineType(
                "System.Runtime.CompilerServices.IsExternalInit",
                TypeAttributes.Public | TypeAttributes.Sealed).CreateType()!;
            var target = module.DefineType("Test.ShimmedInitOnlyPropertyTarget", TypeAttributes.Public);
            target.DefineDefaultConstructor(MethodAttributes.Public);

            var field = target.DefineField("_value", typeof(string), FieldAttributes.Private);
            var getter = target.DefineMethod(
                "get_Value",
                MethodAttributes.Public | MethodAttributes.SpecialName | MethodAttributes.HideBySig,
                typeof(string),
                Type.EmptyTypes);
            var getterBody = getter.GetILGenerator();
            getterBody.Emit(OpCodes.Ldarg_0);
            getterBody.Emit(OpCodes.Ldfld, field);
            getterBody.Emit(OpCodes.Ret);

            var setter = target.DefineMethod(
                "set_Value",
                MethodAttributes.Public | MethodAttributes.SpecialName | MethodAttributes.HideBySig,
                CallingConventions.HasThis,
                typeof(void),
                [marker],
                null,
                [typeof(string)],
                null,
                null);
            var setterBody = setter.GetILGenerator();
            setterBody.Emit(OpCodes.Ldarg_0);
            setterBody.Emit(OpCodes.Ldarg_1);
            setterBody.Emit(OpCodes.Stfld, field);
            setterBody.Emit(OpCodes.Ret);

            var property = target.DefineProperty("Value", PropertyAttributes.None, typeof(string), null);
            property.SetGetMethod(getter);
            property.SetSetMethod(setter);
            return target.CreateType()!;
        }

        private static bool CanUseMappedBaseWithHistoricalProperty(
            Type frameworkType,
            MethodSignatureModifiers modifiers)
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var derivedModel = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            MockHelpers.LoadMockGenerator(inputModelTypes: [currentBase, derivedModel]);

            var memberOwner = new TestTypeProvider();
            var historicalProperty = new PropertyProvider(
                $"",
                modifiers,
                typeof(string),
                "Value",
                new AutoPropertyBody(true, MethodSignatureModifiers.Public),
                memberOwner);
            var mappedBase = new SystemObjectModelProvider(
                new CSharpType(frameworkType),
                currentBase,
                new TestTypeProvider(properties: [historicalProperty]));
            var compatibility = new ModelBaseTypeCompatibility(new ModelProvider(derivedModel));
            return compatibility.CanUseMappedBase(mappedBase);
        }

        [Test]
        public void LastContractMappingRejectsStaticHistoricalPropertyForInstanceInput()
        {
            var currentBase = InputFactory.Model(
                "CurrentBase",
                properties: [InputFactory.Property("value", InputPrimitiveType.String)]);
            var derivedModel = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            MockHelpers.LoadMockGenerator(inputModelTypes: [currentBase, derivedModel]);

            var memberOwner = new TestTypeProvider();
            var historicalProperty = new PropertyProvider(
                $"",
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                typeof(string),
                "Value",
                new AutoPropertyBody(true, MethodSignatureModifiers.Public),
                memberOwner);
            var historicalConstructor = new ConstructorProvider(
                new ConstructorSignature(
                    new CSharpType(typeof(StaticPropertyTarget)),
                    $"",
                    MethodSignatureModifiers.Public,
                    [new ParameterProvider("value", $"", typeof(string), defaultValue: Snippet.Default)]),
                Array.Empty<MethodBodyStatement>(),
                memberOwner);
            var mappedBase = new SystemObjectModelProvider(
                new CSharpType(typeof(StaticPropertyTarget)),
                currentBase,
                new TestTypeProvider(
                    properties: [historicalProperty],
                    constructors: [historicalConstructor]));
            var compatibility = new ModelBaseTypeCompatibility(new ModelProvider(derivedModel));

            Assert.That(compatibility.CanUseMappedBase(mappedBase), Is.False,
                "A static historical property cannot represent current instance wire metadata");
        }

        [Test]
        public void LastContractMappingRejectsMissingHistoricalMethod()
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var derivedModel = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            MockHelpers.LoadMockGenerator(inputModelTypes: [currentBase, derivedModel]);

            var memberOwner = new TestTypeProvider();
            var historicalMethod = new MethodProvider(
                new MethodSignature(
                    "RemovedMethod",
                    $"",
                    MethodSignatureModifiers.Public,
                    null,
                    $"",
                    []),
                Snippet.ThrowExpression(Snippet.Null),
                memberOwner);
            var mappedBase = new SystemObjectModelProvider(
                new CSharpType(typeof(Exception)),
                currentBase,
                new TestTypeProvider(methods: [historicalMethod]));
            var compatibility = new ModelBaseTypeCompatibility(new ModelProvider(derivedModel));

            Assert.That(compatibility.CanUseMappedBase(mappedBase), Is.False,
                "Restoration must not remove a method inherited through the shipped base");
        }

        [Test]
        public void LastContractMappingRejectsHiddenHistoricalVirtualMethod()
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var derivedModel = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            MockHelpers.LoadMockGenerator(inputModelTypes: [currentBase, derivedModel]);

            var memberOwner = new TestTypeProvider();
            var historicalMethod = new MethodProvider(
                new MethodSignature(
                    "GetValue",
                    $"",
                    MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                    typeof(string),
                    $"",
                    []),
                Snippet.ThrowExpression(Snippet.Null),
                memberOwner);
            var mappedBase = new SystemObjectModelProvider(
                new CSharpType(typeof(HiddenMethodTarget)),
                currentBase,
                new TestTypeProvider(methods: [historicalMethod]));
            var compatibility = new ModelBaseTypeCompatibility(new ModelProvider(derivedModel));

            Assert.That(compatibility.CanUseMappedBase(mappedBase), Is.False,
                "The effective hiding declaration must not fall back to a compatible inherited method");
        }

        [Test]
        public void LastContractMappingRejectsMissingHistoricalField()
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var derivedModel = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            MockHelpers.LoadMockGenerator(inputModelTypes: [currentBase, derivedModel]);

            var memberOwner = new TestTypeProvider();
            var historicalField = new FieldProvider(
                FieldModifiers.Public,
                typeof(string),
                "RemovedField",
                memberOwner);
            var mappedBase = new SystemObjectModelProvider(
                new CSharpType(typeof(Exception)),
                currentBase,
                new TestTypeProvider(fields: [historicalField]));
            var compatibility = new ModelBaseTypeCompatibility(new ModelProvider(derivedModel));

            Assert.That(compatibility.CanUseMappedBase(mappedBase), Is.False,
                "Restoration must not remove a field inherited through the shipped base");
        }

        [Test]
        public void LastContractOptionalParameterIsRequiredOnSyntheticFullConstructor()
        {
            var inputModel = InputFactory.Model(
                "MappedBase",
                properties: [InputFactory.Property("optionalBase", InputPrimitiveType.String)]);
            MockHelpers.LoadMockGenerator(inputModelTypes: [inputModel]);

            var property = new ModelProvider(inputModel).Properties.Single();
            var constructorOwner = new TestTypeProvider();
            var optionalParameter = new ParameterProvider(
                property.AsParameter.Name,
                $"",
                property.Type,
                defaultValue: Snippet.Default);
            var lastContractConstructor = new ConstructorProvider(
                new ConstructorSignature(
                    new CSharpType(typeof(Exception)),
                    $"",
                    MethodSignatureModifiers.Public,
                    [optionalParameter]),
                Array.Empty<MethodBodyStatement>(),
                constructorOwner);
            var lastContractType = new TestTypeProvider(
                properties: [property],
                constructors: [lastContractConstructor]);
            var mappedBase = new SystemObjectModelProvider(
                new CSharpType(typeof(Exception)),
                inputModel,
                lastContractType);

            Assert.That(mappedBase.FullConstructor.Signature.Parameters.Single().DefaultValue, Is.Null,
                "Synthetic full-constructor parameters must be required before they are prepended to derived parameters");
        }

        // -------------------------------------------------------------------
        // 11. Fallback: an external model whose type cannot be resolved is generated
        //     normally (as a regular ModelProvider) rather than being dropped.
        // -------------------------------------------------------------------

        [Test]
        public void ExternalModel_ThatCannotBeResolved_FallsBackToNormalGeneration()
        {
            var inputModel = InputFactory.Model(
                "Widget",
                properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)],
                // Not a real framework type and no package metadata, so resolution fails.
                external: new InputExternalTypeMetadata("Some.Unresolvable.ExternalType", null, null));

            MockHelpers.LoadMockGenerator(inputModelTypes: [inputModel]);

            var provider = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);

            // Unresolvable external metadata: no SystemObjectModelProvider mapping; generate normally.
            Assert.IsNotNull(provider);
            Assert.IsNotInstanceOf<SystemObjectModelProvider>(provider);

            // And the model is still emitted as a generated type.
            Assert.IsTrue(
                CodeModelGenerator.Instance.OutputLibrary.TypeProviders.Any(t => t == provider),
                "An external model that cannot be resolved should still be generated.");
        }

        // -------------------------------------------------------------------
        // 12. A property typed as an external model resolves to the external type, and the
        //     external model itself is not generated.
        // -------------------------------------------------------------------

        [Test]
        public void PropertyTypedAsExternalModel_ResolvesToExternalType_AndExternalModelIsNotGenerated()
        {
            var externalModel = InputFactory.Model(
                "ExternalThing",
                properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)],
                external: new InputExternalTypeMetadata("System.Exception", null, null));
            var containerModel = InputFactory.Model(
                "Container",
                properties: [InputFactory.Property("thing", externalModel, isRequired: true)]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [externalModel, containerModel]);

            // The external model maps to a SystemObjectModelProvider and is not emitted.
            var externalProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(externalModel);
            Assert.IsInstanceOf<SystemObjectModelProvider>(externalProvider);
            Assert.IsFalse(
                CodeModelGenerator.Instance.OutputLibrary.TypeProviders.Any(t => t is SystemObjectModelProvider),
                "External models must not be emitted as generated types.");

            // A property typed as the external model resolves to the external framework type.
            var container = CodeModelGenerator.Instance.TypeFactory.CreateModel(containerModel) as ModelProvider;
            Assert.IsNotNull(container);
            var thingProperty = container!.Properties.FirstOrDefault(p => p.Name == "Thing");
            Assert.IsNotNull(thingProperty);
            Assert.AreEqual("Exception", thingProperty!.Type.Name);
            Assert.AreEqual("System", thingProperty.Type.Namespace);
        }
    }
}

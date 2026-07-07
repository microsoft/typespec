// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
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
        private static CSharpType CreateSystemCSharpType(string name, string ns)
            => new(name, ns, isValueType: false, isNullable: false, declaringType: null,
                   args: Array.Empty<CSharpType>(), isPublic: true, isStruct: false);

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

            var systemType = CreateSystemCSharpType("TrackedResourceData", "TestFramework");
            var inputModel = InputFactory.Model(
                "TrackedResource",
                properties: [InputFactory.Property("resourceType", InputPrimitiveType.String, wireName: "type")]);

            var provider = new SystemObjectModelProvider(systemType, inputModel, baseProvider);

            Assert.AreSame(baseProvider, provider.BaseModelProvider);
            Assert.AreEqual(baseProvider.Type, provider.Type.BaseType);
            Assert.AreEqual(1, provider.Properties.Count);
            Assert.AreEqual("ResourceType", provider.Properties[0].Name);
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

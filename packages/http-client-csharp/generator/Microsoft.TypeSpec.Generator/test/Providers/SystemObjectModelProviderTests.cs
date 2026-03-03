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
    /// from framework/system types while getting proper property dedup, raw data field, and
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
                        return new SystemObjectModelProvider(systemType, model);
                    return new ModelProvider(model);
                });

            var derivedProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derivedProvider);

            // The base should be a SystemObjectModelProvider — impossible with SystemObjectTypeProvider
            Assert.IsNotNull(derivedProvider!.BaseModelProvider);
            Assert.IsInstanceOf<SystemObjectModelProvider>(derivedProvider.BaseModelProvider);
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
                        return new SystemObjectModelProvider(systemType, model);
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
                        return new SystemObjectModelProvider(systemType, model);
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
        public void SystemObjectModelProvider_Properties_AreEmpty()
        {
            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var prop = InputFactory.Property("Name", InputPrimitiveType.String);
            var inputModel = InputFactory.Model("Resource", properties: [prop]);
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            Assert.IsEmpty(provider.Properties,
                "SystemObjectModelProvider should not generate properties — the framework type already has them");
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
        public void SystemObjectModelProvider_Constructors_AreEmpty()
        {
            var systemType = CreateSystemCSharpType("ResourceData", "TestFramework");
            var inputModel = InputFactory.Model("Resource", properties: []);
            var provider = new SystemObjectModelProvider(systemType, inputModel);

            Assert.IsEmpty(provider.Constructors,
                "SystemObjectModelProvider should not generate constructors");
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
    }
}

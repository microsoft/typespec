// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    /// <summary>
    /// Tests that serialization methods use correct modifiers when a model's base is
    /// <see cref="SystemObjectModelProvider"/>. This validates behavior that would be
    /// impossible with <see cref="SystemObjectTypeProvider"/> (which cannot serve as
    /// <see cref="ModelProvider.BaseModelProvider"/>).
    /// </summary>
    internal class SystemObjectModelSerializationTests
    {
        /// <summary>
        /// Creates a derived model with a SystemObjectModelProvider base and returns its serialization.
        /// </summary>
        private static (ModelProvider Model, MrwSerializationTypeDefinition Serialization) CreateDerivedModelWithSystemBase()
        {
            var baseProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var baseInputModel = InputFactory.Model("Resource", properties: [baseProp]);
            var derivedProp = InputFactory.Property("Location", InputPrimitiveType.String);
            var derivedInputModel = InputFactory.Model("TrackedResource", properties: [derivedProp], baseModel: baseInputModel);

            // Use typeof(object) as a stand-in framework type.
            // SystemObjectModelProvider extracts name/namespace from the CSharpType.
            var systemType = new CSharpType(typeof(object));
            var systemBase = new SystemObjectModelProvider(systemType, baseInputModel);

            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createModelCore: (model) =>
                {
                    if (model.Name == "Resource")
                        return systemBase;
                    return new ModelProvider(model);
                },
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider mp
                        ? [new MrwSerializationTypeDefinition(modelType, mp)]
                        : []);
            generator.Object.TypeFactory.RootInputModels.Add(derivedInputModel);
            generator.Object.TypeFactory.RootOutputModels.Add(derivedInputModel);

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derived);
            Assert.IsInstanceOf<SystemObjectModelProvider>(derived!.BaseModelProvider);

            var serializations = derived.SerializationProviders;
            Assert.AreEqual(1, serializations.Count);
            return (derived, (MrwSerializationTypeDefinition)serializations[0]);
        }

        /// <summary>
        /// Creates a derived model with a regular (non-system) ModelProvider base and returns its serialization.
        /// </summary>
        private static (ModelProvider Model, MrwSerializationTypeDefinition Serialization) CreateDerivedModelWithRegularBase()
        {
            var baseProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var baseInputModel = InputFactory.Model("Resource", properties: [baseProp]);
            var derivedProp = InputFactory.Property("Location", InputPrimitiveType.String);
            var derivedInputModel = InputFactory.Model("TrackedResource", properties: [derivedProp], baseModel: baseInputModel);

            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider mp
                        ? [new MrwSerializationTypeDefinition(modelType, mp)]
                        : []);
            generator.Object.TypeFactory.RootInputModels.Add(derivedInputModel);
            generator.Object.TypeFactory.RootOutputModels.Add(derivedInputModel);

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derived);
            Assert.IsNotInstanceOf<SystemObjectModelProvider>(derived!.BaseModelProvider);

            var serializations = derived.SerializationProviders;
            Assert.AreEqual(1, serializations.Count);
            return (derived, (MrwSerializationTypeDefinition)serializations[0]);
        }

        // -------------------------------------------------------------------
        // JsonModelWriteCore: always 'override' for both system and regular base
        // (the framework base type defines JsonModelWriteCore, so we override it)
        // -------------------------------------------------------------------

        [Test]
        public void JsonModelWriteCore_IsOverride_WhenBaseIsSystemObject()
        {
            var (_, serialization) = CreateDerivedModelWithSystemBase();
            var method = serialization.BuildJsonModelWriteCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "JsonModelWriteCore should be 'override' even with SystemObjectModelProvider base");
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual),
                "JsonModelWriteCore should NOT be 'virtual' when base exists");
        }

        [Test]
        public void JsonModelWriteCore_IsOverride_WhenBaseIsRegularModel()
        {
            var (_, serialization) = CreateDerivedModelWithRegularBase();
            var method = serialization.BuildJsonModelWriteCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "JsonModelWriteCore should be 'override' with regular base too");
        }

        // -------------------------------------------------------------------
        // PersistableModelWriteCore: 'virtual' with system base, 'override' with regular
        // (the framework base already implements this; derived model re-introduces it)
        // -------------------------------------------------------------------

        [Test]
        public void PersistableModelWriteCore_IsVirtual_WhenBaseIsSystemObject()
        {
            var (_, serialization) = CreateDerivedModelWithSystemBase();
            var method = serialization.BuildPersistableModelWriteCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual),
                "PersistableModelWriteCore should be 'virtual' when base is SystemObjectModelProvider " +
                "(framework already has this method; derived re-introduces, not overrides)");
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "PersistableModelWriteCore should NOT be 'override' with SystemObjectModelProvider base");
        }

        [Test]
        public void PersistableModelWriteCore_IsOverride_WhenBaseIsRegularModel()
        {
            var (_, serialization) = CreateDerivedModelWithRegularBase();
            var method = serialization.BuildPersistableModelWriteCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "PersistableModelWriteCore should be 'override' with regular base model");
        }

        // -------------------------------------------------------------------
        // PersistableModelCreateCore: 'virtual' with system base, 'override' with regular
        // -------------------------------------------------------------------

        [Test]
        public void PersistableModelCreateCore_IsVirtual_WhenBaseIsSystemObject()
        {
            var (_, serialization) = CreateDerivedModelWithSystemBase();
            var method = serialization.BuildPersistableModelCreateCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual),
                "PersistableModelCreateCore should be 'virtual' when base is SystemObjectModelProvider");
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "PersistableModelCreateCore should NOT be 'override' with SystemObjectModelProvider base");
        }

        [Test]
        public void PersistableModelCreateCore_IsOverride_WhenBaseIsRegularModel()
        {
            var (_, serialization) = CreateDerivedModelWithRegularBase();
            var method = serialization.BuildPersistableModelCreateCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "PersistableModelCreateCore should be 'override' with regular base model");
        }

        // -------------------------------------------------------------------
        // JsonModelCreateCore: 'virtual' with system base, 'override' with regular
        // -------------------------------------------------------------------

        [Test]
        public void JsonModelCreateCore_IsVirtual_WhenBaseIsSystemObject()
        {
            var (_, serialization) = CreateDerivedModelWithSystemBase();
            var method = serialization.BuildJsonModelCreateCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual),
                "JsonModelCreateCore should be 'virtual' when base is SystemObjectModelProvider");
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "JsonModelCreateCore should NOT be 'override' with SystemObjectModelProvider base");
        }

        [Test]
        public void JsonModelCreateCore_IsOverride_WhenBaseIsRegularModel()
        {
            var (_, serialization) = CreateDerivedModelWithRegularBase();
            var method = serialization.BuildJsonModelCreateCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "JsonModelCreateCore should be 'override' with regular base model");
        }
    }
}

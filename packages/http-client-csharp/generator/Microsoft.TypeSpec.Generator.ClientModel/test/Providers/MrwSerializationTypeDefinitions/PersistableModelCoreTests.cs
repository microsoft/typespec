// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class PersistableModelCoreTests
    {
        public PersistableModelCoreTests()
        {
            MockHelpers.LoadMockGenerator(createSerializationsCore: (inputType, typeProvider)
                => inputType is InputModelType modeltype ? [new MockMrwProvider(modeltype, (typeProvider as ModelProvider)!)] : []);
        }

        private class MockMrwProvider : MrwSerializationTypeDefinition
        {
            public MockMrwProvider(InputModelType inputModel, ModelProvider modelProvider)
                : base(inputModel, modelProvider)
            {
            }

            protected override MethodProvider[] BuildMethods()
            {
                return [.. base.BuildMethods().Where(m => m.Signature.Name.Equals("PersistableModelWriteCore"))];
            }

            protected override FieldProvider[] BuildFields() => [];
            protected override ConstructorProvider[] BuildConstructors() => [];
        }

        [Test]
        public void TestBuildPersistableModelCreateCoreMethod_DerivedType()
        {
            var inputDerived = InputFactory.Model("mockDerivedModel");
            var inputBase = InputFactory.Model("mockBaseModel", derivedModels: [inputDerived]);
            var (baseModel, baseSerialization) = MrwSerializationTypeDefinitionTests.CreateModelAndSerialization(inputBase);
            var (derivedModel, derivedSerialization) = MrwSerializationTypeDefinitionTests.CreateModelAndSerialization(inputDerived);

            var method = derivedSerialization.BuildPersistableModelCreateCoreMethod();

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("PersistableModelCreateCore", methodSignature?.Name);
            Assert.IsNull(methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            // for derived model, the return type of this method should be the same as the overridden base method
            Assert.AreEqual(baseModel.Type, methodSignature?.ReturnType);

            // Check method modifiers
            var expectedModifiers = MethodSignatureModifiers.Protected | MethodSignatureModifiers.Override;
            Assert.AreEqual(expectedModifiers, methodSignature?.Modifiers, "Method modifiers do not match the expected value.");

            // Validate body
            var methodBody = method?.BodyStatements;
            Assert.IsNotNull(methodBody);
        }
    }
}

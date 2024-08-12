// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class PersistableModelCoreTests
    {
        public PersistableModelCoreTests()
        {
            MockHelpers.LoadMockPlugin(createSerializationsCore: (inputType, typeProvider)
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
            var inputBase = new InputModelType("mockBaseModel", "mockNamespace", "public", null, null, InputModelTypeUsage.Input | InputModelTypeUsage.Output, [], null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var inputDerived = new InputModelType("mockDerivedModel", "mockNamespace", "public", null, null, InputModelTypeUsage.Input | InputModelTypeUsage.Output,
                [], inputBase, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            ((List<InputModelType>)inputBase.DerivedModels).Add(inputDerived);
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

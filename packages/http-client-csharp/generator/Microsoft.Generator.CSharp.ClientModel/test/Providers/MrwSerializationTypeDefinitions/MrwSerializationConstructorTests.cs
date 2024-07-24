// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Input.InputTypes;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class MrwSerializationConstructorTests
    {
        public MrwSerializationConstructorTests()
        {
            MockHelpers.LoadMockPlugin(createSerializationsCore: inputType
                => inputType is InputModelType modeltype ? [new MockMrwProvider(modeltype)] : []);
        }

        private class MockMrwProvider : MrwSerializationTypeDefinition
        {
            public MockMrwProvider(InputModelType inputModel)
                : base(inputModel)
            {
            }

            protected override MethodProvider[] BuildMethods() => [];

            protected override FieldProvider[] BuildFields() => [];
        }

        [Test]
        public void TestBuildConstructors()
        {
            var baseProperties = new List<InputModelProperty>
            {
                new InputModelProperty("prop1", "prop1", string.Empty, InputPrimitiveType.String, true, false, false, Array.Empty<InputDecoratorInfo>()),
                new InputModelProperty("prop2", "prop2", string.Empty, InputPrimitiveType.String, false, false, false, Array.Empty<InputDecoratorInfo>()),
            };
            var derivedProperties = new List<InputModelProperty>
            {
                new InputModelProperty("prop3", "prop3", string.Empty, InputPrimitiveType.String, true, false, false, Array.Empty<InputDecoratorInfo>()),
                new InputModelProperty("prop4", "prop4", string.Empty, InputPrimitiveType.String, false, false, false, Array.Empty<InputDecoratorInfo>()),
            };
            var inputBase = new InputModelType("baseModel", "baseModel", null, null, null, InputModelTypeUsage.Input, baseProperties, null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false, Array.Empty<InputDecoratorInfo>());
            var inputDerived = new InputModelType("derivedModel", "derivedModel", null, null, null, InputModelTypeUsage.Input, derivedProperties, inputBase, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false, Array.Empty<InputDecoratorInfo>());
            ((List<InputModelType>)inputBase.DerivedModels).Add(inputDerived);

            var (baseModel, baseSerialization) = MrwSerializationTypeDefinitionTests.CreateModelAndSerialization(inputBase);
            var (derivedModel, derivedSerialization) = MrwSerializationTypeDefinitionTests.CreateModelAndSerialization(inputDerived);

            var baseCtors = baseSerialization.Constructors;
            var derivedCtors = derivedSerialization.Constructors;
            Assert.AreEqual(2, baseCtors.Count);
            Assert.AreEqual(2, derivedCtors.Count);
            // the second ctor of the ctors should be parameterless
            Assert.AreEqual(0, baseCtors[1].Signature.Parameters.Count);
            Assert.AreEqual(0, derivedCtors[1].Signature.Parameters.Count);
            // the first ctor should contain certain number of parameters
            var baseParameters = baseCtors[0].Signature.Parameters;
            var derivedParameters = derivedCtors[0].Signature.Parameters;
            Assert.AreEqual(3, baseParameters.Count); // 2 properties + raw data
            Assert.AreEqual(5, derivedParameters.Count); // 4 properties + raw data
            Assert.AreEqual("prop1", baseParameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), baseParameters[0].Type);
            Assert.AreEqual("prop2", baseParameters[1].Name);
            Assert.AreEqual(new CSharpType(typeof(string), true), baseParameters[1].Type);
            Assert.AreEqual("serializedAdditionalRawData", baseParameters[2].Name);
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, BinaryData>)), baseParameters[2].Type);
            Assert.AreEqual("prop1", baseParameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedParameters[0].Type);
            Assert.AreEqual("prop2", baseParameters[1].Name);
            Assert.AreEqual(new CSharpType(typeof(string), true), derivedParameters[1].Type);
            Assert.AreEqual("serializedAdditionalRawData", derivedParameters[2].Name);
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, BinaryData>)), derivedParameters[2].Type);
            Assert.AreEqual("prop3", derivedParameters[3].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedParameters[3].Type);
            Assert.AreEqual("prop4", derivedParameters[4].Name);
            Assert.AreEqual(new CSharpType(typeof(string), true), derivedParameters[4].Type);
        }
    }
}

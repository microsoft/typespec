// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class DeserializationTests
    {
        public DeserializationTests()
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
                return [.. base.BuildMethods().Where(m => m.Signature.Name.StartsWith("Deserialize"))];
            }

            protected override FieldProvider[] BuildFields() => [];
            protected override ConstructorProvider[] BuildConstructors() => [];
        }

        [Test]
        public void DeserializeStruct()
        {
            var inputModel = InputFactory.Model("TestModel", modelAsStruct: true);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(mrwProvider);
            var writer = new TypeProviderWriter(mrwProvider!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [TestCaseSource(nameof(TestDeserializationStatementTestCases))]
        public void TestDeserializationStatement(InputModelProperty prop, bool hasNullCheck, bool hasNullAssignment)
        {
            var inputModel = InputFactory.Model("TestModel", properties: [prop]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(mrwProvider);

            var deserializationMethod = mrwProvider!.Methods.Where(m => m.Signature.Name.StartsWith("Deserialize")).FirstOrDefault();
            Assert.IsNotNull(deserializationMethod);

            var deserializationStatements = deserializationMethod!.BodyStatements;

            Assert.AreEqual(hasNullCheck, deserializationStatements!.ToDisplayString().Contains(
               "if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))"));
            Assert.AreEqual(hasNullAssignment, deserializationStatements!.ToDisplayString().Contains("prop1 = null;"));
        }

        public static IEnumerable<TestCaseData> TestDeserializationStatementTestCases
        {
            get
            {
                // non-nullable string property
                yield return new TestCaseData(
                    InputFactory.Property("prop1", InputPrimitiveType.String),
                    false,
                    false);
                // nullable string property
                yield return new TestCaseData(
                    InputFactory.Property("prop1", new InputNullableType(InputPrimitiveType.String)),
                    true,
                    true);
                // required string property
                yield return new TestCaseData(
                    InputFactory.Property("prop1", InputPrimitiveType.String, isRequired: true),
                    false,
                    false);
                // reference type property
                yield return new TestCaseData(
                    InputFactory.Property("prop1", InputFactory.Model("TestModel2")),
                    true,
                    false);
            }
        }
    }
}

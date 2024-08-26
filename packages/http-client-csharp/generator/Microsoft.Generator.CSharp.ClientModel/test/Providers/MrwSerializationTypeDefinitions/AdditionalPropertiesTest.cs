// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    internal class AdditionalPropertiesTest
    {
        [TestCaseSource(nameof(TestBuildDeserializationMethodTestCases))]
        public void TestBuildDeserializationMethod(
            InputType additionalPropsValueType,
            string expectedValueTypeName,
            string? expectedValidation)
        {
            var inputModel = InputFactory.Model("cat",
                properties:
                [
                    InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
                ],
                additionalProperties: additionalPropsValueType);
            MockHelpers.LoadMockPlugin(inputModels: () => [inputModel]);

            var model = ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializations = model!.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(serializations);
            var deserializationMethod = serializations!.BuildDeserializationMethod();
            Assert.IsNotNull(deserializationMethod);

            var signature = deserializationMethod?.Signature;

            Assert.IsNotNull(signature);
            Assert.AreEqual(model.Type, signature?.ReturnType);

            var methodBody = deserializationMethod?.BodyStatements;
            Assert.IsNotNull(methodBody);

            var methodBodyString = methodBody!.ToDisplayString();
            var expectedDeclaration = $"global::System.Collections.Generic.IDictionary<string, {expectedValueTypeName}> additionalProperties";
            Assert.IsTrue(methodBodyString.Contains(expectedDeclaration));

            if (expectedValidation != null)
            {
                Assert.IsTrue(methodBodyString.Contains(expectedValidation));
            }

            // validate return statement
            Assert.IsTrue(methodBodyString.Contains("return new global::sample.namespace.Models.Cat(color, additionalProperties, serializedAdditionalRawData);"));
        }

        [Test]
        public void TestBuildJsonModelWriteCore()
        {
            var inputModel = InputFactory.Model("cat",
               properties:
               [
                   InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
               ],
               additionalProperties: InputPrimitiveType.String);
            MockHelpers.LoadMockPlugin(inputModels: () => [inputModel]);

            var model = ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            var serializations = model!.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(serializations);

            var writeCoreMethod = serializations!.BuildJsonModelWriteCoreMethod();

            Assert.IsNotNull(writeCoreMethod);
            var methodBody = writeCoreMethod?.BodyStatements;
            Assert.IsNotNull(methodBody);

            var methodBodyString = methodBody!.ToDisplayString();

            var expectedDeclaration = $"foreach (var item in AdditionalProperties)";
            Assert.IsTrue(methodBodyString.Contains(expectedDeclaration));
        }

        public static IEnumerable<TestCaseData> TestBuildDeserializationMethodTestCases
        {
            get
            {
                // string additional properties
                yield return new TestCaseData(
                    InputPrimitiveType.String,
                    "string",
                    "if (((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.String)");
                // bool additional properties
                yield return new TestCaseData(
                    InputPrimitiveType.Boolean,
                    "bool",
                    "if (((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.True)");
                // float additional properties
                yield return new TestCaseData(
                    InputPrimitiveType.Float32,
                    "float",
                    "if (prop.Value.TryGetSingle(out float value))");
            }
        }
    }
}

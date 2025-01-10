// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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
            string[] expectedValueTypeNames,
            string[] expectedValueKindChecks)
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
            // validate the additional properties variable declarations
            for (var i = 0; i < expectedValueTypeNames.Length; i++)
            {
                var expectedVariableName = i == 0 ? "additionalProperties" : $"additional{expectedValueTypeNames[i].ToCleanName()}Properties";
                var expectedDeclaration = $"global::System.Collections.Generic.IDictionary<string, {expectedValueTypeNames[i].ToVariableName()}> {expectedVariableName}";
                Assert.IsTrue(methodBodyString.Contains(expectedDeclaration, StringComparison.InvariantCultureIgnoreCase));
            }

            // validate the additional properties value kind check statements
            foreach (var expectedValueKindCheck in expectedValueKindChecks)
            {
                Assert.IsTrue(methodBodyString.Contains(expectedValueKindCheck));
            }

            // validate return statement
            if (expectedValueTypeNames.Length > 1)
            {
                // skip the first value type name as it is already included in the return statement
                var additionalPropertiesVariables = "additionalProperties, " + string.Join(", ", expectedValueTypeNames.Skip(1).Select(v => $"additional{v.ToCleanName()}Properties,"));
                var expectedReturnStatement = $"return new global::Sample.Models.Cat(color, {additionalPropertiesVariables} additionalBinaryDataProperties);";
                Assert.IsTrue(methodBodyString.Contains(expectedReturnStatement));
            }
            else
            {
                Assert.IsTrue(methodBodyString.Contains("return new global::Sample.Models.Cat(color, additionalProperties, additionalBinaryDataProperties);"));
            }
        }

        [TestCaseSource(nameof(TestBuildJsonModelWriteCoreTestCases))]
        public void TestBuildJsonModelWriteCore(
            InputType additionalPropsValueType)
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

            var writeCoreMethod = serializations!.BuildJsonModelWriteCoreMethod();

            Assert.IsNotNull(writeCoreMethod);
            var methodBody = writeCoreMethod?.BodyStatements;
            Assert.IsNotNull(methodBody);

            var methodBodyString = methodBody!.ToDisplayString();
            var additionalPropertiesProps = model.Properties.Where(p => p.BackingField != null && p.Name.StartsWith("Additional")).ToList();

            // validate each additional property is serialized
            foreach (var additionalProperty in additionalPropertiesProps)
            {
                var expectedSerializationStatement = $"foreach (var item in {additionalProperty.Name})";
                Assert.IsTrue(methodBodyString.Contains(expectedSerializationStatement));
            }
        }

        public static IEnumerable<TestCaseData> TestBuildDeserializationMethodTestCases
        {
            get
            {
                // string additional properties
                yield return new TestCaseData(
                    InputPrimitiveType.String,
                    new string[] { "string" },
                    new string[] { "case global::System.Text.Json.JsonValueKind.String:", "additionalProperties.Add(prop.Name, prop.Value.GetString());" });
                // bool additional properties
                yield return new TestCaseData(
                    InputPrimitiveType.Boolean,
                    new string[] { "bool" },
                    new string[]
                    {
                        "case (global::System.Text.Json.JsonValueKind.True || global::System.Text.Json.JsonValueKind.False):",
                        "additionalProperties.Add(prop.Name, prop.Value.GetBoolean());"
                    });
                // float additional properties
                yield return new TestCaseData(
                    InputPrimitiveType.Float32,
                    new string[] { "float" },
                    new string[]
                    {
                        "case global::System.Text.Json.JsonValueKind.Number:",
                        "if (prop.Value.TryGetSingle(out float floatValue))",
                        "additionalProperties.Add(prop.Name, floatValue);"
                    });
                // union additional properties
                yield return new TestCaseData(
                    new InputUnionType("union", [InputPrimitiveType.String, InputPrimitiveType.Float64]),
                    new string[] { "string", "double" },
                    new string[]
                    {
                        "case global::System.Text.Json.JsonValueKind.String:",
                        "additionalProperties.Add(prop.Name, prop.Value.GetString());",
                        "case global::System.Text.Json.JsonValueKind.Number:",
                        "if (prop.Value.TryGetDouble(out double doubleValue))",
                        "additionalDoubleProperties.Add(prop.Name, doubleValue);"
                    });
            }
        }

        public static IEnumerable<TestCaseData> TestBuildJsonModelWriteCoreTestCases
        {
            get
            {
                // string additional properties
                yield return new TestCaseData(InputPrimitiveType.String);
                // bool additional properties
                yield return new TestCaseData(InputPrimitiveType.Boolean);
                // float additional properties
                yield return new TestCaseData(InputPrimitiveType.Float32);
                // union additional properties
                yield return new TestCaseData(new InputUnionType("union", [InputPrimitiveType.String, InputPrimitiveType.Float64]));
            }
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    internal class AdditionalPropertiesTest
    {
        [TestCaseSource(nameof(TestBuildDeserializationMethodTestCases))]
        public void TestBuildDeserializationMethod(
            InputType additionalPropsValueType,
            string[] expectedValueTypeNames,
            string[] expectedValueKindChecks)
        {
            var inputModel = InputFactory.Model("cat", properties:
                [
                    InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
                ],
                additionalProperties: additionalPropsValueType);
            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);

            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
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
                var expectedVariableName = i == 0 ? "additionalProperties" : $"additional{expectedValueTypeNames[i].ToIdentifierName()}Properties";
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
                var additionalPropertiesVariables = "additionalProperties, " + string.Join(", ", expectedValueTypeNames.Skip(1).Select(v => $"additional{v.ToIdentifierName()}Properties,"));
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
            var inputModel = InputFactory.Model("cat", properties:
               [
                   InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
               ],
               additionalProperties: additionalPropsValueType);
            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);

            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
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
                        "case (global::System.Text.Json.JsonValueKind.True or global::System.Text.Json.JsonValueKind.False):",
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

        [Test]
        public void TestAdditionalPropertiesVariableNameConsistency()
        {
            // This test validates the fix for the bug where the variable name was inconsistent
            // when a property with backing field _additionalBinaryDataProperties exists
            // The variable declaration should use the same name as the variable usage
            var inputModel = InputFactory.Model("TestModel",
                properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)],
                additionalProperties: InputPrimitiveType.Any);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);

            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
            var serializations = model!.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(serializations);

            var deserializationMethod = serializations!.BuildDeserializationMethod();
            Assert.IsNotNull(deserializationMethod);

            var methodBodyString = deserializationMethod!.BodyStatements!.ToDisplayString();

            // Check that the variable is declared
            var hasDeclaration = methodBodyString.Contains("IDictionary<string, global::System.BinaryData> additionalProperties = new")
                || methodBodyString.Contains("IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties = new");

            Assert.IsTrue(hasDeclaration, "Expected to find variable declaration for additional properties");

            // Determine which variable name was declared
            var usesPropertyName = methodBodyString.Contains("IDictionary<string, global::System.BinaryData> additionalProperties = new");
            var usesFieldName = methodBodyString.Contains("IDictionary<string, global::System.BinaryData> additionalBinaryDataProperties = new");

            // Check that the same variable name is used consistently in Add calls
            if (usesPropertyName)
            {
                // If declared as additionalProperties, it should be used as additionalProperties
                Assert.IsTrue(methodBodyString.Contains("additionalProperties.Add(prop.Name,"),
                    "Variable declared as 'additionalProperties' should be used with the same name");
                // And should NOT be used with a different name
                Assert.IsFalse(methodBodyString.Contains("additionalBinaryDataProperties.Add(prop.Name,"),
                    "Variable declared as 'additionalProperties' should not be referenced as 'additionalBinaryDataProperties'");
            }
            else if (usesFieldName)
            {
                // If declared as additionalBinaryDataProperties, it should be used as additionalBinaryDataProperties
                Assert.IsTrue(methodBodyString.Contains("additionalBinaryDataProperties.Add(prop.Name,"),
                    "Variable declared as 'additionalBinaryDataProperties' should be used with the same name");
                // And should NOT be used with a different name
                Assert.IsFalse(methodBodyString.Contains("additionalProperties.Add(prop.Name,") && !methodBodyString.Contains("IDictionary<string, global::System.BinaryData> additionalProperties = new"),
                    "Variable declared as 'additionalBinaryDataProperties' should not be referenced as 'additionalProperties'");
            }
        }
    }
}

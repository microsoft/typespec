// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
        public async Task TestBuildDeserializationMethod_WithObjectAdditionalPropertiesBackwardCompatibility()
        {
            // Create a model with unknown additional properties
            var inputModel = InputFactory.Model(
                "TestModel",
                properties: [InputFactory.Property("Name", InputPrimitiveType.String, isRequired: true)],
                additionalProperties: InputPrimitiveType.Any);

            await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
            Assert.IsNotNull(model, "Model should be created");

            var serializations = model!.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(serializations, "Serialization provider should exist");

            var deserializationMethod = serializations!.BuildDeserializationMethod();
            Assert.IsNotNull(deserializationMethod, "Deserialization method should be created");

            var signature = deserializationMethod?.Signature;
            Assert.IsNotNull(signature, "Method signature should exist");
            Assert.AreEqual(model.Type, signature?.ReturnType, "Return type should match model type");

            var methodBody = deserializationMethod?.BodyStatements;
            Assert.IsNotNull(methodBody, "Method body should exist");

            var methodBodyString = methodBody!.ToDisplayString();

            // Verify variable declaration with object type for backward compatibility
            Assert.IsTrue(methodBodyString.Contains("global::System.Collections.Generic.IDictionary<string, object> additionalProperties"),
                "Should declare IDictionary<string, object> variable for backward compatibility");

            // Verify dictionary initialization with ChangeTrackingDictionary
            Assert.IsTrue(methodBodyString.Contains("new global::Sample.ChangeTrackingDictionary<string, object>()"),
                "Should initialize ChangeTrackingDictionary with object type");

            // Verify foreach loop over JsonElement properties
            Assert.IsTrue(methodBodyString.Contains("foreach (var prop in element.EnumerateObject())"),
                "Should enumerate over JsonElement properties");

            // Verify property name check for known property
            Assert.IsTrue(methodBodyString.Contains("prop.NameEquals(\"name\"u8)") || methodBodyString.Contains("prop.NameEquals(\"Name\"u8)"),
                "Should check for property name");

            // Verify GetString() is used for the Name property
            Assert.IsTrue(methodBodyString.Contains("prop.Value.GetString()"),
                "Should use GetString() for string property deserialization");

            // Verify GetObject() method is used for additional properties deserialization
            Assert.IsTrue(methodBodyString.Contains("additionalProperties.Add(prop.Name, prop.Value.GetObject())"),
                "Should use GetObject() for deserializing object values into additionalProperties");

            // Verify return statement with proper constructor call
            Assert.IsTrue(methodBodyString.Contains("return new global::Sample.Models.TestModel(name, additionalProperties)"),
                "Return statement should call constructor with name and additionalProperties");

            // Verify no additionalBinaryDataProperties parameter in constructor call for object type
            Assert.IsFalse(methodBodyString.Contains("return new global::Sample.Models.TestModel(name, additionalProperties, additionalBinaryDataProperties)"),
                "Should not include additionalBinaryDataProperties parameter when using object type");
        }

        [Test]
        public async Task TestBuildJsonModelWriteCore_WithObjectAdditionalPropertiesBackwardCompatibility()
        {
            // Create a model with unknown additional properties
            var inputModel = InputFactory.Model(
                "TestModel",
                properties: [InputFactory.Property("Name", InputPrimitiveType.String, isRequired: true)],
                additionalProperties: InputPrimitiveType.Any);

            await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
            Assert.IsNotNull(model, "Model should be created");

            var serializations = model!.SerializationProviders.FirstOrDefault() as MrwSerializationTypeDefinition;
            Assert.IsNotNull(serializations, "Serialization provider should exist");

            var writeCoreMethod = serializations!.BuildJsonModelWriteCoreMethod();
            Assert.IsNotNull(writeCoreMethod, "Write method should be created");

            var methodBody = writeCoreMethod?.BodyStatements;
            Assert.IsNotNull(methodBody, "Method body should exist");

            var methodBodyString = methodBody!.ToDisplayString();

            // Verify that AdditionalProperties property exists and has object type
            var additionalPropertiesProperty = model.Properties.FirstOrDefault(p => p.Name == "AdditionalProperties");
            Assert.IsNotNull(additionalPropertiesProperty, "AdditionalProperties property should exist");
            Assert.IsTrue(additionalPropertiesProperty!.Type.IsDictionary, "Property should be a dictionary");
            Assert.AreEqual(typeof(object), additionalPropertiesProperty.Type.Arguments[1].FrameworkType,
                "Value type should be object for backward compatibility");

            // Verify format check
            Assert.IsTrue(methodBodyString.Contains("options.Format"),
                "Should check options.Format");
            Assert.IsTrue(methodBodyString.Contains("if ((format != \"J\"))"),
                "Should validate JSON format");
            Assert.IsTrue(methodBodyString.Contains("throw new global::System.FormatException"),
                "Should throw FormatException for unsupported formats");

            // Verify serialization of the Name property
            Assert.IsTrue(methodBodyString.Contains("writer.WritePropertyName(\"name\"u8)") ||
                         methodBodyString.Contains("writer.WritePropertyName(\"Name\"u8)"),
                "Should write Name property name");
            Assert.IsTrue(methodBodyString.Contains("writer.WriteStringValue(Name)"),
                "Should write Name property value");

            // Verify foreach loop over AdditionalProperties
            var expectedForeachStatement = $"foreach (var item in {additionalPropertiesProperty.Name})";
            Assert.IsTrue(methodBodyString.Contains(expectedForeachStatement),
                "Should iterate over AdditionalProperties");

            // Verify property key is written
            Assert.IsTrue(methodBodyString.Contains("writer.WritePropertyName(item.Key)"),
                "Should write additional property key");

            // Verify property value is written with generic WriteObjectValue for object type
            Assert.IsTrue(methodBodyString.Contains("writer.WriteObjectValue<object>(item.Value, options)"),
                "Should use WriteObjectValue<object> for object-typed additional properties");
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.PostProcessing
{
    public class ClientBodyDependencyPostProcessingTests
    {
        [Test]
        public async Task OperationBodyParameterModelDoesNotBecomePublic()
        {
            var requestModel = InputFactory.Model("RequestBody");
            var parameter = InputFactory.BodyParameter("body", requestModel, isRequired: true);
            var operation = InputFactory.Operation("Create", parameters: [parameter], httpMethod: "POST");
            var method = InputFactory.BasicServiceMethod("Create", operation);
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertInternalModels([requestModel], [client], ["RequestBody"]);
        }

        [Test]
        public async Task OperationResponseBodyModelRemainsPublicAsRootOutputModel()
        {
            var responseModel = InputFactory.Model("ResponseBody");
            var operation = InputFactory.Operation("Get", responses: [InputFactory.OperationResponse(bodytype: responseModel)]);
            var method = InputFactory.BasicServiceMethod(
                "Get",
                operation,
                response: InputFactory.ServiceMethodResponse(InputPrimitiveType.String, []));
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertPublicModels([responseModel], [client], ["ResponseBody"]);
        }

        [Test]
        public async Task NestedBodyModelGraphDoesNotBecomePublic()
        {
            var nestedModel = InputFactory.Model("NestedToolParameter");
            var toolModel = InputFactory.Model(
                "ToolConfig",
                properties: [InputFactory.Property("Parameter", nestedModel)]);
            var parameter = InputFactory.BodyParameter("tool", toolModel, isRequired: true);
            var operation = InputFactory.Operation("Configure", parameters: [parameter], httpMethod: "POST");
            var method = InputFactory.BasicServiceMethod("Configure", operation);
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertInternalModels([toolModel, nestedModel], [client], ["ToolConfig", "NestedToolParameter"]);
        }

        private static async Task GenerateAndAssertInternalModels(
            InputModelType[] models,
            InputClient[] clients,
            string[] modelNames)
            => await GenerateAndAssertModels(models, clients, modelNames, shouldBePublic: false);

        private static async Task GenerateAndAssertPublicModels(
            InputModelType[] models,
            InputClient[] clients,
            string[] modelNames)
            => await GenerateAndAssertModels(models, clients, modelNames, shouldBePublic: true);

        private static async Task GenerateAndAssertModels(
            InputModelType[] models,
            InputClient[] clients,
            string[] modelNames,
            bool shouldBePublic)
        {
            var outputPath = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
            Directory.CreateDirectory(outputPath);
            try
            {
                await MockHelpers.LoadMockGeneratorAsync(
                    inputModels: () => models,
                    clients: () => clients,
                    configuration: "{\"package-name\": \"Sample\", \"disable-xml-docs\": true}",
                    outputPath: outputPath);

                await new CSharpGen().ExecuteAsync();

                foreach (var modelName in modelNames)
                {
                    var modelPath = Path.Combine(outputPath, "src", "Generated", "Models", $"{modelName}.cs");
                    Assert.IsTrue(File.Exists(modelPath), $"Expected generated model file '{modelPath}'.");
                    var text = File.ReadAllText(modelPath);
                    if (shouldBePublic)
                    {
                        StringAssert.Contains($"public partial class {modelName}", text, $"{modelName} should be public.");
                    }
                    else
                    {
                        StringAssert.Contains($"internal partial class {modelName}", text, $"{modelName} should be internal.");
                        StringAssert.DoesNotContain($"public partial class {modelName}", text, $"{modelName} should not be public.");
                    }
                }

                var modelFactoryPath = Path.Combine(outputPath, "src", "Generated", "SampleModelFactory.cs");
                if (File.Exists(modelFactoryPath))
                {
                    var modelFactoryText = File.ReadAllText(modelFactoryPath);
                    foreach (var modelName in modelNames)
                    {
                        if (shouldBePublic)
                        {
                            StringAssert.Contains($" {modelName}(", modelFactoryText, $"Model factory method for {modelName} should be generated.");
                        }
                        else
                        {
                            StringAssert.DoesNotContain($" {modelName}(", modelFactoryText, $"Model factory method for {modelName} should not be generated.");
                        }
                    }
                }
            }
            finally
            {
                if (Directory.Exists(outputPath))
                {
                    Directory.Delete(outputPath, recursive: true);
                }
            }
        }
    }
}

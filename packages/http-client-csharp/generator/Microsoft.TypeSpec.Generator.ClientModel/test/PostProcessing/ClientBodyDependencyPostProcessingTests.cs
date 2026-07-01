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

        [Test]
        public async Task NonDiscriminatorDerivedBodyModelDoesNotBecomePublicFromPublicBase()
        {
            var baseTool = InputFactory.Model("BaseTool");
            var concreteTool = InputFactory.Model(
                "ConcreteTool",
                properties: [InputFactory.Property("Name", InputPrimitiveType.String)],
                baseModel: baseTool);
            var operation = InputFactory.Operation("Get", responses: [InputFactory.OperationResponse(bodytype: baseTool)]);
            var method = InputFactory.BasicServiceMethod("Get", operation, response: InputFactory.ServiceMethodResponse(baseTool, []));
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertMixedModels(
                [baseTool, concreteTool],
                [client],
                publicModelNames: ["BaseTool"],
                internalModelNames: ["ConcreteTool"]);
        }

        [Test]
        public async Task PublicModelSignatureDependencyIsPromotedToPublic()
        {
            var internalDependency = InputFactory.Model("InternalDependency", access: "internal");
            var responseModel = InputFactory.Model(
                "ResponseBody",
                properties: [InputFactory.Property("Dependency", internalDependency)]);
            var operation = InputFactory.Operation("Get", responses: [InputFactory.OperationResponse(bodytype: responseModel)]);
            var method = InputFactory.BasicServiceMethod("Get", operation, response: InputFactory.ServiceMethodResponse(responseModel, []));
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertPublicModels([responseModel, internalDependency], [client], ["ResponseBody", "InternalDependency"]);
        }

        [Test]
        public async Task AzureClientPublicMethodSignatureReferencesStayPublic()
        {
            var signatureModel = InputFactory.Model("SignatureModel", @namespace: "Azure.Sample.Models");
            var methodParameter = InputFactory.MethodParameter("signature", signatureModel, isRequired: true);
            var operation = InputFactory.Operation(
                "Create",
                parameters: [InputFactory.BodyParameter("signature", signatureModel, isRequired: true)],
                httpMethod: "POST");
            var method = InputFactory.BasicServiceMethod("Create", operation, parameters: [methodParameter]);
            var client = InputFactory.Client("SampleClient", clientNamespace: "Azure.Sample", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [],
                models: [signatureModel],
                clients: [client],
                customFiles: [],
                expectedFiles: [],
                publicModelNames: ["SignatureModel"],
                packageName: "Azure.Sample");
        }

        [Test]
        public async Task BasePreservedDerivedModelTraversesTransitiveDependencies()
        {
            var transitiveDependency = InputFactory.Model("TransitiveDependency");
            var dependency = InputFactory.Model(
                "DerivedDependency",
                properties: [InputFactory.Property("Transitive", transitiveDependency)]);
            var baseModel = InputFactory.Model("BaseResult");
            var derivedModel = InputFactory.Model(
                "DerivedResult",
                properties: [InputFactory.Property("Dependency", dependency)],
                baseModel: baseModel);
            var operation = InputFactory.Operation("Get", responses: [InputFactory.OperationResponse(bodytype: baseModel)]);
            var method = InputFactory.BasicServiceMethod("Get", operation, response: InputFactory.ServiceMethodResponse(baseModel, []));
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [],
                models: [baseModel, derivedModel, dependency, transitiveDependency],
                clients: [client],
                customFiles: [],
                expectedFiles: [],
                publicModelNames: ["BaseResult"],
                internalModelNames: ["DerivedResult", "DerivedDependency", "TransitiveDependency"]);
        }

        [Test]
        public async Task PublicCustomCodeArraySignatureReferencesStayPublic()
        {
            var generatedModel = InputFactory.Model("GeneratedModel");

            await GenerateAndAssertFiles(
                enums: [],
                models: [generatedModel],
                clients: [],
                customFiles: [
                    (Path.Combine("src", "PublicCustomApi.cs"), """
                        using Sample.Models;

                        namespace Sample;

                        public partial class PublicCustomApi
                        {
                            public GeneratedModel[] Items { get; } = System.Array.Empty<GeneratedModel>();
                        }
                        """)
                ],
                expectedFiles: [],
                publicModelNames: ["GeneratedModel"]);
        }

        [Test]
        public async Task GeneratedRequestHeaderSetDelimitedReferenceKeepsExtensions()
        {
            var header = InputFactory.HeaderParameter("x-ms-custom", InputFactory.Array(InputPrimitiveType.String), isRequired: true);
            var operation = InputFactory.Operation("Create", parameters: [header]);
            var method = InputFactory.BasicServiceMethod("Create", operation);
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [],
                models: [],
                clients: [client],
                customFiles: [],
                expectedFiles: [Path.Combine("src", "Generated", "Internal", "PipelineRequestHeadersExtensions.cs")]);
        }

        [Test]
        public async Task BinaryDataBodyParameterDoesNotKeepBinaryContentHelpers()
        {
            var parameter = InputFactory.BodyParameter(
                "content",
                InputPrimitiveType.Base64,
                isRequired: true,
                contentTypes: ["application/octet-stream"],
                defaultContentType: "application/octet-stream");
            var operation = InputFactory.Operation("Upload", parameters: [parameter], httpMethod: "POST");
            var method = InputFactory.BasicServiceMethod(
                "Upload",
                operation,
                parameters: [InputFactory.MethodParameter("content", InputPrimitiveType.Base64, isRequired: true)]);
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [],
                models: [],
                clients: [client],
                customFiles: [],
                expectedFiles: [],
                unexpectedFiles: [
                    Path.Combine("src", "Generated", "Internal", "BinaryContentHelper.cs"),
                    Path.Combine("src", "Generated", "Internal", "Utf8JsonBinaryContent.cs")
                ]);
        }

        [Test]
        public async Task CollectionBodyParameterKeepsBinaryContentHelpers()
        {
            var parameter = InputFactory.BodyParameter("items", InputFactory.Array(InputPrimitiveType.String), isRequired: true);
            var operation = InputFactory.Operation("Create", parameters: [parameter], httpMethod: "POST");
            var method = InputFactory.BasicServiceMethod(
                "Create",
                operation,
                parameters: [InputFactory.MethodParameter("items", InputFactory.Array(InputPrimitiveType.String), isRequired: true)]);
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [],
                models: [],
                clients: [client],
                customFiles: [],
                expectedFiles: [
                    Path.Combine("src", "Generated", "Internal", "BinaryContentHelper.cs"),
                    Path.Combine("src", "Generated", "Internal", "Utf8JsonBinaryContent.cs")
                ]);
        }

        [Test]
        public async Task CustomOnlyRequestHeaderSetDelimitedReferenceKeepsExtensions()
        {
            await GenerateAndAssertFiles(
                enums: [],
                models: [],
                clients: [],
                customFiles: [
                    (Path.Combine("src", "CustomHeaders.cs"), """
                        using System.ClientModel.Primitives;

                        namespace Sample;

                        public static class CustomHeaders
                        {
                            public static void Add(PipelineRequestHeaders headers, string[] values)
                                => headers.SetDelimited("x-ms-custom", values, ",");
                        }
                        """)
                ],
                expectedFiles: [Path.Combine("src", "Generated", "Internal", "PipelineRequestHeadersExtensions.cs")]);
        }

        [Test]
        public async Task CustomizedEnumSerializationProviderIsKeptWhenModelSerializationUsesEnum()
        {
            var statusEnum = InputFactory.StringEnum(
                "Status",
                [("Succeeded", "succeeded"), ("Failed", "failed")],
                clientNamespace: "Sample");
            var resultModel = InputFactory.Model(
                "OperationResult",
                properties: [InputFactory.Property("Status", statusEnum, isRequired: true)],
                @namespace: "Sample");
            var operation = InputFactory.Operation("Get", responses: [InputFactory.OperationResponse(bodytype: resultModel)]);
            var method = InputFactory.BasicServiceMethod("Get", operation, response: InputFactory.ServiceMethodResponse(resultModel, []));
            var client = InputFactory.Client("TestClient", methods: [method], clientNamespace: "Sample");

            await GenerateAndAssertFiles(
                enums: [statusEnum],
                models: [resultModel],
                clients: [client],
                customFiles: [
                    (Path.Combine("src", "Custom", "Status.cs"), """
                        namespace Sample;

                        [CodeGenType("Status")]
                        public enum Status
                        {
                            Succeeded,
                            Failed
                        }
                        """)
                ],
                expectedFiles: [Path.Combine("src", "Generated", "Models", "Status.Serialization.cs")]);
        }

        [Test]
        public async Task CustomModelFactoryPartialDoesNotKeepBodyOnlyModelPublic()
        {
            var requestModel = InputFactory.Model("RequestBody");
            var parameter = InputFactory.BodyParameter("body", requestModel, isRequired: true);
            var operation = InputFactory.Operation("Create", parameters: [parameter], httpMethod: "POST");
            var method = InputFactory.BasicServiceMethod("Create", operation);
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [],
                models: [requestModel],
                clients: [client],
                customFiles: [
                    (Path.Combine("src", "SampleModelFactory.cs"), """
                        namespace Sample;

                        [Microsoft.TypeSpec.Generator.Customizations.CodeGenType("SampleModelFactory")]
                        public static partial class SampleModelFactory
                        {
                        }
                        """)
                ],
                expectedFiles: [],
                internalModelNames: ["RequestBody"]);
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

        private static async Task GenerateAndAssertMixedModels(
            InputModelType[] models,
            InputClient[] clients,
            string[] publicModelNames,
            string[] internalModelNames)
            => await GenerateAndAssertModels(models, clients, publicModelNames, internalModelNames);

        private static async Task GenerateAndAssertModels(
            InputModelType[] models,
            InputClient[] clients,
            string[] modelNames,
            bool shouldBePublic)
            => await GenerateAndAssertModels(
                models,
                clients,
                shouldBePublic ? modelNames : [],
                shouldBePublic ? [] : modelNames);

        private static async Task GenerateAndAssertModels(
            InputModelType[] models,
            InputClient[] clients,
            string[] publicModelNames,
            string[] internalModelNames)
        {
            await GenerateAndAssertFiles(
                enums: [],
                models: models,
                clients: clients,
                customFiles: [],
                publicModelNames: publicModelNames,
                internalModelNames: internalModelNames,
                expectedFiles: []);
        }

        private static async Task GenerateAndAssertFiles(
            InputEnumType[] enums,
            InputModelType[] models,
            InputClient[] clients,
            (string Path, string Content)[] customFiles,
            string[] expectedFiles,
            string[] unexpectedFiles = null!,
            string[] publicModelNames = null!,
            string[] internalModelNames = null!,
            string packageName = "Sample")
        {
            publicModelNames ??= [];
            internalModelNames ??= [];
            unexpectedFiles ??= [];

            var outputPath = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
            Directory.CreateDirectory(outputPath);
            try
            {
                foreach (var customFile in customFiles)
                {
                    var customPath = Path.Combine(outputPath, customFile.Path);
                    Directory.CreateDirectory(Path.GetDirectoryName(customPath)!);
                    File.WriteAllText(customPath, customFile.Content);
                }

                await MockHelpers.LoadMockGeneratorAsync(
                    inputEnums: () => enums,
                    inputModels: () => models,
                    clients: () => clients,
                    configuration: $$"""{ "package-name": "{{packageName}}", "disable-xml-docs": true }""",
                    outputPath: outputPath);

                await new CSharpGen().ExecuteAsync();

                foreach (var modelName in publicModelNames)
                {
                    var modelPath = Path.Combine(outputPath, "src", "Generated", "Models", $"{modelName}.cs");
                    Assert.IsTrue(File.Exists(modelPath), $"Expected generated model file '{modelPath}'.");
                    var text = File.ReadAllText(modelPath);
                    StringAssert.Contains($"public partial class {modelName}", text, $"{modelName} should be public.");
                }

                foreach (var modelName in internalModelNames)
                {
                    var modelPath = Path.Combine(outputPath, "src", "Generated", "Models", $"{modelName}.cs");
                    Assert.IsTrue(File.Exists(modelPath), $"Expected generated model file '{modelPath}'.");
                    var text = File.ReadAllText(modelPath);
                    StringAssert.Contains($"internal partial class {modelName}", text, $"{modelName} should be internal.");
                    StringAssert.DoesNotContain($"public partial class {modelName}", text, $"{modelName} should not be public.");
                }

                var modelFactoryPath = Path.Combine(outputPath, "src", "Generated", "SampleModelFactory.cs");
                if (File.Exists(modelFactoryPath))
                {
                    var modelFactoryText = File.ReadAllText(modelFactoryPath);
                    foreach (var modelName in publicModelNames)
                    {
                        StringAssert.Contains($" {modelName}(", modelFactoryText, $"Model factory method for {modelName} should be generated.");
                    }

                    foreach (var modelName in internalModelNames)
                    {
                        StringAssert.DoesNotContain($" {modelName}(", modelFactoryText, $"Model factory method for {modelName} should not be generated.");
                    }
                }

                foreach (var expectedFile in expectedFiles)
                {
                    var filePath = Path.Combine(outputPath, expectedFile);
                    Assert.IsTrue(File.Exists(filePath), $"Expected generated file '{filePath}'.");
                }

                foreach (var unexpectedFile in unexpectedFiles)
                {
                    var filePath = Path.Combine(outputPath, unexpectedFile);
                    Assert.IsFalse(File.Exists(filePath), $"Did not expect generated file '{filePath}'.");
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

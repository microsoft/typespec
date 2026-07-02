// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
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
        public async Task InternalModelReferencedByPublicModelPropertyIsPublicized()
        {
            var dependencyModel = InputFactory.Model("DependencyModel", access: "internal");
            var responseModel = InputFactory.Model(
                "ResponseBody",
                properties: [InputFactory.Property("Dependency", dependencyModel)]);
            var operation = InputFactory.Operation("Get", responses: [InputFactory.OperationResponse(bodytype: responseModel)]);
            var method = InputFactory.BasicServiceMethod(
                "Get",
                operation,
                response: InputFactory.ServiceMethodResponse(responseModel, []));
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertPublicModels([responseModel, dependencyModel], [client], ["ResponseBody", "DependencyModel"]);
        }

        [Test]
        public async Task InternalModelReferencedByPublicNonRootCollectionPropertyIsPublicized()
        {
            var dependencyModel = InputFactory.Model("DependencyModel", access: "internal");
            var responseModel = InputFactory.Model(
                "ResponseBody",
                properties: [InputFactory.Property("Dependencies", InputFactory.Array(dependencyModel))]);
            var operation = InputFactory.Operation("Get", responses: [InputFactory.OperationResponse(bodytype: responseModel)]);
            var method = InputFactory.BasicServiceMethod(
                "Get",
                operation,
                response: InputFactory.ServiceMethodResponse(responseModel, []));
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [],
                models: [responseModel, dependencyModel],
                clients: [client],
                customFiles: [
                    (Path.Combine("src", "Generated", "SampleModelFactory.cs"), """
                        using System.Collections.Generic;
                        using Sample.Models;

                        namespace Sample;

                        public static partial class SampleModelFactory
                        {
                            public static ResponseBody ResponseBody(IEnumerable<DependencyModel> dependencies = default) => null;
                        }
                        """)
                ],
                expectedFiles: [],
                publicModelNames: ["ResponseBody", "DependencyModel"],
                configureGenerator: () =>
                {
                    var responseProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.Single(provider => provider.Name == "ResponseBody");
                    var dependencyProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.Single(provider => provider.Name == "DependencyModel");
                    CodeModelGenerator.Instance.AddTypeToKeep(responseProvider, isRoot: false);
                    CodeModelGenerator.Instance.AddTypeToKeep(dependencyProvider, isRoot: false);
                });
        }

        [Test]
        public async Task CustomInternalBoundaryInternalizesPublicNonRootModel()
        {
            var customInternalModel = InputFactory.Model("CustomInternalModel");
            var publicWrapper = InputFactory.Model(
                "PublicWrapper",
                properties: [InputFactory.Property("CustomInternal", customInternalModel)]);

            var outputPath = Path.Combine(Path.GetTempPath(), Path.GetRandomFileName());
            Directory.CreateDirectory(outputPath);
            try
            {
                var customPath = Path.Combine(outputPath, "src", "Custom", "CustomInternalModel.cs");
                Directory.CreateDirectory(Path.GetDirectoryName(customPath)!);
                File.WriteAllText(customPath, """
                    using Microsoft.TypeSpec.Generator.Customizations;

                    namespace Sample.Models;

                    [CodeGenType("CustomInternalModel")]
                    internal partial class CustomInternalModel
                    {
                    }
                    """);
                var modelFactoryPath = Path.Combine(outputPath, "src", "Generated", "SampleModelFactory.cs");
                Directory.CreateDirectory(Path.GetDirectoryName(modelFactoryPath)!);
                File.WriteAllText(modelFactoryPath, """
                    using Sample.Models;

                    namespace Sample;

                    public static partial class SampleModelFactory
                    {
                        public static PublicWrapper PublicWrapper(CustomInternalModel customInternal = default) => null;
                    }
                    """);

                await MockHelpers.LoadMockGeneratorAsync(
                    inputModels: () => [publicWrapper, customInternalModel],
                    configuration: """{ "package-name": "Sample", "disable-xml-docs": true }""",
                    outputPath: outputPath);

                var publicWrapperProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.Single(provider => provider.Name == "PublicWrapper");
                var customInternalProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.Single(provider => provider.Name == "CustomInternalModel");
                CodeModelGenerator.Instance.AddTypeToKeep(publicWrapperProvider, isRoot: false);
                CodeModelGenerator.Instance.AddTypeToKeep(customInternalProvider, isRoot: false);

                ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility(CodeModelGenerator.Instance.OutputLibrary.TypeProviders);

                Assert.IsTrue(publicWrapperProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal), "PublicWrapper should be internalized when its public surface exposes a custom/internal type.");
                Assert.IsTrue(customInternalProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal), "CustomInternalModel should remain internal.");
            }
            finally
            {
                ProviderReferenceMapAnalyzer.ResetPreWriteAccessibility();
                if (Directory.Exists(outputPath))
                {
                    Directory.Delete(outputPath, recursive: true);
                }
            }
        }

        [Test]
        public async Task OperationResponseBodyModelIsRemovedWhenNotOtherwiseReferenced()
        {
            var metadataOnlyModel = InputFactory.Model("MetadataOnlyResponse");
            var operation = InputFactory.Operation(
                "Get",
                responses: [
                    InputFactory.OperationResponse(bodytype: InputPrimitiveType.String),
                    new InputOperationResponse([202], metadataOnlyModel, [], isErrorResponse: false, ["application/json"])
                ]);
            var method = InputFactory.BasicServiceMethod(
                "Get",
                operation,
                response: InputFactory.ServiceMethodResponse(InputPrimitiveType.String, []));
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [],
                models: [metadataOnlyModel],
                clients: [client],
                customFiles: [],
                expectedFiles: [],
                unexpectedFiles: [
                    Path.Combine("src", "Generated", "Models", "MetadataOnlyResponse.cs"),
                    Path.Combine("src", "Generated", "Models", "MetadataOnlyResponse.Serialization.cs")
                ]);
        }

        [Test]
        public async Task EmptyCustomPartialModelIsKept()
        {
            var customizedModel = InputFactory.Model("CustomizedModel");

            await GenerateAndAssertFiles(
                enums: [],
                models: [customizedModel],
                clients: [],
                customFiles: [(
                    Path.Combine("src", "CustomizedModel.cs"),
                    """
                    namespace Sample.Models
                    {
                        public partial class CustomizedModel
                        {
                        }
                    }
                    """)],
                expectedFiles: [
                    Path.Combine("src", "Generated", "Models", "CustomizedModel.cs"),
                    Path.Combine("src", "Generated", "Models", "CustomizedModel.Serialization.cs")
                ]);
        }

        [Test]
        public async Task InternalAdditionalRootModelIsRemovedWhenNotOtherwiseReferenced()
        {
            var metadataOnlyModel = InputFactory.Model("MetadataOnlyResponse", access: "internal");
            var operation = InputFactory.Operation(
                "Get",
                responses: [
                    InputFactory.OperationResponse(bodytype: InputPrimitiveType.String),
                    new InputOperationResponse([202], metadataOnlyModel, [], isErrorResponse: false, ["application/json"])
                ]);
            var method = InputFactory.BasicServiceMethod(
                "Get",
                operation,
                response: InputFactory.ServiceMethodResponse(InputPrimitiveType.String, []));
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [],
                models: [metadataOnlyModel],
                clients: [client],
                customFiles: [],
                expectedFiles: [],
                unexpectedFiles: [
                    Path.Combine("src", "Generated", "Models", "MetadataOnlyResponse.cs"),
                    Path.Combine("src", "Generated", "Models", "MetadataOnlyResponse.Serialization.cs")
                ],
                configureGenerator: () =>
                {
                    var provider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.Single(provider => provider.Name == "MetadataOnlyResponse");
                    CodeModelGenerator.Instance.AddTypeToKeep(provider);
                });
        }

        [Test]
        public async Task AdditionalRootEnumIsRemovedWhenNotOtherwiseReferenced()
        {
            var metadataOnlyEnum = InputFactory.StringEnum(
                "MetadataOnlyResponseKind",
                [("Accepted", "accepted")]);
            var operation = InputFactory.Operation(
                "Get",
                responses: [
                    InputFactory.OperationResponse(bodytype: InputPrimitiveType.String),
                    new InputOperationResponse([202], metadataOnlyEnum, [], isErrorResponse: false, ["application/json"])
                ]);
            var method = InputFactory.BasicServiceMethod(
                "Get",
                operation,
                response: InputFactory.ServiceMethodResponse(InputPrimitiveType.String, []));
            var client = InputFactory.Client("TestClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [metadataOnlyEnum],
                models: [],
                clients: [client],
                customFiles: [],
                expectedFiles: [],
                unexpectedFiles: [
                    Path.Combine("src", "Generated", "Models", "MetadataOnlyResponseKind.cs"),
                    Path.Combine("src", "Generated", "Models", "MetadataOnlyResponseKind.Serialization.cs")
                ]);
        }

        [Test]
        public async Task ContentTypeHeaderEnumIsRemovedWhenNotOtherwiseReferenced()
        {
            var contentTypeEnum = InputFactory.StringEnum(
                "UpdateSnapshotRequestContentType",
                [
                    ("ApplicationMergePatchJson", "application/merge-patch+json"),
                    ("ApplicationJson", "application/json")
                ]);
            var contentTypeParameter = InputFactory.MethodParameter(
                "contentType",
                InputFactory.Union([contentTypeEnum], "contentType"),
                isRequired: true,
                location: InputRequestLocation.Header,
                serializedName: "Content-Type");
            var operation = InputFactory.Operation(
                "UpdateSnapshot",
                parameters: [contentTypeParameter],
                httpMethod: "PATCH",
                generateConvenienceMethod: false);
            var method = InputFactory.BasicServiceMethod(
                "UpdateSnapshot",
                operation,
                parameters: [
                    InputFactory.MethodParameter("name", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Path),
                    contentTypeParameter,
                    InputFactory.MethodParameter("content", InputPrimitiveType.Base64, isRequired: true)
                ]);
            var client = InputFactory.Client("ConfigurationClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [contentTypeEnum],
                models: [],
                clients: [client],
                customFiles: [],
                expectedFiles: [],
                unexpectedFiles: [
                    Path.Combine("src", "Generated", "Models", "UpdateSnapshotRequestContentType.cs"),
                    Path.Combine("src", "Generated", "Models", "UpdateSnapshotRequestContentType.Serialization.cs")
                ],
                configureGenerator: () =>
                    CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(InputFactory.Union([contentTypeEnum], "contentType")));
        }

        [Test]
        public async Task PublicEnumIsRemovedWhenNotOtherwiseReferenced()
        {
            var metadataOnlyEnum = InputFactory.StringEnum(
                "MetadataOnlyKind",
                [("One", "one")]);

            await GenerateAndAssertFiles(
                enums: [metadataOnlyEnum],
                models: [],
                clients: [],
                customFiles: [],
                expectedFiles: [],
                unexpectedFiles: [
                    Path.Combine("src", "Generated", "Models", "MetadataOnlyKind.cs"),
                    Path.Combine("src", "Generated", "Models", "MetadataOnlyKind.Serialization.cs")
                ]);
        }

        [Test]
        public async Task ContentTypeHeaderEnumReferencedByCustomSuppressionIsKept()
        {
            var contentTypeEnum = InputFactory.StringEnum(
                "PutKeyValueRequestContentType",
                [("ApplicationJson", "application/json")],
                isExtensible: true);
            var contentTypeParameter = InputFactory.HeaderParameter(
                "contentType",
                InputFactory.Union([contentTypeEnum], "contentType"),
                isRequired: true,
                isContentType: true,
                serializedName: "Content-Type");
            var operation = InputFactory.Operation(
                "SetConfigurationSettingInternal",
                parameters: [contentTypeParameter],
                httpMethod: "PUT");
            var method = InputFactory.BasicServiceMethod("SetConfigurationSettingInternal", operation);
            var client = InputFactory.Client("ConfigurationClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [contentTypeEnum],
                models: [],
                clients: [client],
                customFiles: [
                    (Path.Combine("src", "PutKeyValueRequestContentType.cs"), """
                        namespace Sample.Models;

                        internal readonly partial struct PutKeyValueRequestContentType
                        {
                            public static PutKeyValueRequestContentType ApplicationJson { get; } = new PutKeyValueRequestContentType("application/json");
                        }
                        """)
                ],
                expectedFiles: [
                    Path.Combine("src", "Generated", "Models", "PutKeyValueRequestContentType.cs")
                ]);
        }

        [Test]
        public async Task ContentTypeHeaderEnumReferencedOnlyByCustomSuppressionAttributeIsKept()
        {
            var contentTypeEnum = InputFactory.StringEnum(
                "CreateSnapshotRequestContentType",
                [("ApplicationJson", "application/json")],
                isExtensible: true);
            var contentTypeParameter = InputFactory.MethodParameter(
                "contentType",
                InputFactory.Union([contentTypeEnum], "contentType"),
                isRequired: true,
                location: InputRequestLocation.Header,
                serializedName: "Content-Type");
            var operation = InputFactory.Operation(
                "CreateSnapshot",
                parameters: [contentTypeParameter],
                httpMethod: "PUT",
                generateConvenienceMethod: false);
            var method = InputFactory.BasicServiceMethod(
                "CreateSnapshot",
                operation,
                parameters: [
                    InputFactory.MethodParameter("name", InputPrimitiveType.String, isRequired: true, location: InputRequestLocation.Path),
                    contentTypeParameter,
                    InputFactory.MethodParameter("content", InputPrimitiveType.Base64, isRequired: true)
                ]);
            var client = InputFactory.Client("ConfigurationClient", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [contentTypeEnum],
                models: [],
                clients: [client],
                customFiles: [
                    (Path.Combine("src", "ConfigurationClient.cs"), """
                        namespace Sample;

                        [Microsoft.TypeSpec.Generator.Customizations.CodeGenType("ConfigurationClient")]
                        [Microsoft.TypeSpec.Generator.Customizations.CodeGenSuppress("CreateSnapshot", typeof(string), typeof(CreateSnapshotRequestContentType))]
                        public partial class ConfigurationClient
                        {
                        }
                        """)
                ],
                expectedFiles: [
                    Path.Combine("src", "Generated", "Models", "CreateSnapshotRequestContentType.cs")
                ]);
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

        [Test]
        public async Task InternalCustomClientPartialOverridesLastContractPublicClient()
        {
            var responseModel = InputFactory.Model("CompactResource");
            var operation = InputFactory.Operation("Compact", responses: [InputFactory.OperationResponse(bodytype: responseModel)]);
            var method = InputFactory.BasicServiceMethod("Compact", operation, response: InputFactory.ServiceMethodResponse(responseModel, []));
            var client = InputFactory.Client("Responses", methods: [method]);

            await GenerateAndAssertFiles(
                enums: [],
                models: [responseModel],
                clients: [client],
                customFiles: [
                    (Path.Combine("src", "Generated", "Responses.cs"), """
                        namespace Sample;

                        public partial class Responses
                        {
                        }
                        """),
                    (Path.Combine("src", "Custom", "Internal", "Responses.cs"), """
                        namespace Sample;

                        internal partial class Responses
                        {
                        }
                        """)
                ],
                expectedFiles: [],
                internalModelNames: ["CompactResource"],
                internalClientNames: ["Responses"]);
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
            string[] internalClientNames = null!,
            string packageName = "Sample",
            Action? configureGenerator = null)
        {
            publicModelNames ??= [];
            internalModelNames ??= [];
            internalClientNames ??= [];
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
                configureGenerator?.Invoke();

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

                foreach (var clientName in internalClientNames)
                {
                    var clientPath = Path.Combine(outputPath, "src", "Generated", $"{clientName}.cs");
                    Assert.IsTrue(File.Exists(clientPath), $"Expected generated client file '{clientPath}'.");
                    var text = File.ReadAllText(clientPath);
                    StringAssert.Contains($"internal partial class {clientName}", text, $"{clientName} should be internal.");
                    StringAssert.DoesNotContain($"public partial class {clientName}", text, $"{clientName} should not be public.");
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

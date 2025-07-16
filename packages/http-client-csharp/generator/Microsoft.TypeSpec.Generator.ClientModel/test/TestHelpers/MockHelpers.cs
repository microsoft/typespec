// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Moq;
using Moq.Protected;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests
{
    internal static class MockHelpers
    {
        private static readonly string _configFilePath = Path.Combine(AppContext.BaseDirectory, TestHelpersFolder);
        public const string TestHelpersFolder = "TestHelpers";

        public static async Task<Mock<ScmCodeModelGenerator>> LoadMockGeneratorAsync(
            Func<IReadOnlyList<InputEnumType>>? inputEnums = null,
            Func<IReadOnlyList<InputModelType>>? inputModels = null,
            Func<IReadOnlyList<InputClient>>? clients = null,
            Func<IReadOnlyList<InputLiteralType>>? inputLiterals = null,
            Func<Task<Compilation>>? compilation = null,
            Func<Task<Compilation>>? lastContractCompilation = null,
            Func<IReadOnlyList<string>>? apiVersions = null,
            string? configuration = null)
        {
            var mockGenerator = LoadMockGenerator(
                inputLiterals: inputLiterals,
                inputEnums: inputEnums,
                inputModels: inputModels,
                clients: clients,
                apiVersions: apiVersions,
                configuration: configuration);

            var compilationResult = compilation == null ? null : await compilation();
            var lastContractCompilationResult = lastContractCompilation == null ? null : await lastContractCompilation();

            var sourceInputModel = new Mock<SourceInputModel>(() => new SourceInputModel(compilationResult, lastContractCompilationResult)) { CallBase = true };
            mockGenerator.Setup(p => p.SourceInputModel).Returns(sourceInputModel.Object);

            return mockGenerator;
        }

        public static Mock<ScmCodeModelGenerator> LoadMockGenerator(
            Func<InputType, TypeProvider, IReadOnlyList<TypeProvider>>? createSerializationsCore = null,
            Func<InputType, CSharpType>? createCSharpTypeCore = null,
            Func<CSharpType>? matchConditionsType = null,
            Func<InputParameter, ParameterProvider?>? createParameterCore = null,
            Func<IReadOnlyList<string>>? apiVersions = null,
            Func<IReadOnlyList<InputLiteralType>>? inputLiterals = null,
            Func<IReadOnlyList<InputEnumType>>? inputEnums = null,
            Func<IReadOnlyList<InputModelType>>? inputModels = null,
            Func<IReadOnlyList<InputClient>>? clients = null,
            Func<InputLibrary>? createInputLibrary = null,
            Func<InputClient, ClientProvider?>? createClientCore = null,
            string? configuration = null,
            ClientResponseApi? clientResponseApi = null,
            ClientPipelineApi? clientPipelineApi = null,
            HttpMessageApi? httpMessageApi = null,
            RequestContentApi? requestContentApi = null,
            Func<InputAuth>? auth = null,
            bool includeXmlDocs = false)
        {
            IReadOnlyList<string> inputNsApiVersions = apiVersions?.Invoke() ?? [];
            IReadOnlyList<InputLiteralType> inputNsLiterals = inputLiterals?.Invoke() ?? [];
            IReadOnlyList<InputEnumType> inputNsEnums = inputEnums?.Invoke() ?? [];
            IReadOnlyList<InputClient> inputNsClients = clients?.Invoke() ?? [];
            IReadOnlyList<InputModelType> inputNsModels = inputModels?.Invoke() ?? [];
            InputAuth? inputAuth = auth?.Invoke() ?? null;

            // reset the type cache on TypeReferenceExpression
            var resetCacheMethod = typeof(TypeReferenceExpression).GetMethod("ResetCache", BindingFlags.Static | BindingFlags.NonPublic);
            resetCacheMethod!.Invoke(null, null);

            var mockTypeFactory = new Mock<ScmTypeFactory>() { CallBase = true };
            var mockInputNs = new Mock<InputNamespace>(
                "Sample",
                inputNsApiVersions,
                inputNsLiterals,
                inputNsEnums,
                inputNsModels,
                inputNsClients,
                inputAuth!);
            var mockInputLibrary = new Mock<InputLibrary>(_configFilePath);
            mockInputLibrary.Setup(p => p.InputNamespace).Returns(mockInputNs.Object);

            if (matchConditionsType is not null)
            {
                mockTypeFactory.Setup(p => p.MatchConditionsType).Returns(matchConditionsType);
            }

            if (createParameterCore is not null)
            {
                mockTypeFactory.Protected().Setup<ParameterProvider?>("CreateParameterCore", ItExpr.IsAny<InputParameter>()).Returns(createParameterCore);
            }

            if (createSerializationsCore is not null)
            {
                mockTypeFactory.Protected().Setup<IReadOnlyList<TypeProvider>>("CreateSerializationsCore", ItExpr.IsAny<InputType>(), ItExpr.IsAny<TypeProvider>()).Returns(createSerializationsCore);
            }

            if (createCSharpTypeCore is not null)
            {
                mockTypeFactory.Protected().Setup<CSharpType>("CreateCSharpTypeCore", ItExpr.IsAny<InputType>()).Returns(createCSharpTypeCore);
            }

            if (createClientCore is not null)
            {
                mockTypeFactory.Protected().Setup<ClientProvider?>("CreateClientCore", ItExpr.IsAny<InputClient>()).Returns(createClientCore);
            }

            // initialize the mock singleton instance of the generator
            var codeModelInstance = typeof(CodeModelGenerator).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            var clientModelInstance = typeof(ScmCodeModelGenerator).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            // invoke the load method with the config file path
            var loadMethod = typeof(Configuration).GetMethod("Load", BindingFlags.Static | BindingFlags.NonPublic);
            if (includeXmlDocs)
            {
                configuration = "{\"disable-xml-docs\": false, \"package-name\": \"Sample.Namespace\"}";
            }
            object?[] parameters = [_configFilePath, configuration];
            var config = loadMethod?.Invoke(null, parameters);
            var mockGeneratorContext = new Mock<GeneratorContext>(config!);
            var mockGeneratorInstance = new Mock<ScmCodeModelGenerator>(mockGeneratorContext.Object) { CallBase = true };
            mockGeneratorInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            mockGeneratorInstance.Setup(p => p.InputLibrary).Returns(mockInputLibrary.Object);
            if (clientResponseApi is not null)
            {
                mockTypeFactory.Setup(p => p.ClientResponseApi).Returns(clientResponseApi);
            }

            if (clientPipelineApi is not null)
            {
                mockTypeFactory.Setup(p => p.ClientPipelineApi).Returns(clientPipelineApi);
            }

            if (httpMessageApi is not null)
            {
                mockTypeFactory.Setup(p => p.HttpMessageApi).Returns(httpMessageApi);
            }

            if (requestContentApi is not null)
            {
                mockTypeFactory.Setup(p => p.RequestContentApi).Returns(requestContentApi);
            }

            if (createInputLibrary is not null)
            {
                mockGeneratorInstance.Setup(p => p.InputLibrary).Returns(createInputLibrary);
            }

            var sourceInputModel = new Mock<SourceInputModel>(() => new SourceInputModel(null, null)) { CallBase = true };
            mockGeneratorInstance.Setup(p => p.SourceInputModel).Returns(sourceInputModel.Object);

            codeModelInstance!.SetValue(null, mockGeneratorInstance.Object);
            clientModelInstance!.SetValue(null, mockGeneratorInstance.Object);

            var configureMethod = typeof(CodeModelGenerator).GetMethod(
                "Configure",
                BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.InvokeMethod
            );
            configureMethod!.Invoke(mockGeneratorInstance.Object, null);

            return mockGeneratorInstance;
        }
    }
}

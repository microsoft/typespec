// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.SourceInput;
using Moq;
using Moq.Protected;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal static class MockHelpers
    {
        private static readonly string _configFilePath = Path.Combine(AppContext.BaseDirectory, TestHelpersFolder);
        public const string TestHelpersFolder = "TestHelpers";

        public static async Task<Mock<ClientModelPlugin>> LoadMockPluginAsync(
            Func<IReadOnlyList<InputEnumType>>? inputEnums = null,
            Func<IReadOnlyList<InputModelType>>? inputModels = null,
            Func<IReadOnlyList<InputClient>>? clients = null,
            Func<Task<Compilation>>? compilation = null,
            string? configuration = null)
        {
            var mockPlugin = LoadMockPlugin(
                inputEnums: inputEnums,
                inputModels: inputModels,
                clients: clients,
                configuration: configuration);

            var compilationResult = compilation == null ? null : await compilation();

            var sourceInputModel = new Mock<SourceInputModel>(() => new SourceInputModel(compilationResult)) { CallBase = true };
            mockPlugin.Setup(p => p.SourceInputModel).Returns(sourceInputModel.Object);

            return mockPlugin;
        }

        public static Mock<ClientModelPlugin> LoadMockPlugin(
            Func<InputType, TypeProvider, IReadOnlyList<TypeProvider>>? createSerializationsCore = null,
            Func<InputType, CSharpType>? createCSharpTypeCore = null,
            Func<CSharpType>? matchConditionsType = null,
            Func<CSharpType>? keyCredentialType = null,
            Func<InputParameter, ParameterProvider>? createParameterCore = null,
            Func<InputApiKeyAuth>? apiKeyAuth = null,
            Func<IReadOnlyList<string>>? apiVersions = null,
            Func<IReadOnlyList<InputEnumType>>? inputEnums = null,
            Func<IReadOnlyList<InputModelType>>? inputModels = null,
            Func<IReadOnlyList<InputClient>>? clients = null,
            Func<InputLibrary>? createInputLibrary = null,
            Func<InputClient, ClientProvider>? createClientCore = null,
            string? configuration = null)
        {
            IReadOnlyList<string> inputNsApiVersions = apiVersions?.Invoke() ?? [];
            IReadOnlyList<InputEnumType> inputNsEnums = inputEnums?.Invoke() ?? [];
            IReadOnlyList<InputClient> inputNsClients = clients?.Invoke() ?? [];
            IReadOnlyList<InputModelType> inputNsModels = inputModels?.Invoke() ?? [];
            InputAuth inputNsAuth = apiKeyAuth != null ? new InputAuth(apiKeyAuth(), null) : new InputAuth();
            var mockTypeFactory = new Mock<ScmTypeFactory>() { CallBase = true };
            var mockInputNs = new Mock<InputNamespace>(
                string.Empty,
                inputNsApiVersions,
                inputNsEnums,
                inputNsModels,
                inputNsClients,
                inputNsAuth);
            var mockInputLibrary = new Mock<InputLibrary>(_configFilePath);
            mockInputLibrary.Setup(p => p.InputNamespace).Returns(mockInputNs.Object);

            if (matchConditionsType is not null)
            {
                mockTypeFactory.Setup(p => p.MatchConditionsType).Returns(matchConditionsType);
            }

            if (keyCredentialType is not null)
            {
                mockTypeFactory.Setup(p => p.KeyCredentialType).Returns(keyCredentialType);
            }

            if (createParameterCore is not null)
            {
                mockTypeFactory.Protected().Setup<ParameterProvider>("CreateParameterCore", ItExpr.IsAny<InputParameter>()).Returns(createParameterCore);
            }

            if (createSerializationsCore is not null)
            {
                mockTypeFactory.Protected().Setup<IReadOnlyList<TypeProvider>>("CreateSerializationsCore", ItExpr.IsAny<InputType>(), ItExpr.IsAny<TypeProvider>()).Returns(createSerializationsCore);
            }

            if (createCSharpTypeCore is not null)
            {
                mockTypeFactory.Protected().Setup<CSharpType>("CreateCSharpTypeCore", ItExpr.IsAny<InputType>()).Returns(createCSharpTypeCore);
            }

            if ( createClientCore is not null)
            {
                mockTypeFactory.Protected().Setup<ClientProvider>("CreateClientCore", ItExpr.IsAny<InputClient>()).Returns(createClientCore);
            }

            // initialize the mock singleton instance of the plugin
            var codeModelInstance = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            var clientModelInstance = typeof(ClientModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            // invoke the load method with the config file path
            var loadMethod = typeof(Configuration).GetMethod("Load", BindingFlags.Static | BindingFlags.NonPublic);
            object?[] parameters = [_configFilePath, configuration];
            var config = loadMethod?.Invoke(null, parameters);
            var mockGeneratorContext = new Mock<GeneratorContext>(config!);
            var mockPluginInstance = new Mock<ClientModelPlugin>(mockGeneratorContext.Object) { CallBase = true };
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            mockPluginInstance.Setup(p => p.InputLibrary).Returns(mockInputLibrary.Object);

            if (createInputLibrary is not null)
            {
                mockPluginInstance.Setup(p => p.InputLibrary).Returns(createInputLibrary);
            }

            var sourceInputModel = new Mock<SourceInputModel>(() => new SourceInputModel(null)) { CallBase = true };
            mockPluginInstance.Setup(p => p.SourceInputModel).Returns(sourceInputModel.Object);

            codeModelInstance!.SetValue(null, mockPluginInstance.Object);
            clientModelInstance!.SetValue(null, mockPluginInstance.Object);
            mockPluginInstance.Object.Configure();
            return mockPluginInstance;
        }
    }
}

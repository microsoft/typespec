// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using Moq.Protected;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal static class MockHelpers
    {
        private static readonly string _configFilePath = Path.Combine(AppContext.BaseDirectory, MocksFolder);
        public const string MocksFolder = "Mocks";

        public static void LoadMockPlugin(
            Func<InputType, IReadOnlyList<TypeProvider>>? createSerializationsCore = null,
            Func<InputType, CSharpType>? createCSharpTypeCore = null,
            Func<CSharpType>? matchConditionsType = null,
            Func<CSharpType>? tokenCredentialType = null,
            Func<InputOperation, TypeProvider, MethodProviderCollection>? createMethods = null,
            Func<InputParameter, ParameterProvider>? createParameter = null,
            Func<InputApiKeyAuth>? apiKeyAuth = null,
            Func<IReadOnlyList<string>>? apiVersions = null,
            Func<IReadOnlyList<InputEnumType>>? inputEnums = null)
        {
            IReadOnlyList<string> inputNsApiVersions = apiVersions?.Invoke() ?? [];
            IReadOnlyList<InputEnumType> inputNsEnums = inputEnums?.Invoke() ?? [];
            InputAuth inputNsAuth = apiKeyAuth != null ? new InputAuth(apiKeyAuth(), null) : new InputAuth();
            var mockTypeFactory = new Mock<ScmTypeFactory>() { CallBase = true };
            var mockInputNs = new Mock<InputNamespace>(
                string.Empty,
                inputNsApiVersions,
                inputNsEnums,
                Array.Empty<InputModelType>(),
                Array.Empty<InputClient>(),
                inputNsAuth);
            var mockInputLibrary = new Mock<InputLibrary>(_configFilePath);

            if (matchConditionsType is not null)
            {
                mockTypeFactory.Setup(p => p.MatchConditionsType()).Returns(matchConditionsType);
            }

            if (tokenCredentialType is not null)
            {
                mockTypeFactory.Setup(p => p.TokenCredentialType()).Returns(tokenCredentialType);
            }

            if (createMethods is not null)
            {
                mockTypeFactory.Setup(p => p.CreateMethods(It.IsAny<InputOperation>(), It.IsAny<TypeProvider>())).Returns(createMethods);
            }

            if (createParameter is not null)
            {
                mockTypeFactory.Setup(p => p.CreateParameter(It.IsAny<InputParameter>())).Returns(createParameter);
            }

            if (createSerializationsCore is not null)
            {
                mockTypeFactory.Protected().Setup<IReadOnlyList<TypeProvider>>("CreateSerializationsCore", ItExpr.IsAny<InputType>()).Returns(createSerializationsCore);
            }

            if (createCSharpTypeCore is not null)
            {
                mockTypeFactory.Protected().Setup<CSharpType>("CreateCSharpTypeCore", ItExpr.IsAny<InputType>()).Returns(createCSharpTypeCore);
            }

            // initialize the mock singleton instance of the plugin
            var codeModelInstance = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            var clientModelInstance = typeof(ClientModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            var inputNsInstance = typeof(InputLibrary).GetField("_inputNamespace", BindingFlags.Instance | BindingFlags.NonPublic);
            inputNsInstance!.SetValue(mockInputLibrary.Object, mockInputNs.Object);
            // invoke the load method with the config file path
            var loadMethod = typeof(Configuration).GetMethod("Load", BindingFlags.Static | BindingFlags.NonPublic);
            object?[] parameters = [_configFilePath, null];
            var config = loadMethod?.Invoke(null, parameters);
            var mockGeneratorContext = new Mock<GeneratorContext>(config!);
            var mockPluginInstance = new Mock<ClientModelPlugin>(mockGeneratorContext.Object) { CallBase = true };
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            mockPluginInstance.Setup(p => p.InputLibrary).Returns(mockInputLibrary.Object);

            codeModelInstance!.SetValue(null, mockPluginInstance.Object);
            clientModelInstance!.SetValue(null, mockPluginInstance.Object);
        }
    }
}

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
        public const string MocksFolder = "Mocks";

        public static void LoadMockPlugin(
            Func<InputType, IReadOnlyList<TypeProvider>>? createSerializationsCore = null,
            Func<InputType, CSharpType>? createCSharpTypeCore = null,
            Func<CSharpType>? matchConditionsType = null,
            Func<CSharpType>? tokenCredentialType = null,
            Func<InputOperation, TypeProvider, MethodProviderCollection>? createMethods = null,
            Func<InputParameter, ParameterProvider>? createParameter = null)
        {
            var mockTypeFactory = new Mock<ScmTypeFactory>() { CallBase = true };

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

            var configFilePath = Path.Combine(AppContext.BaseDirectory, MocksFolder);
            // initialize the mock singleton instance of the plugin
            var codeModelInstance = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            var clientModelInstance = typeof(ClientModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            // invoke the load method with the config file path
            var loadMethod = typeof(Configuration).GetMethod("Load", BindingFlags.Static | BindingFlags.NonPublic);
            object?[] parameters = [configFilePath, null];
            var config = loadMethod?.Invoke(null, parameters);
            var mockGeneratorContext = new Mock<GeneratorContext>(config!);
            var mockPluginInstance = new Mock<ClientModelPlugin>(mockGeneratorContext.Object) { CallBase = true };
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);

            codeModelInstance!.SetValue(null, mockPluginInstance.Object);
            clientModelInstance!.SetValue(null, mockPluginInstance.Object);
        }
    }
}

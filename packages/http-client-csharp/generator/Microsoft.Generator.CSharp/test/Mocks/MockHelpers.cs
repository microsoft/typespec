// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Moq.Protected;
using Moq;

namespace Microsoft.Generator.CSharp.Tests
{
    internal static class MockHelpers
    {
        public const string MocksFolder = "Mocks";

        public static void LoadMockPlugin(Func<InputType, CSharpType>? createCSharpTypeCore = null)
        {
            var configFilePath = Path.Combine(AppContext.BaseDirectory, MocksFolder);
            // initialize the singleton instance of the plugin
            var mockPlugin = new MockCodeModelPlugin(new GeneratorContext(Configuration.Load(configFilePath)));

            var mockPluginInstance = new Mock<CodeModelPlugin>(new GeneratorContext(Configuration.Load(configFilePath)));
            var mockTypeFactory = new Mock<TypeFactory>();

            if (createCSharpTypeCore != null)
            {
                mockTypeFactory.Protected().Setup<CSharpType>("CreateCSharpTypeCore", ItExpr.IsAny<InputType>()).Returns((InputType inputType) => createCSharpTypeCore.Invoke(inputType));
            }
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);

            CodeModelPlugin.Instance = mockPlugin;
        }
    }
}

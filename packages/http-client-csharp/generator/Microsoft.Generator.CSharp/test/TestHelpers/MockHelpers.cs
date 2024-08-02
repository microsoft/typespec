// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Moq.Protected;
using Moq;

namespace Microsoft.Generator.CSharp.Tests
{
    internal static class MockHelpers
    {
        public const string TestHelpersFolder = "TestHelpers";

        public static Mock<CodeModelPlugin> LoadMockPlugin(
            Func<InputType, CSharpType>? createCSharpTypeCore = null,
            Func<OutputLibrary>? createOutputLibrary = null,
            string? configuration = null)
        {
            var configFilePath = Path.Combine(AppContext.BaseDirectory, TestHelpersFolder);
            // initialize the singleton instance of the plugin
            var mockPlugin = new Mock<CodeModelPlugin>(new GeneratorContext(Configuration.Load(configFilePath, configuration))) { CallBase = true };

            var mockTypeFactory = new Mock<TypeFactory>() { CallBase = true };

            if (createCSharpTypeCore != null)
            {
                mockTypeFactory.Protected().Setup<CSharpType>("CreateCSharpTypeCore", ItExpr.IsAny<InputType>()).Returns((InputType inputType) => createCSharpTypeCore.Invoke(inputType));
            }

            if (createOutputLibrary != null)
            {
                mockPlugin.Setup(p => p.OutputLibrary).Returns(createOutputLibrary);
            }

            mockPlugin.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);

            CodeModelPlugin.Instance = mockPlugin.Object;
            return mockPlugin;
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Moq.Protected;
using Moq;
using Microsoft.Generator.CSharp.Tests.Common;

namespace Microsoft.Generator.CSharp.Tests
{
    internal static class MockHelpers
    {
        public const string TestHelpersFolder = "TestHelpers";

        public static Mock<CodeModelPlugin> LoadMockPlugin(
            Func<InputType, CSharpType>? createCSharpTypeCore = null,
            Func<OutputLibrary>? createOutputLibrary = null,
            string? configuration = null,
            InputModelType[]? inputModelTypes = null)
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

            Mock<InputLibrary> mockInputLibrary = new Mock<InputLibrary>() { CallBase = true };
            mockInputLibrary.Setup(l => l.InputNamespace).Returns(InputFactory.Namespace(
                "TestLibrary",
                models: inputModelTypes));

            mockPlugin.Setup(p => p.InputLibrary).Returns(mockInputLibrary.Object);

            mockPlugin.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);

            CodeModelPlugin.Instance = mockPlugin.Object;
            return mockPlugin;
        }
    }
}

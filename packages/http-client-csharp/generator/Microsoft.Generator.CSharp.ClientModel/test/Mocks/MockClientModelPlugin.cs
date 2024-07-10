// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Moq;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal class MockClientModelPlugin : ClientModelPlugin
    {
        private static readonly string _mocksFolder = "Mocks";

        public MockClientModelPlugin(GeneratorContext context)
            : base(context)
        {
        }

        public override ScmTypeFactory TypeFactory { get; } = new MockTypeFactory();
        public override OutputLibrary OutputLibrary => throw new NotImplementedException();
        public override IReadOnlyList<TypeProvider> GetSerializationTypeProviders(TypeProvider provider, InputType inputModel) => throw new NotImplementedException();
        public override string LicenseString => "// License string";

        internal static void LoadMockPlugin(ScmTypeFactory? mockTypeFactory = null, Func<TypeProvider, InputType, IReadOnlyList<TypeProvider>>? serializationExtension = null)
        {
            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            // initialize the mock singleton instance of the plugin
            var mockPlugin = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            // invoke the load method with the config file path
            var loadMethod = typeof(Configuration).GetMethod("Load", BindingFlags.Static | BindingFlags.NonPublic);
            object?[] parameters = [configFilePath, null];
            var config = loadMethod?.Invoke(null, parameters);
            var mockGeneratorContext = new Mock<GeneratorContext>(config!);
            var mockPluginInstance = new Mock<ClientModelPlugin>(mockGeneratorContext.Object) { };
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory ?? new MockTypeFactory());
            mockPluginInstance.Setup(p => p.GetSerializationTypeProviders(It.IsAny<TypeProvider>(), It.IsAny<InputType>()))
                .Returns((TypeProvider provider, InputType inputModel) => serializationExtension?.Invoke(provider, inputModel) ?? throw new NotImplementedException());

            mockPlugin?.SetValue(null, mockPluginInstance.Object);
        }
    }
}

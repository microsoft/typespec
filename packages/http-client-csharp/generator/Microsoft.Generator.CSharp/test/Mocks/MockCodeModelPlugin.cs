// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class MockCodeModelPlugin : CodeModelPlugin
    {
        private static readonly string _mocksFolder = "Mocks";

        private static MockCodeModelPlugin? _instance;
#pragma warning disable CS0108 // Member hides inherited member; missing new keyword
        internal static MockCodeModelPlugin Instance => _instance ?? throw new InvalidOperationException("CodeModelPlugin is not loaded.");
#pragma warning restore CS0108 // Member hides inherited member; missing new keyword
        public MockCodeModelPlugin(GeneratorContext context) : base(context)
        {
            _instance = this;
        }

        public override TypeFactory TypeFactory => new MockTypeFactory();
        public override OutputLibrary OutputLibrary => throw new NotImplementedException();
        public override IReadOnlyList<TypeProvider> GetSerializationTypeProviders(TypeProvider provider, InputType inputModel) => throw new NotImplementedException();
        public override string LicenseString => "// License string";

        internal static void LoadMockPlugin()
        {
            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            // initialize the singleton instance of the plugin
            var mockPlugin = new MockCodeModelPlugin(new GeneratorContext(Configuration.Load(configFilePath)));

            CodeModelPlugin.Instance = mockPlugin;
        }
    }
}

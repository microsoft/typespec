// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class MockCodeModelPlugin : CodeModelPlugin
    {
        private static MockCodeModelPlugin? _instance;
#pragma warning disable CS0108 // Member hides inherited member; missing new keyword
        internal static MockCodeModelPlugin Instance => _instance ?? throw new InvalidOperationException("ClientModelPlugin is not loaded.");
#pragma warning restore CS0108 // Member hides inherited member; missing new keyword
        public MockCodeModelPlugin(GeneratorContext context) : base(context)
        {
            _instance = this;
        }

        public override ApiTypes ApiTypes => throw new NotImplementedException();
        public override TypeFactory TypeFactory => new MockTypeFactory();
        public override ExtensibleSnippets ExtensibleSnippets => throw new NotImplementedException();
        public override OutputLibrary OutputLibrary => throw new NotImplementedException();
        public override IReadOnlyList<TypeProvider> GetSerializationTypeProviders(ModelProvider provider, InputModelType inputModel) => throw new NotImplementedException();
        public override string LicenseString => "// License string";
    }
}

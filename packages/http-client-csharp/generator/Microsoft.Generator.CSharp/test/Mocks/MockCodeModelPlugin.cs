// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class MockCodeModelPlugin : CodeModelPlugin
    {
        public MockCodeModelPlugin(GeneratorContext context)
            : base(context)
        {
        }

        public override TypeFactory TypeFactory { get; } = new MockTypeFactory();
        public override OutputLibrary OutputLibrary => throw new NotImplementedException();
        public override IReadOnlyList<TypeProvider> GetSerializationTypeProviders(TypeProvider provider, InputType inputModel) => throw new NotImplementedException();
        public override string LicenseString => "// License string";
    }
}

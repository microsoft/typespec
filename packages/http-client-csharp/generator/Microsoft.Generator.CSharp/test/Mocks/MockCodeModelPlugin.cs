// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class MockCodeModelPlugin : CodeModelPlugin
    {
        internal MockCodeModelPlugin(Configuration configuration)
        {
            Configuration = configuration;
            TypeFactory = new MockTypeFactory();
        }

        public override string LicenseString => "// License string";
        public override Configuration Configuration { get; }

        public override TypeFactory TypeFactory { get; }
    }
}

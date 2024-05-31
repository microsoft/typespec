// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class MockCodeModelPlugin : CodeModelPlugin
    {
        internal MockCodeModelPlugin(Configuration configuration)
            : base(configuration)
        {
        }

        public override IReadOnlyList<TypeProvider> GetSerializationTypeProviders(ModelTypeProvider provider) => throw new NotImplementedException();
        public override string LiscenseString => "// License string";
    }
}

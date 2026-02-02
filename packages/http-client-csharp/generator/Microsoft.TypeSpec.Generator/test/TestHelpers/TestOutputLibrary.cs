// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public class TestOutputLibrary : OutputLibrary
    {
        private readonly TypeProvider[] _types;

        public TestOutputLibrary(TypeProvider typeProvider)
        {
            _types = [typeProvider];
        }

        protected override TypeProvider[] BuildTypeProviders() => _types;
    }
}

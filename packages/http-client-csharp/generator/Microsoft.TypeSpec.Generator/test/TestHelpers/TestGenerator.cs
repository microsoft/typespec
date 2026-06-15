// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class TestGenerator : CodeModelGenerator
    {
        public TestGenerator()
        {
        }

        public void AddCustomCodeAttributeProviderForTest(TypeProvider provider)
            => AddCustomCodeAttributeProvider(provider);
    }
}

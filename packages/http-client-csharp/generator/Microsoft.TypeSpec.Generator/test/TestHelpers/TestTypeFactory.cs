// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class TestTypeFactory : TypeFactory
    {
        public Type? InvokeCreateFrameworkType(string name)
        {
            return base.CreateFrameworkType(name);
        }
    }
}

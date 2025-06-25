// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests
{
    internal class TestClientTypeProvider : ClientProvider
    {
        public static readonly ClientProvider Empty = new TestClientTypeProvider();

        public TestClientTypeProvider() : base(InputFactory.Client("TestClient"))
        {
        }
    }
}

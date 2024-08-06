// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal class TestClientTypeProvider : ClientProvider
    {
        public static readonly ClientProvider Empty = new TestClientTypeProvider();

        public TestClientTypeProvider() : base(new InputClient("TestClient", "TestClient description", [], [], null))
        {
        }
    }
}

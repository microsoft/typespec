// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class MockTypeProvider : TypeProvider
    {
        public override string FileName => throw new NotImplementedException();
        public override string Name => throw new NotImplementedException();
    }
}

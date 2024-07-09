// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class MockTypeFactory : TypeFactory
    {
        public override CSharpType ListInitializationType => new CSharpType(typeof(List<>), arguments: typeof(int));
        public override CSharpType DictionaryInitializationType => new CSharpType(typeof(Dictionary<,>), arguments: [typeof(string), typeof(int)]);
    }
}

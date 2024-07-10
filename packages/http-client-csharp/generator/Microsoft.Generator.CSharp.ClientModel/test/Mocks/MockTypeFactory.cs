// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal class MockTypeFactory : ScmTypeFactory
    {
        public override CSharpType MatchConditionsType() => typeof(int);

        public override CSharpType TokenCredentialType() => typeof(int);
        public override CSharpType ListInitializationType => new CSharpType(typeof(List<>), arguments: typeof(int));
        public override CSharpType DictionaryInitializationType => new CSharpType(typeof(Dictionary<,>), arguments: [typeof(string), typeof(int)]);
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal class MockTypeFactory : ScmTypeFactory
    {
        public override MethodProviderCollection CreateMethodProviders(InputOperation operation, TypeProvider enclosingType)
        {
            throw new NotImplementedException();
        }

        public override ParameterProvider CreateCSharpParam(InputParameter parameter)
        {
            throw new NotImplementedException();
        }

        protected override CSharpType CreateCSharpTypeCore(InputType input)
        {
            throw new NotImplementedException();
        }

        public override CSharpType MatchConditionsType() => typeof(int);

        public override CSharpType TokenCredentialType() => typeof(int);
        public override CSharpType ListInitializationType => new CSharpType(typeof(List<>), arguments: typeof(int));
        public override CSharpType DictionaryInitializationType => new CSharpType(typeof(Dictionary<,>), arguments: [typeof(string), typeof(int)]);
    }
}

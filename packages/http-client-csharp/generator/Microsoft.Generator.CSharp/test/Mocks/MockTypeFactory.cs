// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class MockTypeFactory : TypeFactory
    {
        public override CSharpMethodCollection? CreateCSharpMethodCollection(InputOperation operation)
        {
            throw new NotImplementedException();
        }

        public override ParameterProvider CreateCSharpParam(InputParameter parameter)
        {
            throw new NotImplementedException();
        }

        public override CSharpType CreateCSharpType(InputType input)
        {
            throw new NotImplementedException();
        }

        public override CSharpType MatchConditionsType() => typeof(int);

        public override CSharpType PageResponseType() => typeof(int);

        public override CSharpType RequestConditionsType() => typeof(int);

        public override CSharpType TokenCredentialType() => typeof(int);
        public override CSharpType ListInitializationType => new CSharpType(typeof(List<>), arguments: typeof(int));
        public override CSharpType DictionaryInitializationType => new CSharpType(typeof(Dictionary<,>), arguments: [typeof(string), typeof(int)]);
    }
}

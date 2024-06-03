// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class MockTypeFactory : TypeFactory
    {
        public override CSharpMethodCollection? CreateCSharpMethodCollection(InputOperation operation)
        {
            throw new NotImplementedException();
        }

        public override Parameter CreateCSharpParam(InputParameter parameter)
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
        public override CSharpType ChangeTrackingListType => new CSharpType(typeof(IList<>), arguments: typeof(int));
        public override CSharpType ChangeTrackingDictionaryType => new CSharpType(typeof(IDictionary<,>), arguments: [typeof(string), typeof(int)]);
    }
}

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

        public override ParameterProvider GetParameterProvider(InputParameter parameter)
        {
            throw new NotImplementedException();
        }

        public override CSharpType CreateCSharpType(InputType input)
        {
            throw new NotImplementedException();
        }

        public override CSharpType ChangeTrackingListType => new CSharpType(typeof(List<>), arguments: typeof(int));
        public override CSharpType ChangeTrackingDictionaryType => new CSharpType(typeof(Dictionary<,>), arguments: [typeof(string), typeof(int)]);

        public override IReadOnlyList<TypeProvider> GetSerializationTypeProviders(ModelProvider provider) => throw new NotImplementedException();

    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal sealed class JsonObjectSerialization
    {
        public JsonObjectSerialization(TypeProvider provider, IReadOnlyList<Parameter> constructorParameters)
        {
            Type = provider.Type;
            ConstructorParameters = constructorParameters;
        }

        public CSharpType Type { get; }
        public IReadOnlyList<Parameter> ConstructorParameters { get; }
    }
}

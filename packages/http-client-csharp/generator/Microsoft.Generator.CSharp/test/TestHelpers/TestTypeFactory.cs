// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Tests
{
    public class TestTypeFactory : TypeFactory
    {
        // TODO: create some custom types to replace the existing models
        public override bool TryGetPropertyTypeReplacement(InputModelType inputModelType, [NotNullWhen(true)] out SystemObjectProvider? replacement)
        {
            return base.TryGetPropertyTypeReplacement(inputModelType, out replacement);
        }

        public override bool TryGetTypeReplacement(InputModelType inputModelType, [NotNullWhen(true)] out SystemObjectProvider? replacement)
        {
            return base.TryGetTypeReplacement(inputModelType, out replacement);
        }
    }
}

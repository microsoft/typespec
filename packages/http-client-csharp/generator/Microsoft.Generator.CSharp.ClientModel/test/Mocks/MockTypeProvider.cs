// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal class MockTypeProvider : TypeProvider
    {
        protected override string BuildRelativeFilePath()
        {
            throw new NotImplementedException();
        }

        protected override string BuildName()
        {
            throw new NotImplementedException();
        }
    }
}

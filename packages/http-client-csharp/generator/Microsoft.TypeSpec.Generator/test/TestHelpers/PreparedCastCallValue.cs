// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public sealed class PreparedCastCallValue
    {
        public static explicit operator PreparedCastCallValue(int value) => new PreparedCastCallValue();
    }
}

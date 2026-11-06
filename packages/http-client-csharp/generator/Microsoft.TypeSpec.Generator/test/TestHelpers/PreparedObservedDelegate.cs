// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public delegate string PreparedObservedDelegate(int value,
        [CallerArgumentExpression("value")] string? expression = "", [CallerLineNumber] int line = 0);
}

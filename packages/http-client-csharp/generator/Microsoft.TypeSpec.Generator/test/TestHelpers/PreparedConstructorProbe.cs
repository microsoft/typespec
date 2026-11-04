// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public sealed class PreparedConstructorProbe
    {
        public PreparedConstructorProbe(int value, [CallerArgumentExpression("value")] string? expression = "", [CallerLineNumber] int line = 0)
        {
            Observation = expression + "|" + line;
        }

        public string Observation { get; }
    }
}

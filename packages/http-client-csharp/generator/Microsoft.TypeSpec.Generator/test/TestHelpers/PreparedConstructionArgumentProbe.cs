// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedConstructionArgumentProbe
    {
        public static string ObservePair(object left, object right,
            [CallerArgumentExpression("left")] string leftExpression = "",
            [CallerArgumentExpression("right")] string rightExpression = "") => leftExpression + "|" + rightExpression;
        public static string OnlyInt(int value) => "int";
    }
}

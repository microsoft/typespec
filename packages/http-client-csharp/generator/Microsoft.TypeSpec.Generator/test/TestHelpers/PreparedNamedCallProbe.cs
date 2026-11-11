// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedNamedCallProbe
    {
        public static string Multiple(int first, int second,
            [CallerArgumentExpression("first")] string? firstExpression = "",
            [CallerArgumentExpression("second")] string? secondExpression = "",
            [CallerLineNumber] int line = 0) => firstExpression + "|" + secondExpression + "|" + line;
        public static string Repeated(int value, [CallerArgumentExpression("value")] string first = "",
            [CallerArgumentExpression("value")] string second = "") => first + "|" + second;
        public static string SafeNamed(string first, string second) => first + second;
        public static string SafeNamed(int first, int second) => (first + second).ToString();
    }
}

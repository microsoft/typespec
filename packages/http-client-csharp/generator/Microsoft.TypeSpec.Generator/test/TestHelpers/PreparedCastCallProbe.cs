// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedCastCallProbe
    {
        public static string ObserveObject(object? value, [CallerArgumentExpression("value")] string expression = "", [CallerLineNumber] int line = 0) => expression;
        public static string ObserveLong(long value, [CallerArgumentExpression("value")] string expression = "") => expression;
        public static string SafeCast(object value) => "object";
        public static string SafeCast(string value) => "string";
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedTypeOfCallProbe
    {
        public static string ObserveType(Type value, [CallerArgumentExpression("value")] string expression = "", [CallerLineNumber] int line = 0) => expression;
        public static string SafeType(Type value) => "type";
        public static string SafeType(object value) => "object";
        public static string OnlyString(string value) => value;
    }
}

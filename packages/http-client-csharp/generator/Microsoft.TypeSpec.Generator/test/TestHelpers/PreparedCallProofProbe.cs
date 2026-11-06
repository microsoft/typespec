// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedCallProofProbe
    {
        public static string Observe(int value, [CallerArgumentExpression("value")] string expression = "") => expression;
        public static string ObserveWithLine(int value, [CallerArgumentExpression("value")] string expression = "", [CallerLineNumber] int line = 0) => expression + ":" + line;
        public static string Safe(string value) => value;
        public static string Safe(int value) => value.ToString();
        public static string Mixed(string value) => value;
        public static string Mixed(int value, [CallerArgumentExpression("value")] string expression = "") => expression;
        public static string SafeWithGeneric(string value) => value;
        public static T SafeWithGeneric<T>(T value) => value;
        public static string SafeWithParams(string value) => value;
        public static string SafeWithParams(params int[] values) => values.Length.ToString();
        public static T Generic<T>(T value) => value;
        public static int Expanded(params int[] values) => values.Length;
    }
}

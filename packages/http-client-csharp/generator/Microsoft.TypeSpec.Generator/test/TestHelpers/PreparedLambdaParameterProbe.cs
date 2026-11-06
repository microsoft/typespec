// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedLambdaParameterProbe
    {
        public static string ObserveInt(Func<int, string> callback, [CallerArgumentExpression("callback")] string expression = "") => expression;
        public static string SafeInt(Func<int, string> callback) => "safe";
        public static string ObserveString(Func<string, string> callback, [CallerArgumentExpression("callback")] string expression = "") => expression;
        public static string SafeString(Func<string, string> callback) => "safe";
        public static string SafeMixed(Func<int, string, string> callback) => "safe";
        public static string Pair(Func<int, string> left, Func<string, string> right) => "pair";
        public static string Generic<T>(Func<T, string> callback, [CallerArgumentExpression("callback")] string expression = "") => expression;
        public static string Named(int value, Func<int, string> callback, [CallerArgumentExpression("callback")] string expression = "") => expression;
        public static string Overloaded(Func<int, string> callback) => "int";
        public static string Overloaded(Func<string, string> callback) => "string";
        public static string LeafInt(int value, [CallerArgumentExpression("value")] string expression = "") => expression;
        public static string LeafString(string value, [CallerArgumentExpression("value")] string expression = "") => expression;
    }
}

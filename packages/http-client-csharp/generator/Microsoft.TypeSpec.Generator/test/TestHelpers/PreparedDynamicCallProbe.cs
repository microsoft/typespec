// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedDynamicCallProbe
    {
        public static dynamic Leaf() => "leaf";
        public static object ObjectLeaf() => "leaf";
        public static string ObserveObject(object value, [CallerArgumentExpression("value")] string expression = "") => expression;
        public static string SafeObject(object value) => "safe";
        public static string Parent(object value, Func<string> callback, [CallerArgumentExpression("callback")] string expression = "") => expression;
        public static string ObserveLambda(Func<string> callback, [CallerArgumentExpression("callback")] string expression = "") => expression;
        public static string ObserveObjectLambda(Func<object> callback, [CallerArgumentExpression("callback")] string expression = "") => expression;
    }
}

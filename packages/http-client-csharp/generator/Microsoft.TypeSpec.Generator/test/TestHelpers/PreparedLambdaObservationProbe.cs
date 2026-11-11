// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedLambdaObservationProbe
    {
        public static string Observe(Func<string> callback, [CallerArgumentExpression("callback")] string expression = "", [CallerLineNumber] int line = 0) => expression;
        public static string Pair(Func<string> left, Func<string> right, [CallerArgumentExpression("left")] string expression = "") => expression;
        public static string Wrong(Func<int> callback) => "int";
        public static string ActionOnly(Action callback) => "action";
        public static string Leaf() => "leaf";
        public static string Safe(Func<string> callback) => "safe";
        public static string ExpressionOnly(System.Linq.Expressions.Expression<Func<string>> callback) => "tree";
        public static System.Threading.Tasks.Task<string> LeafTask() => System.Threading.Tasks.Task.FromResult("leaf");
        public static string OnlyTask(System.Threading.Tasks.Task<string> value) => "task";
        public static string LeafObserve(int value, [CallerArgumentExpression("value")] string expression = "") => expression;
    }
}

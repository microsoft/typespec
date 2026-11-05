// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedGenericCallProbe
    {
        public static string Observe<T>(int value, [CallerArgumentExpression("value")] string expression = "") => expression;
        public static T Identity<T>(T value) => value;
        public static string Overloaded<T>(int value) => "generic";
        public static string Overloaded(int value, [CallerArgumentExpression("value")] string expression = "") => "ordinary:" + expression;
        public static string Constrained<T>(int value) where T : class => "constraint";
        public static string Safe(int value) => "safe";
    }
}

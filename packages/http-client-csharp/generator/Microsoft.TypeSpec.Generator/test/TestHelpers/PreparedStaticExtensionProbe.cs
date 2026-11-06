// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedStaticExtensionProbe
    {
        public static string ObserveReceiver(this int receiver, int value, [CallerArgumentExpression("receiver")] string expression = "") => expression;
        public static string ObserveValue(this int receiver, int value, [CallerArgumentExpression("value")] string expression = "") => expression;
        public static string Safe(this int receiver, int value) => "safe";
        public static int Produce() => 1;
        public static int Unselected(int value) => value;
        public static int Unselected(long value) => (int)value;
        public static string GenericSafe<T>(this T receiver, int value) => "safe";
        public static T EchoReceiver<T>(this T receiver) => receiver;
        public static string ConstrainedReceiver<T>(this T receiver, int value) where T : class => "constraint";
        public static string ArgumentDependent<T>(this T receiver, T other) => "dependent";
        public static string Generic<T>(this T receiver, int value, [CallerArgumentExpression("receiver")] string expression = "") => expression;
        public static string AmbiguousCandidate(this int receiver, int value, [CallerArgumentExpression("receiver")] string expression = "") => expression;
        public static string ObserveInstance(this PreparedExtensionReceiver receiver, int value, [CallerArgumentExpression("receiver")] string expression = "") => expression;
    }
}

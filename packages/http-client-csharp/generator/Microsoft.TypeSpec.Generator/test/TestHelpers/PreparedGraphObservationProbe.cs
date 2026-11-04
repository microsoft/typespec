// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedGraphObservationProbe
    {
        public static string Unknown<T>(object value, [CallerArgumentExpression("value")] string expression = "") => expression;
        public static string UnknownClosure<T>(System.Func<string> value, [CallerArgumentExpression("value")] string expression = "") => expression;
        public static string UnknownConstrained<T>(object value, [CallerArgumentExpression("value")] string expression = "") where T : struct => expression;
        public static string UnknownClosureConstrained<T>(System.Func<string> value, [CallerArgumentExpression("value")] string expression = "") where T : struct => expression;
        public static string Repeated(object value, [CallerArgumentExpression("value")] string first = "", [CallerArgumentExpression("value")] string second = "") => first + "|" + second;
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedKeywordCallProbe
    {
        public static readonly PreparedObservedDelegate @namespace = (_, expression, _) => expression ?? "";
        public static readonly PreparedObservedDelegate SafeField = (_, expression, _) => expression ?? "";
        public static string @class(int value) => "safe";
        public static string @event(int value, [CallerArgumentExpression("value")] string expression = "") => expression;
        public static string Safe(int value) => "safe";
    }
}

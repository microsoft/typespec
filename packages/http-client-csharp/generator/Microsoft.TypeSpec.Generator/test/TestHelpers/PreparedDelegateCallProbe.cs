// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public sealed class PreparedDelegateCallProbe
    {
        public static readonly PreparedObservedDelegate Observed = (value, expression, line) => expression + "|" + line;
        public static readonly Func<int, string> Safe = value => value.ToString();
        public static readonly int NotDelegate = 0;
        public readonly PreparedObservedDelegate Instance = (value, expression, line) => expression + "|" + line;
        private static readonly PreparedObservedDelegate Hidden = Observed;
        public static int GetterCalls { get; private set; }
        public static PreparedObservedDelegate Property
        {
            get { GetterCalls++; return Observed; }
        }
        public static void ResetGetterCalls() => GetterCalls = 0;
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Original
{
    public static class Observer
    {
#line 300 "mapped-original.cs"
#line hidden
        public static object Capture(object value, [CallerArgumentExpression("value")] string text = "") => value;
#line default
#if FEATURE
        public static int Variant => 1;
#else
        public static int Variant => 2;
#endif
    }
}

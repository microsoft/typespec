// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Contracts
{
    public partial class Unsupported
    {
        public static string Unknown(object value, [CallerArgumentExpression("missing")] string text = "") => text;
        public static string NonOptional(object value, [CallerArgumentExpression("value")] string text) => text;
        public static int BadCallerType(object value, [CallerArgumentExpression("value")] int text = 0) => text;
        public static partial string Mismatch(object original, string text = "");
        public static partial string Mismatch(object renamed, [CallerArgumentExpression("renamed")] string text) => text;
    }
}

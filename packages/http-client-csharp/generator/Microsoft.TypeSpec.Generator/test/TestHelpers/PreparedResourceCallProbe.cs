// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Runtime.CompilerServices;
using System.Text.Json;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public static class PreparedResourceCallProbe
    {
        public static JsonDocument Make(string value) => JsonDocument.Parse(value);
        public static MemoryStream Make(int value) => new MemoryStream();
        public static string? LastCapturedText { get; private set; }
        public static JsonDocument Observe(string value, [CallerArgumentExpression("value")] string expression = "", [CallerLineNumber] int line = 0)
        {
            LastCapturedText = expression;
            return JsonDocument.Parse(value);
        }
    }
}

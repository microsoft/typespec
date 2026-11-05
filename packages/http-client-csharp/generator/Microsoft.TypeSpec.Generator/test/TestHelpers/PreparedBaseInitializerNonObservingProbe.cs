// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    public class PreparedBaseInitializerNonObservingProbe
    {
        public PreparedBaseInitializerNonObservingProbe(int value)
        {
            Value = value;
            CapturedText = "safe";
        }

        public int Value { get; }
        public string CapturedText { get; }
    }
}

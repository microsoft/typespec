// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Runtime.CompilerServices;

namespace Microsoft.TypeSpec.Generator.Tests.TestHelpers
{
    // Public and nonsealed: emitted derived assemblies must actually inherit this metadata type.
    public class PreparedBaseInitializerProbe
    {
        public PreparedBaseInitializerProbe(int value, [CallerArgumentExpression("value")] string expression = "")
        {
            Value = value;
            CapturedText = expression;
        }

        public int Value { get; }
        public string CapturedText { get; }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace System.Runtime.CompilerServices
{
    public sealed class CallerArgumentExpressionAttribute : System.Attribute
    {
        public CallerArgumentExpressionAttribute(string[] names) { }
    }
}

namespace Contracts
{
    public static class AttributeShape
    {
        public static string Capture(object value,
            [System.Runtime.CompilerServices.CallerArgumentExpression(new[] { "value" })] string text = "") => text;
    }
}

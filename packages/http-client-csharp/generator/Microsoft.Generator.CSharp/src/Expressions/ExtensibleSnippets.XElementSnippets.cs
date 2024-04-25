// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public abstract partial class ExtensibleSnippets
    {
        public abstract class XElementSnippets
        {
            public abstract ValueExpression GetBytesFromBase64Value(XElementExpression xElement, string? format);
            public abstract ValueExpression GetDateTimeOffsetValue(XElementExpression xElement, string? format);
            public abstract ValueExpression GetObjectValue(XElementExpression xElement, string? format);
            public abstract ValueExpression GetTimeSpanValue(XElementExpression xElement, string? format);
        }
    }
}

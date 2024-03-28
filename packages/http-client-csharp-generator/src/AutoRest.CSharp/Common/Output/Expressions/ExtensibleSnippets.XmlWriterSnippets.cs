// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions
{
    internal abstract partial class ExtensibleSnippets
    {
        internal abstract class XmlWriterSnippets
        {
            public abstract MethodBodyStatement WriteValue(XmlWriterExpression xmlWriter, ValueExpression value, string format);
            public abstract MethodBodyStatement WriteObjectValue(XmlWriterExpression xmlWriter, ValueExpression value, string? nameHint);
        }
    }
}

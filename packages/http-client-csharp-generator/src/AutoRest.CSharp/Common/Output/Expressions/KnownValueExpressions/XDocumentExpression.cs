// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Xml.Linq;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record XDocumentExpression(ValueExpression Untyped) : TypedValueExpression<XDocument>(Untyped)
    {
        public static XDocumentExpression Load(StreamExpression stream, LoadOptions loadOptions)
            => new(InvokeStatic(nameof(XDocument.Load), stream, FrameworkEnumValue(loadOptions)));

        public XElementExpression Element(string name) => new(Invoke(nameof(XDocument.Element), Literal(name)));
    }
}

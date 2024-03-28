// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Xml.Linq;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record XContainerExpression(ValueExpression Untyped) : TypedValueExpression<XContainer>(Untyped)
    {
        public XElementExpression Element(string name) => new(Invoke(nameof(XDocument.Element), Snippets.Literal(name)));
        public EnumerableExpression Elements() => new(typeof(XElement), Invoke(nameof(XDocument.Elements)));
        public EnumerableExpression Elements(string name) => new(typeof(XElement), Invoke(nameof(XDocument.Elements), Snippets.Literal(name)));

        public static implicit operator XContainerExpression(XElementExpression xElement) => new(xElement.Untyped);
        public static implicit operator XContainerExpression(XDocumentExpression xDocument) => new(xDocument.Untyped);
    }
}

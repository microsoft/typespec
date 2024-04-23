// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Xml.Linq;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record XDocumentExpression(ValueExpression Untyped) : TypedValueExpression<XDocument>(Untyped)
    {
        public static XDocumentExpression Load(StreamExpression stream, LoadOptions loadOptions)
            => new(InvokeStatic(nameof(XDocument.Load), stream, Snippets.FrameworkEnumValue(loadOptions)));

        public XElementExpression Element(string name) => new(Invoke(nameof(XDocument.Element), Snippets.Literal(name)));
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace TypeSpec.Generator.Statements
{
    public sealed class XmlDocReturnsStatement : XmlDocStatement
    {
        public XmlDocReturnsStatement(FormattableString text)
            : base("<returns>", "</returns>", [text])
        {
        }
    }
}

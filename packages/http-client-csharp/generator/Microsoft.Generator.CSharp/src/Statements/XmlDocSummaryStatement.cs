// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class XmlDocSummaryStatement : XmlDocStatement
    {
        public XmlDocSummaryStatement(IReadOnlyList<FormattableString> lines, params XmlDocStatement[] innerStatements)
            : base("<summary>", "</summary>", lines, innerStatements: innerStatements)
        {
        }
    }
}

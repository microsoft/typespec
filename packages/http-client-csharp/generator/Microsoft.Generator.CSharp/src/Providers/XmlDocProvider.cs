// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    public class XmlDocProvider
    {
        public XmlDocProvider()
        {
            Params = new List<XmlDocParamStatement>();
            Exceptions = new List<XmlDocExceptionStatement>();
        }

        public XmlDocSummaryStatement? Summary { get; set; }
        public IList<XmlDocParamStatement> Params { get; }
        public XmlDocReturnsStatement? Returns { get; set; }
        public IList<XmlDocExceptionStatement> Exceptions { get; }
    }
}

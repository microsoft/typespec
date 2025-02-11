// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class XmlDocProvider
    {
        public XmlDocProvider()
        {
            Params = new List<XmlDocParamStatement>();
            Exceptions = new List<XmlDocExceptionStatement>();
        }

        private static XmlDocProvider? _inheritDocs;
        public static XmlDocProvider InheritDocs => _inheritDocs ??= new XmlDocProvider { Inherit = new XmlDocInheritStatement() };

        public XmlDocSummaryStatement? Summary { get; set; }
        public IList<XmlDocParamStatement> Params { get; }
        public XmlDocReturnsStatement? Returns { get; set; }
        public IList<XmlDocExceptionStatement> Exceptions { get; }
        public XmlDocInheritStatement? Inherit { get; set;  }
    }
}

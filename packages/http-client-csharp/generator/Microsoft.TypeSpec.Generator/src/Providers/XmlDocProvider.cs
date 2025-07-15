// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class XmlDocProvider
    {
        public static XmlDocProvider Empty { get; } = new XmlDocProvider();
        public static XmlDocProvider InheritDocs { get; } = new XmlDocProvider { Inherit = new XmlDocInheritStatement() };

        public XmlDocProvider(
            XmlDocSummaryStatement? summary = null,
            ParametersXmlDocProvider? parameters = null,
            IReadOnlyList<XmlDocExceptionStatement>? exceptions = null,
            XmlDocReturnsStatement? returns = null,
            XmlDocInheritStatement? inherit = null)
        {
            Summary = summary;
            Parameters = parameters;
            Exceptions = exceptions ?? new List<XmlDocExceptionStatement>();
            Returns = returns;
            Inherit = inherit;
        }

        public XmlDocSummaryStatement? Summary { get; private set; }
        public ParametersXmlDocProvider? Parameters { get; private set; }
        public XmlDocReturnsStatement? Returns { get; private set; }
        public IReadOnlyList<XmlDocExceptionStatement> Exceptions { get; private set; }
        public XmlDocInheritStatement? Inherit { get; private set; }

        public void Update(
            XmlDocSummaryStatement? summary = null,
            ParametersXmlDocProvider? parameters = null,
            IReadOnlyList<XmlDocExceptionStatement>? exceptions = null,
            XmlDocReturnsStatement? returns = null,
            XmlDocInheritStatement? inherit = null)
        {
            if (summary != null)
            {
                Summary = summary;
            }

            if (parameters != null)
            {
                Parameters = parameters;
            }

            if (exceptions != null)
            {
                Exceptions = exceptions;
            }

            if (returns != null)
            {
                Returns = returns;
            }

            if (inherit != null)
            {
                Inherit = inherit;
            }
        }
    }
}

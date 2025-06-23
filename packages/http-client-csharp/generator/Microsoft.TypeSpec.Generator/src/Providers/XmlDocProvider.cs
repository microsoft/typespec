// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class XmlDocProvider
    {
        public static XmlDocProvider Empty => new XmlDocProvider();

        public bool IsEmpty =>
            Summary == null &&
            (Parameters == null || Parameters.Count == 0) &&
            (Exceptions == null || Exceptions.Count == 0) &&
            Returns == null &&
            Inherit == null;

        public XmlDocProvider(
            XmlDocSummaryStatement? summary = null,
            IReadOnlyList<XmlDocParamStatement>? parameters = null,
            IReadOnlyList<XmlDocExceptionStatement>? exceptions = null,
            XmlDocReturnsStatement? returns = null,
            XmlDocInheritStatement? inherit = null)
        {
            Summary = summary;
            Parameters = parameters ?? new List<XmlDocParamStatement>();
            Exceptions = exceptions ?? new List<XmlDocExceptionStatement>();
            Returns = returns;
            Inherit = inherit;
        }

        private static XmlDocProvider? _inheritDocs;

        public static XmlDocProvider InheritDocs =>
            _inheritDocs ??= new XmlDocProvider { Inherit = new XmlDocInheritStatement() };

        public XmlDocSummaryStatement? Summary { get; private set; }
        public IReadOnlyList<XmlDocParamStatement> Parameters { get; private set; }
        public XmlDocReturnsStatement? Returns { get; private set; }
        public IReadOnlyList<XmlDocExceptionStatement> Exceptions { get; private set; }
        public XmlDocInheritStatement? Inherit { get; private set; }

        public void Update(
            XmlDocSummaryStatement? summary = null,
            IReadOnlyList<XmlDocParamStatement>? parameters = null,
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

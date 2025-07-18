// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class XmlDocProvider
    {
        public static XmlDocProvider Empty { get; } = new XmlDocProvider();
        public static XmlDocProvider InheritDocs { get; } = new XmlDocProvider { Inherit = new XmlDocInheritStatement() };

        private IReadOnlyList<ParameterProvider>? _parameters;

        public XmlDocProvider(
            XmlDocSummaryStatement? summary = null,
            IReadOnlyList<ParameterProvider>? parameters = null,
            IReadOnlyList<XmlDocExceptionStatement>? exceptions = null,
            XmlDocReturnsStatement? returns = null,
            XmlDocInheritStatement? inherit = null)
        {
            Summary = summary;
            _parameters = parameters;
            Exceptions = exceptions ?? new List<XmlDocExceptionStatement>();
            Returns = returns;
            Inherit = inherit;
        }

        public XmlDocSummaryStatement? Summary { get; private set; }

        private IReadOnlyList<XmlDocParamStatement>? _parameterStatements;
        public IReadOnlyList<XmlDocParamStatement> Parameters => _parameterStatements ??= _parameters?.Select(p => new XmlDocParamStatement(p)).ToArray() ?? [];
        public XmlDocReturnsStatement? Returns { get; private set; }
        public IReadOnlyList<XmlDocExceptionStatement> Exceptions { get; private set; }
        public XmlDocInheritStatement? Inherit { get; private set; }

        public void Update(
            XmlDocSummaryStatement? summary = null,
            IReadOnlyList<ParameterProvider>? parameters = null,
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
                _parameters = parameters;
                _parameterStatements = null; // Reset the cached parameter statements
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

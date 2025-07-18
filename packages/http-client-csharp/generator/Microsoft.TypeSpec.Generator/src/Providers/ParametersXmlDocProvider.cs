// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Providers
{
    public class ParametersXmlDocProvider
    {
        public ParametersXmlDocProvider(IReadOnlyList<ParameterProvider> parameters)
        {
            Parameters = parameters;
        }

        public IReadOnlyList<ParameterProvider> Parameters { get; }

        private IReadOnlyList<XmlDocParamStatement>? _statements;
        internal IReadOnlyList<XmlDocParamStatement> Statements => _statements ??= Parameters.Select(p => new XmlDocParamStatement(p)).ToArray();
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class XmlDocParamStatement : XmlDocStatement
    {
        public XmlDocParamStatement(ParameterProvider parameter)
            : this(parameter, [parameter.Description])
        {
        }

        internal XmlDocParamStatement(ParameterProvider parameter, IEnumerable<FormattableString> lines, params XmlDocStatement[] innerStatements)
            : base($"<param name=\"{parameter.AsVariable().Declaration}\">", $"</param>", lines, innerStatements)
        {
            Parameter = parameter;
        }

        public ParameterProvider Parameter { get; }
    }
}

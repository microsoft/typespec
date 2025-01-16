// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class XmlDocParamStatement : XmlDocStatement
    {
        public XmlDocParamStatement(ParameterProvider parameter)
            : base($"<param name=\"{parameter.AsExpression().Declaration}\">", $"</param>", [parameter.Description])
        {
            Parameter = parameter;
        }

        public ParameterProvider Parameter { get; }
    }
}

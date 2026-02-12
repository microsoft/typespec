// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class XmlDocParamStatement : XmlDocStatement
    {
        public XmlDocParamStatement(ParameterProvider parameter)
            : base($"<param name=\"{parameter.AsVariable().Declaration}\">", $"</param>", [parameter.Description])
        {
            Parameter = parameter;
        }

        public ParameterProvider Parameter { get; }
    }
}

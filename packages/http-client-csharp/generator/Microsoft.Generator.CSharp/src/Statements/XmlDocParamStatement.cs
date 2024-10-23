// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class XmlDocParamStatement : XmlDocStatement
    {
        public XmlDocParamStatement(string paramName, FormattableString text)
            : base($"<param name=\"{paramName}\">", "</param>", [text])
        {
            ParamName = paramName;
        }

        public string ParamName { get; }
    }
}
